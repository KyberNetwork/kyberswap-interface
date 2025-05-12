import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  SwapStatus,
  NonEvmChain,
  QuoteParams,
} from './BaseSwapAdapter'
import { formatUnits } from 'viem'
import { ZERO_ADDRESS } from 'constants/index'

//const erc20Abi = [
//  {
//    inputs: [
//      { type: 'address', name: 'recipient' },
//      { type: 'uint256', name: 'amount' },
//    ],
//    name: 'transfer',
//    outputs: [{ type: 'bool', name: '' }],
//    stateMutability: 'nonpayable',
//    type: 'function',
//  },
//]

const OPTIMEX_API = 'https://ks-provider.optimex.xyz/v1'

interface OptimexToken {
  id: number
  network_id: 'ethereum' | 'bitcoin'
  token_id: string
  network_name: string
  network_symbol: string
  network_type: 'EVM' | 'BTC'
  token_name: string
  token_symbol: string
  token_address: string
  token_decimals: number
  token_logo_uri: string
  network_logo_uri: string
  active: boolean
}

export class OptimexAdapter extends BaseSwapAdapter {
  private tokens: OptimexToken[]

  constructor() {
    super()
    this.tokens = []
  }

  private async getTokens() {
    try {
      const res = await fetch(`${OPTIMEX_API}/provider/tokens`)
      const { data } = await res.json()
      this.tokens = data.tokens
    } catch (error) {
      console.error('Failed to initialize Optimex tokens:', error)
      // Handle error appropriately
    }
  }
  getName(): string {
    return 'Optimex'
  }
  getIcon(): string {
    return 'https://app.optimex.xyz/icons/favicon.ico'
  }
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Bitcoin, ChainId.MAINNET]
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    if (!this.tokens?.length) {
      await this.getTokens()
    }

    const isFromBtc = params.fromChain === NonEvmChain.Bitcoin
    const isToBtc = params.toChain === NonEvmChain.Bitcoin
    const fromTokenId = isFromBtc
      ? 'BTC'
      : this.tokens.find(item => {
          const address = (params.fromToken as any).isNative ? 'native' : (params.fromToken as any).wrapped.address
          return item.network_id === 'ethereum' && address.toLowerCase() === item.token_address.toLowerCase()
        })?.token_id
    const toTokenId = isToBtc
      ? 'BTC'
      : this.tokens.find(item => {
          const address = (params.toToken as any).isNative ? 'native' : (params.toToken as any).wrapped.address
          return item.network_id === 'ethereum' && address.toLowerCase() === item.token_address.toLowerCase()
        })?.token_id

    if (!fromTokenId || !toTokenId) {
      console.log('optimex tokens', this.tokens)
      throw new Error(`Optimex does not support ${!fromTokenId ? params.fromToken.symbol : params.toToken.symbol}`)
    }

    const [quoteRes, estimateRes] = await Promise.all([
      fetch(`${OPTIMEX_API}/provider/solver/indicative-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          affiliate_fee_bps: '0',
          debug: true,
          from_token_amount: params.amount,
          from_token_id: fromTokenId,
          to_token_id: toTokenId,
        }),
      }).then(res => res.json()),
      fetch(`${OPTIMEX_API}/provider/trades/estimate?from_token=${fromTokenId}&to_token=${toTokenId}`).then(res =>
        res.json(),
      ),
    ])

    if (params.sender && params.recipient) {
      await new Promise(r => setTimeout(r, 2000))
      const tradeTimeout = new Date()
      tradeTimeout.setHours(tradeTimeout.getHours() + 2)

      const scriptTimeout = new Date()
      scriptTimeout.setHours(scriptTimeout.getHours() + 24)

      const res = await fetch(`${OPTIMEX_API}/provider/trades/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: quoteRes.data.session_id,
          from_user_address: params.sender,
          amount_in: params.amount,
          // TODO: Handle slippage
          min_amount_out: params.amount,
          to_user_address: params.recipient,
          user_refund_pubkey: params.sender,
          user_refund_address: params.sender,
          creator_public_key: params.sender,
          from_wallet_address: params.sender,
          trade_timeout: Math.floor(tradeTimeout.getTime() / 1000),
          script_timeout: Math.floor(scriptTimeout.getTime() / 1000),
        }),
      }).then(res => res.json())

      console.log(res)
    }

    const formattedOutputAmount = formatUnits(BigInt(quoteRes.data.best_quote_after_fees), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)

    return {
      quoteParams: params,
      outputAmount: BigInt(quoteRes.data.best_quote_after_fees),
      formattedOutputAmount,
      // TODO: handle usd value
      inputUsd: 0,
      outputUsd: 0,
      priceImpact: 0,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: estimateRes.data.estimated_time, // TODO
      // Near intent dont need to approve, we send token to contract directly
      contractAddress: ZERO_ADDRESS,
      rawQuote: quoteRes.data,
    }
  }

  async executeSwap(): //quote: Quote, walletClient: WalletClient
  Promise<NormalizedTxResponse> {
    throw new Error('Method not implemented.')
  }

  async getTransactionStatus(): //p: NormalizedTxResponse
  Promise<SwapStatus> {
    throw new Error('Method not implemented.')

    //return {
    //  txHash: res.swapDetails?.destinationChainTxHashes[0]?.hash || '',
    //  // TODO: Handle Refund status
    //  status: res.status === 'SUCCESS' ? 'filled' : 'pending',
    //}
  }
}
