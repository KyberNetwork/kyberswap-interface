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

  private async initiateTrade(params: {
    sessionId: string
    fromUserAddress: string
    amountIn: string
    minAmountOut: string
    toUserAddress: string
    userRefundPubkey: string | undefined
    userRefundAddress: string
    creatorPublicKey: string | undefined
    fromWalletAddress: string
    feeBps: string
  }): Promise<{ deposit_address: string; payload?: string; trade_id: string }> {
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
        session_id: params.sessionId,
        from_user_address: params.fromUserAddress,
        amount_in: params.amountIn,
        min_amount_out: params.minAmountOut,
        to_user_address: params.toUserAddress,
        user_refund_pubkey: params.userRefundPubkey || params.fromUserAddress,
        user_refund_address: params.userRefundAddress,
        creator_public_key: params.creatorPublicKey,
        from_wallet_address: params.fromWalletAddress,
        trade_timeout: Math.floor(tradeTimeout.getTime() / 1000),
        script_timeout: Math.floor(scriptTimeout.getTime() / 1000),
        affiliate_info: [
          {
            provider: 'KyberSwap',
            rate: params.feeBps,
            receiver: CROSS_CHAIN_FEE_RECEIVER,
            network: 'ethereum',
          },
        ],
      }),
    }).then(res => res.json())

    if (!res.data?.deposit_address) {
      throw new Error('Failed to initiate trade with Optimex')
    }

    return res.data
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

    // For any flow going TO BTC (EVM->BTC, etc.), we need to call initiate in getQuote
    // to get deposit address for frontend approval checks
    if (params.sender && params.recipient && isToBtc) {
      try {
        txData = await this.initiateTrade({
          sessionId: quoteRes.data.session_id,
          fromUserAddress: params.sender,
          amountIn: params.amount,
          minAmountOut: (
            (BigInt(quoteRes.data.best_quote_after_fees) * (10_000n - BigInt(params.slippage))) /
            10_000n
          ).toString(),
          toUserAddress: params.recipient,
          userRefundPubkey: userRefundPubkey,
          userRefundAddress: params.sender,
          creatorPublicKey: params.fromChain === NonEvmChain.Bitcoin ? params.publicKey : params.sender,
          fromWalletAddress: params.sender,
          feeBps: params.feeBps.toString(),
        })
      } catch (error) {
        console.log('Failed to initiate trade in getQuote:', error)
        // Continue without txData for TO BTC flows - will try again in executeSwap
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
    // For EVM -> BTC flow, txData should already exist from getQuote
    // For BTC -> EVM flow, we need to initiate the trade here
    let txData: { deposit_address: string; payload?: string; trade_id: string }

    if (quote.rawQuote.txData) {
      // EVM -> BTC flow: use existing txData from getQuote
      txData = quote.rawQuote.txData
    } else {
      // BTC -> EVM flow: initiate trade now
      const isFromBtc = quote.quoteParams.fromChain === NonEvmChain.Bitcoin
      const isToBtc = quote.quoteParams.toChain === NonEvmChain.Bitcoin

      // Get network and token info (only needed for BTC -> EVM flow)
      const fromNetworkId = CHAIN_TO_OPTIMEX_NETWORK[quote.quoteParams.fromChain]
      if (!fromNetworkId) {
        throw new Error(`Optimex does not support source chain: ${quote.quoteParams.fromChain}`)
      }

      const toNetworkId = CHAIN_TO_OPTIMEX_NETWORK[quote.quoteParams.toChain]
      if (!toNetworkId) {
        throw new Error(`Optimex does not support destination chain: ${quote.quoteParams.toChain}`)
      }

      // Find tokens
      const fromToken = isFromBtc
        ? { token_id: 'BTC', token_symbol: 'BTC' }
        : this.tokens.find(item => {
            const address = (quote.quoteParams.fromToken as any).isNative
              ? 'native'
              : (quote.quoteParams.fromToken as any).wrapped.address
            return item.network_id === fromNetworkId && address.toLowerCase() === item.token_address.toLowerCase()
          })
      const toToken = isToBtc
        ? { token_id: 'BTC', token_symbol: 'BTC' }
        : this.tokens.find(item => {
            const address = (quote.quoteParams.toToken as any).isNative
              ? 'native'
              : (quote.quoteParams.toToken as any).wrapped.address
            return item.network_id === toNetworkId && address.toLowerCase() === item.token_address.toLowerCase()
          })
      const fromTokenId = fromToken?.token_id
      const toTokenId = toToken?.token_id

      if (!fromTokenId || !toTokenId) {
        throw new Error(
          `Optimex does not support ${
            !fromTokenId ? quote.quoteParams.fromToken.symbol : quote.quoteParams.toToken.symbol
          }`,
        )
      }

      const userRefundPubkey =
        quote.quoteParams.fromChain === NonEvmChain.Bitcoin ? quote.quoteParams.publicKey : quote.quoteParams.sender

      // Initiate trade using the reusable function
      txData = await this.initiateTrade({
        sessionId: quote.rawQuote.session_id,
        fromUserAddress: quote.quoteParams.sender,
        amountIn: quote.quoteParams.amount,
        minAmountOut: (
          (BigInt(quote.outputAmount) * (10_000n - BigInt(quote.quoteParams.slippage))) /
          10_000n
        ).toString(),
        toUserAddress: quote.quoteParams.recipient,
        userRefundPubkey: userRefundPubkey,
        userRefundAddress: quote.quoteParams.sender,
        creatorPublicKey: userRefundPubkey,
        fromWalletAddress: quote.quoteParams.sender,
        feeBps: quote.quoteParams.feeBps.toString(),
      })
    }

    const params = {
      sender: quote.quoteParams.sender,
      id: txData.trade_id,
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
        recipient: txData.deposit_address,
        amount: quote.quoteParams.amount,
      }).catch(e => {
        throw e
      })
      await fetch(`${OPTIMEX_API}/trades/${txData.trade_id}/submit-tx`, {
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
      to: txData.deposit_address as `0x${string}`,
      value: (quote.quoteParams.fromToken as any).isNative ? BigInt(quote.quoteParams.amount) : undefined,
      data: txData.payload as `0x${string}` | undefined,
      chain: undefined,
      account,
    })

    await fetch(`${OPTIMEX_API}/trades/${txData.trade_id}/submit-tx`, {
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
