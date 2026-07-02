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
  type RoutePlan,
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
  getKyberCrossTx,
  getKyberCrossTxData,
  getResponseData,
  getRouteProvider,
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
    const routePlan = quoteResponse.data
    const outputAmount = BigInt(routePlan.expected_output_amount)
    const formattedOutputAmount = formatUnits(outputAmount, params.toToken.decimals)
    const formattedInputAmount = formatUnits(BigInt(params.amount), params.fromToken.decimals)
    const inputUsd = params.tokenInUsd * +formattedInputAmount
    const outputUsd = params.tokenOutUsd * +formattedOutputAmount
    const rawQuote: KyberCrossRawQuote = {
      request_id: quoteResponse.request_id,
      data: {
        route_plan: routePlan,
      },
      isNativeToken: (params.fromToken as Currency).isNative,
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
      contractAddress: ZERO_ADDRESS,
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
    const responseData = getResponseData(rawQuote)
    const routePlan = responseData?.route_plan
    const routeProvider = getRouteProvider(rawQuote, responseData)
    const normalizedRouteProvider = normalizeProvider(routeProvider)

    let kyberCrossTx = getKyberCrossTx(rawQuote, responseData)
    if (!kyberCrossTx.to || (!kyberCrossTx.data && !kyberCrossTx.txData)) {
      if (!routePlan) {
        throw new Error('Missing KyberCross route plan')
      }

      const buildResponse = await kyberCrossApi.build(routePlan as RoutePlan)
      rawQuote.data = {
        ...responseData,
        build: buildResponse.data,
      }
      kyberCrossTx = buildResponse.data.tx
    }

    const { to, txData, value } = getKyberCrossTxData(kyberCrossTx)

    const originChainId = quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]
    if (!originChain) throw new Error(`Unsupported chain: ${originChainId}`)

    const destinationChainId = quoteParams.toChain as ChainId
    const destinationChain = chainIdToViemChain[destinationChainId]
    if (!destinationChain) throw new Error(`Unsupported destination chain: ${destinationChainId}`)

    const userAddress = quoteParams.sender as Address

    const fromToken = quoteParams.fromToken as Currency
    const isNativeToken = rawQuote.isNativeToken || fromToken.isNative
    const inputToken = (isNativeToken ? ZERO_ADDRESS : fromToken.wrapped.address) as Address
    const inputAmount = BigInt(quoteParams.amount)
    const bridgeMetadata = routePlan?.bridge?.metadata
    const nearIntentsDepositAddress =
      normalizedRouteProvider === NormalizedProvider.NearIntents
        ? (bridgeMetadata as NearIntentsBridgeMetadata)?.deposit_address
        : undefined

    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      executeKyberCross({
        walletClient,
        originChain,
        userAddress,
        to,
        txData,
        value,
        inputToken,
        inputAmount,
        isNativeToken,
        infiniteApproval: false,
        throwOnError: true,
        onProgress: progress => {
          if (progress.step === 'ksExecute' && 'txHash' in progress) {
            resolve({
              sender: quoteParams.sender,
              sourceTxHash: progress.txHash,
              adapter: this.getName(),
              id: nearIntentsDepositAddress || progress.txHash,
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
              routeId: routePlan?.route_id,
            })
          }
        },
      }).catch(reject)
    })
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
