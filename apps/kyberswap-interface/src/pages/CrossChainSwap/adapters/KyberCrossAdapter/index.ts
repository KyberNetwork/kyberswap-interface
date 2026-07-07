import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { type Address, type Hash, WalletClient, formatUnits } from 'viem'

import kyberswapIcon from 'assets/images/kyberswap.ico'
import { CROSS_CHAIN_FEE_RECEIVER, ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapProvider,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import {
  type NearIntentsBridgeMetadata,
  type QuoteRequest,
  kyberCrossApi,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import { executeKyberCross } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/service'
import {
  type KyberCrossRawQuote,
  chainIdToKyberCrossChainName,
  chainIdToViemChain,
  kyberCrossSupportedChains,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'
import {
  NormalizedProvider,
  getKyberCrossBridgeProviders,
  mapRouteStateToSwapStatus,
  normalizeProvider,
} from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'
import { Quote } from 'pages/CrossChainSwap/registry'

// ============================================
// KyberCrossAdapter
// ============================================

const getKyberCrossChainName = (chainId: Chain): QuoteRequest['from_chain'] => {
  const chainName = chainIdToKyberCrossChainName[chainId as ChainId]
  if (!chainName) throw new Error(`Unsupported KyberCross chain: ${chainId}`)

  return chainName
}

const getKyberCrossTokenAddress = (token: Currency): Address =>
  (token.isNative ? ETHER_ADDRESS : token.wrapped.address) as Address

export class KyberCrossAdapter extends BaseSwapAdapter {
  constructor(private readonly getAdapterByName?: (name?: string) => SwapProvider | undefined) {
    super()
  }

  getName(): string {
    return 'KyberCross'
  }

  getIcon(): string {
    return kyberswapIcon
  }

  getSupportedChains(): Chain[] {
    return kyberCrossSupportedChains
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  async getQuote(params: QuoteParams): Promise<NormalizedQuote> {
    const request: QuoteRequest = {
      from_chain: getKyberCrossChainName(params.fromChain),
      from_token: getKyberCrossTokenAddress(params.fromToken as Currency),
      from_token_decimals: params.fromToken.decimals,
      from_address: params.sender as Address,
      to_chain: getKyberCrossChainName(params.toChain),
      to_token: getKyberCrossTokenAddress(params.toToken as Currency),
      to_token_decimals: params.toToken.decimals,
      to_address: params.recipient as Address,
      refund_address: params.sender as Address,
      amount: params.amount,
      slippage_bps: params.slippage,
      client_fee_bps: params.feeBps,
      include_bridges: getKyberCrossBridgeProviders(params.includedSources),
      exclude_bridges: getKyberCrossBridgeProviders(params.excludedSources),
    }

    if (params.feeBps > 0) {
      request.client_fee_recipient = CROSS_CHAIN_FEE_RECEIVER as Address
    }

    const quoteResponse = await kyberCrossApi.getQuote(request)
    const routePlan = quoteResponse.data.route_plans[0]

    if (!routePlan) {
      throw new Error('No KyberCross route plans found')
    }

    const outputAmount = BigInt(routePlan.expected_output_amount)
    const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = params.tokenInUsd * +formattedInputAmount
    const outputUsd = params.tokenOutUsd * +formattedOutputAmount
    const isNativeToken = (params.fromToken as Currency).isNative
    const rawQuote: KyberCrossRawQuote = {
      request_id: quoteResponse.request_id,
      data: quoteResponse.data,
      isNativeToken,
    }

    return {
      quoteParams: params,
      outputAmount,
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      timeEstimate: routePlan.bridge.expected_fill_time_sec || 0,
      priceImpact: !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd) * 100) / inputUsd,
      gasFeeUsd: 0,
      contractAddress: isNativeToken ? ZERO_ADDRESS : quoteResponse.data.ks_allowance_hub_address,
      rawQuote,
      protocolFee: 0,
      platformFeePercent: (params.feeBps * 100) / 10_000,
    }
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: unknown,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const normalizedQuote = quote.quote
    const quoteParams = normalizedQuote.quoteParams
    const rawQuote = normalizedQuote.rawQuote as KyberCrossRawQuote
    const routePlan = rawQuote.data?.route_plans?.[0]

    if (!routePlan) {
      throw new Error('Missing KyberCross route plan')
    }

    const routeProvider = routePlan.bridge.provider
    const normalizedRouteProvider = normalizeProvider(routeProvider)
    const buildResponse = await kyberCrossApi.build(routePlan)
    const buildTx = buildResponse.data.tx

    const originChainId = quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]
    if (!originChain) throw new Error(`Unsupported chain: ${originChainId}`)

    const fromToken = quoteParams.fromToken as Currency
    const isNativeToken = rawQuote.isNativeToken || fromToken.isNative
    const bridgeMetadata = routePlan.bridge.metadata
    const nearIntentsDepositAddress =
      normalizedRouteProvider === NormalizedProvider.NearIntents
        ? (bridgeMetadata as NearIntentsBridgeMetadata)?.deposit_address
        : undefined

    const txHash = await executeKyberCross({
      walletClient,
      originChain,
      userAddress: quoteParams.sender as Address,
      buildTx,
      inputToken: (isNativeToken ? ZERO_ADDRESS : fromToken.wrapped.address) as Address,
      inputAmount: BigInt(quoteParams.amount),
      isNativeToken,
      infiniteApproval: false,
    })

    return {
      sender: quoteParams.sender,
      sourceTxHash: txHash,
      adapter: this.getName(),
      id: nearIntentsDepositAddress || txHash,
      sourceChain: quoteParams.fromChain,
      targetChain: quoteParams.toChain,
      inputAmount: quoteParams.amount,
      outputAmount: normalizedQuote.outputAmount.toString(),
      sourceToken: quoteParams.fromToken,
      targetToken: quoteParams.toToken,
      timestamp: new Date().getTime(),
      amountInUsd: normalizedQuote.inputUsd,
      amountOutUsd: normalizedQuote.outputUsd,
      platformFeePercent: normalizedQuote.platformFeePercent,
      recipient: quoteParams.recipient,
      bridgeProvider: routeProvider,
      routeId: routePlan.route_id,
    }
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const trackingExecution = await kyberCrossApi.scanTxStatus(params.sourceTxHash as Hash)

      return mapRouteStateToSwapStatus(trackingExecution.data)
    } catch (error) {
      // Fallback to delegated adapter/source receipt when KyberCross scan does not have this tx yet.
    }

    const provider = normalizeProvider(params.bridgeProvider)
    const adapter = this.getAdapterByName?.(provider)

    if (adapter && normalizeProvider(adapter.getName()) !== NormalizedProvider.KyberCross) {
      const delegatedId = provider === NormalizedProvider.NearIntents ? params.id : params.routeId || params.id

      if (!delegatedId) {
        return {
          txHash: '',
          status: 'Processing',
        }
      }

      return adapter.getTransactionStatus({
        ...params,
        adapter: adapter.getName(),
        id: delegatedId,
      })
    }

    return {
      txHash: '',
      status: 'Processing',
    }
  }
}
