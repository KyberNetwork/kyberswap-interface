import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { type Address, type Hash, WalletClient, createPublicClient, http } from 'viem'

import kyberswapIcon from 'assets/images/kyberswap.ico'
import { ZERO_ADDRESS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
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
  chainIdToViemChain,
  kyberCrossSupportedChains,
} from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/constants'
import { executeKyberCross } from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/service'
import {
  CrossChainExecuteResponse,
  ExecuteParams,
  KyberCrossRawQuote,
} from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/types'
import {
  getKyberCrossTx,
  getKyberCrossTxData,
  getResponseData,
  getRouteProvider,
  normalizeProvider,
} from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/utils'
import { Quote } from 'pages/CrossChainSwap/registry'

// ============================================
// KyberCrossChainAdapter
// ============================================

export class KyberCrossChainAdapter extends BaseSwapAdapter {
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

  // getQuote is empty - we use the stream API response for this provider
  async getQuote(_params: QuoteParams): Promise<NormalizedQuote> {
    throw new Error('KyberCross does not support direct quote fetching. Use stream API response instead.')
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

    const { to, txData, value } = getKyberCrossTxData(getKyberCrossTx(rawQuote, responseData))

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

    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.execute({
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
              id: progress.txHash,
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

  async execute(params: ExecuteParams): Promise<CrossChainExecuteResponse> {
    return executeKyberCross(params)
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    const provider = normalizeProvider(params.bridgeProvider)
    const adapter = this.getAdapterByName?.(provider)

    if (adapter && normalizeProvider(adapter.getName()) !== normalizeProvider(this.getName())) {
      return adapter.getTransactionStatus({
        ...params,
        adapter: adapter.getName(),
        id: params.routeId || params.id,
      })
    }

    const sourceChainId = params.sourceChain as ChainId
    const sourceChain = chainIdToViemChain[sourceChainId]
    const rpcUrl = NETWORKS_INFO[sourceChainId]?.defaultRpcUrl

    if (!sourceChain || !rpcUrl) {
      return { txHash: '', status: 'Processing' }
    }

    const publicClient = createPublicClient({
      chain: sourceChain,
      transport: http(rpcUrl),
    })

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: params.sourceTxHash as Hash })

      return {
        txHash: '',
        status: receipt.status === 'reverted' ? 'Failed' : 'Processing',
      }
    } catch (error) {
      return { txHash: '', status: 'Processing' }
    }
  }
}
