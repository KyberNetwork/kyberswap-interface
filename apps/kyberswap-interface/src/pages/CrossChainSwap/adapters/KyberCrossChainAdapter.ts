import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import {
  type Address,
  type Hash,
  type Hex,
  type TransactionReceipt,
  type Chain as ViemChain,
  WalletClient,
  createPublicClient,
  encodeFunctionData,
  http,
  maxUint256,
  parseAbi,
} from 'viem'
import {
  arbitrum,
  base,
  blast,
  bsc,
  linea,
  mainnet,
  monad,
  optimism,
  plasma,
  polygon,
  scroll,
  unichain,
  zksync,
} from 'viem/chains'

import kyberswapIcon from 'assets/images/kyberswap.ico'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'

import { Quote } from '../registry'
import {
  BaseSwapAdapter,
  Chain,
  NormalizedQuote,
  NormalizedTxResponse,
  QuoteParams,
  SwapStatus,
} from './BaseSwapAdapter'

// Chain ID to viem Chain mapping
const chainIdToViemChain: Record<number, ViemChain> = {
  [ChainId.MAINNET]: mainnet,
  [ChainId.ARBITRUM]: arbitrum,
  [ChainId.BSCMAINNET]: bsc,
  [ChainId.OPTIMISM]: optimism,
  [ChainId.LINEA]: linea,
  [ChainId.MATIC]: polygon,
  [ChainId.ZKSYNC]: zksync,
  [ChainId.BASE]: base,
  [ChainId.SCROLL]: scroll,
  [ChainId.BLAST]: blast,
  [ChainId.UNICHAIN]: unichain,
  [ChainId.PLASMA]: plasma,
  [ChainId.MONAD]: monad,
}

type KyberCrossTx = {
  to?: Address
  data?: Hex
  txData?: Hex
  value?: string | number | bigint
}

type KyberCrossRoutePlan = {
  route_id?: string
  provider?: string
}

type KyberCrossResponseData = {
  route_plan?: KyberCrossRoutePlan
  build?: {
    tx?: KyberCrossTx
  }
}

type KyberCrossRawQuote = {
  request_id?: string
  data?: KyberCrossResponseData | Hex
  build?: {
    tx?: KyberCrossTx
  }
  tx?: KyberCrossTx
  to?: Address
  txData?: Hex
  value?: string | number | bigint
  isNativeToken?: boolean
}

const getResponseData = (rawQuote: KyberCrossRawQuote): KyberCrossResponseData | undefined =>
  typeof rawQuote.data === 'object' ? rawQuote.data : undefined

// ============================================
// Progress Tracking Types
// ============================================

type ApproveMeta = {
  approvalAmount: bigint
  spender: Address
}

export type CrossChainExecuteProgress =
  | { step: 'approve'; status: 'checking' }
  | { step: 'approve'; status: 'txPending'; txHash: Hash; meta: ApproveMeta }
  | { step: 'approve'; status: 'txSuccess'; txReceipt: TransactionReceipt; meta: ApproveMeta }
  | { step: 'ksExecute'; status: 'simulationPending' }
  | { step: 'ksExecute'; status: 'simulationSuccess'; txRequest: any }
  | { step: 'ksExecute'; status: 'txPending'; txHash: Hash }
  | { step: 'ksExecute'; status: 'txSuccess'; txReceipt: TransactionReceipt }
  | { step: 'approve' | 'ksExecute'; status: 'error'; error: Error }

// ============================================
// Execute Parameters
// ============================================

export interface CrossChainExecuteResponse {
  txReceipt?: TransactionReceipt
  error?: Error
}

export interface ExecuteParams {
  walletClient: WalletClient
  originChain: ViemChain
  userAddress: Address
  to: Address
  txData: Hex
  value: bigint
  // Approval params
  inputToken: Address
  inputAmount: bigint
  isNativeToken: boolean
  infiniteApproval?: boolean
  // Options
  throwOnError?: boolean
  onProgress?: (progress: CrossChainExecuteProgress) => void
}

// ============================================
// KyberCrossChainAdapter
// ============================================

export class KyberCrossChainAdapter extends BaseSwapAdapter {
  getName(): string {
    return 'KyberCross'
  }

  getIcon(): string {
    return kyberswapIcon
  }

  getSupportedChains(): Chain[] {
    return [
      ChainId.MAINNET,
      ChainId.ARBITRUM,
      ChainId.OPTIMISM,
      ChainId.LINEA,
      ChainId.MATIC,
      ChainId.ZKSYNC,
      ChainId.BASE,
      ChainId.SCROLL,
      ChainId.BLAST,
      ChainId.UNICHAIN,
      ChainId.BSCMAINNET,
      ChainId.PLASMA,
      ChainId.MONAD,
    ]
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
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const rawQuote = quote.quote.rawQuote as KyberCrossRawQuote
    const responseData = getResponseData(rawQuote)

    console.log('KyberCrossChainAdapter rawQuote ======== ', rawQuote)

    const tx = responseData?.build?.tx || rawQuote.build?.tx || rawQuote.tx || rawQuote

    // Validate new required fields from API
    const to = tx.to as Address
    const txData = (typeof tx.data === 'string' ? tx.data : tx.txData) as Hex
    const value = BigInt(tx.value || '0')

    if (!to || !txData) {
      throw new Error('Missing required transaction data (to, txData)')
    }

    const originChainId = quote.quote.quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]
    if (!originChain) throw new Error(`Unsupported chain: ${originChainId}`)

    const destinationChainId = quote.quote.quoteParams.toChain as ChainId
    const destinationChain = chainIdToViemChain[destinationChainId]
    if (!destinationChain) throw new Error(`Unsupported destination chain: ${destinationChainId}`)

