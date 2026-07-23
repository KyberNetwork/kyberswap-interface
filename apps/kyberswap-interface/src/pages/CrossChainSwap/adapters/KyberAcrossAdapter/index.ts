import { AcrossClient, createAcrossClient } from '@across-protocol/app-sdk'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import { type Address, type Hash, WalletClient } from 'viem'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { getAcrossDepositStatus } from 'pages/CrossChainSwap/adapters/AcrossAdapter/api'
import { AcrossWalletClient } from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'
import { getAcrossFillTxHash, mapAcrossDepositStatus } from 'pages/CrossChainSwap/adapters/AcrossAdapter/utils'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import {
  KYBERSWAP_INTEGRATOR_ID,
  chainIdToViemChain,
  kyberAcrossSupportedChains,
  kyberAcrossViemChains,
} from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/constants'
import { executeSwapAndBridge } from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/service'
import {
  ExecuteSwapAndBridgeParams,
  ExecuteSwapAndBridgeResponse,
  KyberAcrossRawQuote,
  SwapAndDepositData,
} from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/types'
import { transformSwapAndDepositData } from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/utils'
import { Quote } from 'pages/CrossChainSwap/registry'

export class KyberAcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: KYBERSWAP_INTEGRATOR_ID,
      chains: kyberAcrossViemChains,
      rpcUrls: [
        ChainId.MAINNET,
        ChainId.ARBITRUM,
        ChainId.BSCMAINNET,
        ChainId.OPTIMISM,
        ChainId.LINEA,
        ChainId.MATIC,
        ChainId.ZKSYNC,
        ChainId.BASE,
        ChainId.SCROLL,
        ChainId.BLAST,
        ChainId.UNICHAIN,
        ChainId.MONAD,
        ChainId.ROBINHOOD,
      ].reduce((acc, cur) => {
        return { ...acc, [cur]: NETWORKS_INFO[cur].defaultRpcUrl }
      }, {}),
    })
  }

  getName(): string {
    return 'KyberAcross'
  }

  getIcon(): string {
    return 'https://i.ibb.co/fVLsZryT/kyberacross.jpg'
  }

  // canSupport returns true for all cases - uses default implementation from BaseSwapAdapter

  getSupportedChains(): Chain[] {
    return kyberAcrossSupportedChains
  }

  getSupportedTokens(_sourceChain: Chain, _destChain: Chain): Currency[] {
    return []
  }

  // getQuote is empty - we use the stream API response for this provider
  async getQuote(_params: QuoteParams): Promise<NormalizedQuote> {
    throw new Error('KyberAcross does not support direct quote fetching. Use stream API response instead.')
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
    const rawQuote = normalizedQuote.rawQuote as KyberAcrossRawQuote

    // Check if sourceSwap is null - if so, use executeQuote directly to SpokePool
    if (!rawQuote.sourceSwap) {
      return new Promise<NormalizedTxResponse>((resolve, reject) => {
        this.acrossClient
          .executeQuote({
            walletClient: walletClient as AcrossWalletClient,
            deposit: rawQuote.bridge.deposit,
            onProgress: progress => {
              if (progress.step === 'deposit' && 'txHash' in progress) {
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
                })
              }
            },
          })
          .catch(reject)
      })
    }

    // Extract and transform swapAndDepositData from rawQuote
    // The API returns numeric values as strings, so we need to convert them to bigints
    if (!rawQuote.swapAndDepositData) {
      throw new Error('No swapAndDepositData found in KyberAcross quote')
    }

    const swapAndDepositData: SwapAndDepositData = transformSwapAndDepositData(rawQuote.swapAndDepositData)

    const isNative = rawQuote.swapAndDepositData.isNative || false

    const originChainId = quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]

    if (!originChain) {
      throw new Error(`Unsupported chain: ${originChainId}`)
    }

    const destinationChainId = quoteParams.toChain as ChainId
    const destinationChain = chainIdToViemChain[destinationChainId]

    if (!destinationChain) {
      throw new Error(`Unsupported destination chain: ${destinationChainId}`)
    }

    const spokePoolPeripheryAddress = rawQuote.spokePoolPeripheryAddress
    if (!spokePoolPeripheryAddress) {
      throw new Error(`No SpokePoolPeriphery address found for chain: ${originChainId}`)
    }

    const destinationSpokePoolAddress = rawQuote.destinationSpokePoolAddress
    if (!destinationSpokePoolAddress) {
      throw new Error(`No SpokePool address found for destination chain: ${destinationChainId}`)
    }

    const userAddress = quoteParams.sender as Address

    const rpcUrl = NETWORKS_INFO[originChainId]?.defaultRpcUrl

    if (!rpcUrl) {
      throw new Error(`No RPC URL found for chain: ${originChainId}`)
    }

    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      this.executeSwapAndBridge({
        walletClient,
        originChain,
        destinationChain,
        userAddress,
        swapAndDepositData,
        spokePoolPeripheryAddress,
        destinationSpokePoolAddress,
        isNative,
        infiniteApproval: false,
        skipAllowanceCheck: false,
        throwOnError: true,
        onProgress: progress => {
          if (progress.step === 'swapAndBridge' && 'txHash' in progress) {
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
            })
          }
        },
      }).catch(reject)
    })
  }

  async executeSwapAndBridge(params: ExecuteSwapAndBridgeParams): Promise<ExecuteSwapAndBridgeResponse> {
    return executeSwapAndBridge(this.acrossClient, params)
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await getAcrossDepositStatus(params.sourceTxHash)

      return {
        txHash: getAcrossFillTxHash(res),
        status: mapAcrossDepositStatus(res, { txTimestamp: params.timestamp }),
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error)

      const publicClient = this.acrossClient.getPublicClient(params.sourceChain as number)
      const receipt = await publicClient.getTransactionReceipt({
        hash: params.sourceTxHash as Hash,
      })

      if (receipt?.status === 'reverted') {
        return {
          txHash: '',
          status: 'Failed',
        }
      }

      return {
        txHash: '',
        status: 'Processing',
      }
    }
  }
}
