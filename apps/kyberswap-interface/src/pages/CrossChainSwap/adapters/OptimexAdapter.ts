import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletClient, formatUnits } from 'viem'

import { CROSS_CHAIN_FEE_RECEIVER, ZERO_ADDRESS } from 'constants/index'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  NonEvmChain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

const OPTIMEX_API = 'https://ks-provider.optimex.xyz/v1'

// TODO: remember to add new supported chains to this map
//  Map from ChainID to Optimex network_id
const CHAIN_TO_OPTIMEX_NETWORK: Partial<Record<Chain, string>> = {
  [NonEvmChain.Bitcoin]: 'bitcoin',
  [ChainId.MAINNET]: 'ethereum',
  [ChainId.BASE]: 'base',
  [ChainId.ARBITRUM]: 'arbitrum',
  [ChainId.BSCMAINNET]: 'bsc',
  [ChainId.OPTIMISM]: 'optimism',
}

interface OptimexToken {
  id: number
  network_id: string // Optimex network identifier (e.g., 'ethereum', 'bitcoin', 'base', etc.)
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
      const res = await fetch(`${OPTIMEX_API}/tokens`)
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
    return 'https://storage.googleapis.com/ks-setting-1d682dca/464ce79e-a906-4590-bf78-9054e606aa041749023419612.png'
  }
  getSupportedChains(): Chain[] {
    return [NonEvmChain.Bitcoin, ChainId.MAINNET, ChainId.BASE, ChainId.ARBITRUM, ChainId.BSCMAINNET, ChainId.OPTIMISM]
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
    const fromNetworkId = CHAIN_TO_OPTIMEX_NETWORK[params.fromChain]
    if (!fromNetworkId) {
      throw new Error(`Optimex does not support source chain: ${params.fromChain}`)
    }

    const toNetworkId = CHAIN_TO_OPTIMEX_NETWORK[params.toChain]
    if (!toNetworkId) {
      throw new Error(`Optimex does not support destination chain: ${params.toChain}`)
    }

    const fromToken = isFromBtc
      ? { token_id: 'BTC', token_symbol: 'BTC' }
      : this.tokens.find(item => {
          const address = (params.fromToken as any).isNative ? 'native' : (params.fromToken as any).wrapped.address
          return item.network_id === fromNetworkId && address.toLowerCase() === item.token_address.toLowerCase()
        })
    const fromTokenId = fromToken?.token_id

    const toToken = isToBtc
      ? { token_id: 'BTC', token_symbol: 'BTC' }
      : this.tokens.find(item => {
          const address = (params.toToken as any).isNative ? 'native' : (params.toToken as any).wrapped.address
          return item.network_id === toNetworkId && address.toLowerCase() === item.token_address.toLowerCase()
        })
    const toTokenId = toToken?.token_id

    if (!fromTokenId || !toTokenId) {
      console.log('optimex tokens', this.tokens)
      throw new Error(`Optimex does not support ${!fromTokenId ? params.fromToken.symbol : params.toToken.symbol}`)
    }

    const userRefundPubkey = params.fromChain === NonEvmChain.Bitcoin ? params.publicKey : params.sender

    const [quoteRes, estimateRes, token0Usd, token1Usd] = await Promise.all([
      fetch(`${OPTIMEX_API}/solver/indicative-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debug: false,
          from_token_amount: params.amount,
          from_token_id: fromTokenId,
          to_token_id: toTokenId,
          affiliate_fee_bps: params.feeBps.toString(),
          from_user_address: params.sender,
          user_receiving_address: params.recipient,
          user_refund_pubkey: userRefundPubkey,
        }),
      }).then(res => res.json()),
      fetch(`${OPTIMEX_API}/trades/estimate?from_token=${fromTokenId}&to_token=${toTokenId}`).then(res => res.json()),
      fetch(`https://api.optimex.xyz/v1/tokens/${fromToken.token_symbol}`)
        .then(res => res.json())
        .then(res => res?.data?.current_price || 0),
      fetch(`https://api.optimex.xyz/v1/tokens/${toToken.token_symbol}`)
        .then(res => res.json())
        .then(res => res?.data?.current_price || 0),
    ])

    let txData: { deposit_address: string; payload?: string; trade_id: string } | null = null

    if (params.sender && params.recipient && (isFromBtc ? params.publicKey : true)) {
      const tradeTimeout = new Date()
      tradeTimeout.setHours(tradeTimeout.getHours() + 2)

      const scriptTimeout = new Date()
      scriptTimeout.setHours(scriptTimeout.getHours() + 24)

      const res = await fetch(`${OPTIMEX_API}/trades/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: quoteRes.data.session_id,
          from_user_address: params.sender,
          amount_in: params.amount,
          min_amount_out: (
            (BigInt(quoteRes.data.best_quote_after_fees) * (10_000n - BigInt(params.slippage))) /
            10_000n
          ).toString(),
          to_user_address: params.recipient,
          user_refund_pubkey: userRefundPubkey,
          user_refund_address: params.sender,
          creator_public_key: params.fromChain === NonEvmChain.Bitcoin ? params.publicKey : params.sender,
          from_wallet_address: params.sender,
          trade_timeout: Math.floor(tradeTimeout.getTime() / 1000),
          script_timeout: Math.floor(scriptTimeout.getTime() / 1000),
          affiliate_info: [
            {
              provider: 'KyberSwap',
              rate: params.feeBps.toString(),
              receiver: CROSS_CHAIN_FEE_RECEIVER,
              network: 'ethereum',
            },
          ],
        }),
      }).then(res => res.json())

      if (res.data.deposit_address) {
        txData = res.data
      }
    }

    const formattedOutputAmount = formatUnits(BigInt(quoteRes.data.best_quote_after_fees), params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = token0Usd * +formattedInputAmount
    const outputUsd = token1Usd * +formattedOutputAmount

    return {
      quoteParams: params,
      outputAmount: BigInt(quoteRes.data.best_quote_after_fees),
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      gasFeeUsd: 0,
      timeEstimate: estimateRes.data.estimated_time,
      contractAddress: txData?.deposit_address || ZERO_ADDRESS,
      rawQuote: { ...quoteRes.data, txData },

      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10000,
    }
  }

  async executeSwap(
    { quote }: Quote,
    walletClient: WalletClient,
    _nearWallet: any,
    sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
  ): Promise<NormalizedTxResponse> {
    const params = {
      sender: quote.quoteParams.sender,
      id: quote.rawQuote.txData.trade_id,
      adapter: this.getName(),
      sourceChain: quote.quoteParams.fromChain,
      targetChain: quote.quoteParams.toChain,
      inputAmount: quote.quoteParams.amount,
      outputAmount: quote.outputAmount.toString(),
      sourceToken: quote.quoteParams.fromToken,
      targetToken: quote.quoteParams.toToken,
      timestamp: new Date().getTime(),
      amountInUsd: quote.inputUsd,
      amountOutUsd: quote.outputUsd,
      platformFeePercent: quote.platformFeePercent,
      recipient: quote.quoteParams.recipient,
    }
    if (quote.quoteParams.fromChain === NonEvmChain.Bitcoin) {
      if (!sendBtcFn) throw new Error('sendBtcFn is not defined')
      const res = await sendBtcFn({
        recipient: quote.rawQuote.txData.deposit_address,
        amount: quote.quoteParams.amount,
      }).catch(e => {
        throw e
      })
      await fetch(`${OPTIMEX_API}/trades/${quote.rawQuote.txData.trade_id}/submit-tx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_id: res,
        }),
      }).catch(e => {
        console.log('submit tx error for optimex', e)
      })
      return {
        ...params,
        sourceTxHash: res,
      }
    }

    if (!walletClient || !walletClient.account) throw new Error('Not connected')

    const account = walletClient.account?.address as `0x${string}`
    const hash = await walletClient.sendTransaction({
      to: quote.rawQuote.txData.deposit_address,
      value: (quote.quoteParams.fromToken as any).isNative ? BigInt(quote.quoteParams.amount) : undefined,
      data: quote.rawQuote.txData.payload,
      chain: undefined,
      account,
    })

    await fetch(`${OPTIMEX_API}/trades/${quote.rawQuote.txData.trade_id}/submit-tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_id: hash,
      }),
    }).catch(e => {
      console.log('submit tx error for optimex', e)
    })
    return {
      ...params,
      sourceTxHash: hash,
    }
  }

  async getTransactionStatus(p: NormalizedTxResponse): Promise<SwapStatus> {
    const res = await fetch(`${OPTIMEX_API}/trades/${p.id}`).then(res => res.json())

    return {
      txHash: res.data?.payment_bundle?.settlement_tx || '',
      status: ['Done', 'PaymentConfirmed'].includes(res?.data?.state)
        ? 'Success'
        : ['Aborted', 'ToBeAborted', 'Failed', 'Failure', 'UserCancelled'].includes(res?.data?.state)
        ? 'Failed'
        : res?.data?.state === 'Refunded'
        ? 'Refunded'
        : 'Processing',
    }
  }
}
