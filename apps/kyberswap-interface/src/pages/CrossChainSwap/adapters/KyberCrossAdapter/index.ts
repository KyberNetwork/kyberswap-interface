import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { type Address, type Hash, WalletClient, formatUnits } from 'viem'

import kyberswapIcon from 'assets/images/kyberswap.ico'
import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
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
  getGasDropQuote,
  getKyberCrossBridgeProviders,
  getKyberCrossRoutePlan,
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

  async getQuote(params: QuoteParams, signal?: AbortSignal): Promise<NormalizedQuote> {
    // KyberCross internal testing uses zero UI fees.
    params = { ...params, feeBps: 0 }

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
      ...(params.gasDrop ? { gas_drop: true } : {}),
      slippage_bps: params.slippage,
      partner_fee_bps: params.feeBps,
      all_route_plans: true,
      include_bridges: getKyberCrossBridgeProviders(params.includedSources),
      exclude_bridges: getKyberCrossBridgeProviders(params.excludedSources),
    }

    const quoteResponse = await kyberCrossApi.getQuote(request, signal)
    return this.normalizeQuote(params, {
      request_id: quoteResponse.request_id,
      data: quoteResponse.data,
      isNativeToken: (params.fromToken as Currency).isNative,
    })
  }

  private normalizeQuote(params: QuoteParams, rawQuote: KyberCrossRawQuote): NormalizedQuote {
    const data = rawQuote.data
    if (!data || !('route_plans' in data) || !data.route_plans[0]) throw new Error('No KyberCross route plans found')
    const routePlan = data.route_plans[0]

    const gasDrop = getGasDropQuote(routePlan)
    const outputAmount = BigInt(routePlan.expected_output_amount)
    const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = params.tokenInUsd * +formattedInputAmount
    const outputUsd = params.tokenOutUsd * +formattedOutputAmount

    return {
      quoteParams: params,
      gasDrop,
      minimumOutputAmount: routePlan.min_output_amount,
      outputAmount,
      formattedOutputAmount,
      inputUsd,
      outputUsd,
      rate: +formattedOutputAmount / +formattedInputAmount,
      timeEstimate: routePlan.estimated_duration_sec ?? 0,
      priceImpact:
        !inputUsd || !outputUsd ? NaN : ((inputUsd - outputUsd - (gasDrop?.amountUsd || 0)) * 100) / inputUsd,
      gasFeeUsd: 0,
      contractAddress: rawQuote.isNativeToken ? ZERO_ADDRESS : data.ks_allowance_hub_address,
      rawQuote,
      protocolFee: 0,
      platformFeePercent: params.feeBps / 100,
    }
  }

  getRouteQuotes(quote: NormalizedQuote, isReadOnly: boolean): Quote[] {
    const rawQuote = quote.rawQuote as KyberCrossRawQuote
    const data = rawQuote.data
    if (!data || !('route_plans' in data) || !data.route_plans.length)
      throw new Error('No KyberCross route plans found')

    return data.route_plans.map(routePlan => ({
      id: `${this.getName()}:${routePlan.id}`,
      adapter: this,
      isReadOnly,
      // Each selectable quote owns only its route, including the route used for build and execution.
      quote: this.normalizeQuote(quote.quoteParams, {
        ...rawQuote,
        data: { ...data, route_plans: [routePlan] },
      }),
    }))
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
    const quoteData = rawQuote.data
    const routePlan = getKyberCrossRoutePlan(rawQuote)

    if (!quoteData || !routePlan) {
      throw new Error('Missing KyberCross route plan')
    }

    const routeProvider = routePlan.bridge.provider
    const normalizedRouteProvider = normalizeProvider(routeProvider)
    const build =
      'route_plans' in quoteData ? (await kyberCrossApi.build(quoteData.route_plans[0])).data : quoteData.build

    const buildTx = build.tx

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
      routeId: routePlan.id,
      gasDrop: normalizedQuote.gasDrop,
      ...(normalizedQuote.gasDrop ? { gasDropStatus: { status: 'Pending' as const } } : {}),
    }
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const trackingExecution = await kyberCrossApi.scanTxStatus(params.sourceTxHash as Hash)

      return mapRouteStateToSwapStatus(trackingExecution.data.route_execution, !!params.gasDrop)
    } catch {
      return {
        txHash: '',
        status: 'Processing',
      }
    }
  }
}