    // Get user address
    const userAddress = quote.quote.quoteParams.sender as Address

    // Get input token info for approval
    const fromToken = quote.quote.quoteParams.fromToken as any
    const isNativeToken = rawQuote.isNativeToken || fromToken?.isNative || false
    const inputToken = isNativeToken
      ? ('0x0000000000000000000000000000000000000000' as Address)
      : ((fromToken?.wrapped?.address || fromToken?.address) as Address)
    const inputAmount = BigInt(quote.quote.quoteParams.amount)

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
              sender: quote.quote.quoteParams.sender,
              sourceTxHash: progress.txHash,
              adapter: this.getName(),
              id: progress.txHash,
              sourceChain: quote.quote.quoteParams.fromChain,
              targetChain: quote.quote.quoteParams.toChain,
              inputAmount: quote.quote.quoteParams.amount,
              outputAmount: quote.quote.outputAmount.toString(),
              sourceToken: quote.quote.quoteParams.fromToken,
              targetToken: quote.quote.quoteParams.toToken,
              timestamp: new Date().getTime(),
              amountInUsd: quote.quote.inputUsd,
              amountOutUsd: quote.quote.outputUsd,
              platformFeePercent: quote.quote.platformFeePercent,
              recipient: quote.quote.quoteParams.recipient,
            })
          }
        },
      }).catch(reject)
    })
  }

  /**
   * Executes a cross-chain swap transaction
   * Flow:
   * 1. Checks and handles token approval to AllowanceHub (if ERC20)
   * 2. Sends pre-encoded transaction to the target contract (AllowanceHub)
   *
   * Note: Transaction data (to, txData, value) is pre-encoded by the backend API
   */
  async execute(params: ExecuteParams): Promise<CrossChainExecuteResponse> {
    const {
      walletClient,
      originChain,
      userAddress,
      to,
      txData,
      value,
      inputToken,
      inputAmount,
      isNativeToken,
      infiniteApproval = false,
      throwOnError = false,
      onProgress,
    } = params

    const rpcUrl = NETWORKS_INFO[originChain.id as ChainId]?.defaultRpcUrl
    if (!rpcUrl) {
      throw new Error(`No RPC URL found for chain: ${originChain.id}`)
    }

    const originClient = createPublicClient({
      chain: originChain,
      transport: http(rpcUrl),
    })

    try {
      // --- Step 1: Check and handle approval if necessary (skip for native tokens) ---
      if (!isNativeToken) {
        onProgress?.({
          step: 'approve',
          status: 'checking',
        })

        const allowance = await originClient.readContract({
          address: inputToken,
          abi: parseAbi(['function allowance(address owner, address spender) public view returns (uint256)']),
          functionName: 'allowance',
          args: [userAddress, to], // `to` is the AllowanceHub address
        })

        if (inputAmount > allowance) {
          const approvalAmount = infiniteApproval ? maxUint256 : inputAmount

          if (!walletClient.account) {
            throw new Error('Wallet account not connected')
          }

          // Execute approval to AllowanceHub
          const approveCalldata = encodeFunctionData({
            abi: parseAbi(['function approve(address spender, uint256 value)']),
            args: [to, approvalAmount], // Approve AllowanceHub (the `to` address)
          })

          const approveTxHash = await walletClient.sendTransaction({
            account: walletClient.account,
            chain: originChain,
            to: inputToken,
            data: approveCalldata,
          })

          onProgress?.({
            step: 'approve',
            status: 'txPending',
            txHash: approveTxHash,
            meta: { approvalAmount, spender: to },
          })

          // Wait for approval confirmation
          const approveTxReceipt = await originClient.waitForTransactionReceipt({
            hash: approveTxHash,
          })

          onProgress?.({
            step: 'approve',
            status: 'txSuccess',
            txReceipt: approveTxReceipt,
            meta: { approvalAmount, spender: to },
          })
        }
      }

      // --- Step 2: Report simulation pending ---
      onProgress?.({
        step: 'ksExecute',
        status: 'simulationPending',
      })

      // --- Simulate transaction ---
      await originClient.call({
        to,
        data: txData,
        value,
        account: walletClient.account,
      })

      onProgress?.({
        step: 'ksExecute',
        status: 'simulationSuccess',
        txRequest: { to, data: txData, value },
      })

      // --- Execute transaction ---
      if (!walletClient.account) {
        throw new Error('Wallet account not connected')
      }

      const txHash = await walletClient.sendTransaction({
        account: walletClient.account,
        to,
        data: txData,
        value,
        chain: originChain,
      })

      onProgress?.({
        step: 'ksExecute',
        status: 'txPending',
        txHash,
      })

      const txReceipt = await originClient.waitForTransactionReceipt({
        hash: txHash,
      })

      onProgress?.({
        step: 'ksExecute',
        status: 'txSuccess',
        txReceipt,
      })

      return {
        txReceipt,
      }
    } catch (error: any) {
      onProgress?.({
        step: 'ksExecute',
        status: 'error',
        error,
      })

      if (throwOnError) {
        throw error
      }

      return {
        txReceipt: undefined,
        error,
      }
    }
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    // KyberCross does not expose a provider-agnostic status endpoint in this adapter yet.
    // Keep cross-chain transactions Processing after the source tx is mined, and only mark
    // Failed when the source tx itself reverted.
    const sourceChain = chainIdToViemChain[params.sourceChain as ChainId]
    const rpcUrl = NETWORKS_INFO[params.sourceChain as ChainId]?.defaultRpcUrl

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
