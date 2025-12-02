import { parseDepositLogs, parseFillLogs, waitForDepositTx, waitForFillTx } from '@across-protocol/app-sdk'
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
import { arbitrum, base, blast, bsc, linea, mainnet, optimism, polygon, scroll, unichain, zksync } from 'viem/chains'

import { monad, plasma } from 'components/Web3Provider'
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
  | { step: 'ksExecute'; status: 'txSuccess'; txReceipt: TransactionReceipt; depositId: bigint; depositLog: any }
  | { step: 'fill'; status: 'pending'; depositId: bigint }
  | {
      step: 'fill'
      status: 'txSuccess'
      txReceipt: TransactionReceipt
      fillTxTimestamp: bigint
      actionSuccess: boolean | undefined
      fillLog: ReturnType<typeof parseFillLogs>
    }
  | { step: 'approve' | 'ksExecute' | 'fill'; status: 'error'; error: Error }

// ============================================
// Execute Parameters
// ============================================

export interface CrossChainExecuteResponse {
  depositId?: bigint
  swapAndBridgeTxReceipt?: TransactionReceipt
  fillTxReceipt?: TransactionReceipt
  error?: Error
}

export interface ExecuteParams {
  walletClient: WalletClient
  originChain: ViemChain
  destinationChain: ViemChain
  userAddress: Address
  to: Address
  txData: Hex
  value: bigint
  destinationSpokePoolAddress: Address
  message: Hex // Needed for fill monitoring
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
    return 'KyberAcross'
  }

  getIcon(): string {
    return 'https://i.ibb.co/fVLsZryT/kyberacross.jpg'
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
    throw new Error('KyberCrossChain does not support direct quote fetching. Use stream API response instead.')
  }

  async executeSwap(
    quote: Quote,
    walletClient: WalletClient,
    _nearWalletClient?: any,
    _sendBtcFn?: (params: { recipient: string; amount: string | number }) => Promise<string>,
    _sendTransaction?: WalletAdapterProps['sendTransaction'],
    _connection?: Connection,
  ): Promise<NormalizedTxResponse> {
    const rawQuote = quote.quote.rawQuote

    console.log('KyberCrossChainAdapter rawQuote ======== ', rawQuote)

    // Validate new required fields from API
    const to = rawQuote.to as Address
    const txData = rawQuote.txData as Hex
    const value = BigInt(rawQuote.value || '0')
    const destinationSpokePoolAddress = rawQuote.destinationSpokePoolAddress as Address

    if (!to || !txData) {
      throw new Error('Missing required transaction data (to, txData)')
    }

    if (!destinationSpokePoolAddress) {
      throw new Error('Missing destinationSpokePoolAddress')
    }

    const originChainId = quote.quote.quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]
    if (!originChain) throw new Error(`Unsupported chain: ${originChainId}`)

    const destinationChainId = quote.quote.quoteParams.toChain as ChainId
    const destinationChain = chainIdToViemChain[destinationChainId]
    if (!destinationChain) throw new Error(`Unsupported destination chain: ${destinationChainId}`)

    // Extract message for fill monitoring (from bridge data if available)
    const message = (rawQuote.bridge?.deposit?.message || '0x') as Hex

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
        destinationChain,
        userAddress,
        to,
        txData,
        value,
        destinationSpokePoolAddress,
        message,
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
   * 3. Monitors for fill on destination chain
   *
   * Note: Transaction data (to, txData, value) is pre-encoded by the backend API
   */
  async execute(params: ExecuteParams): Promise<CrossChainExecuteResponse> {
    const {
      walletClient,
      originChain,
      destinationChain,
      userAddress,
      to,
      txData,
      value,
      destinationSpokePoolAddress,
      message,
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

      // --- Wait for deposit tx and parse deposit from logs ---
      const { depositId, depositTxReceipt } = await waitForDepositTx({
        transactionHash: txHash,
        originChainId: originChain.id,
        publicClient: originClient,
      })

      const depositLog = parseDepositLogs(depositTxReceipt.logs)

      onProgress?.({
        step: 'ksExecute',
        status: 'txSuccess',
        txReceipt: depositTxReceipt,
        depositId,
        depositLog,
      })

      // --- Step 3: Wait for fill on destination chain ---
      onProgress?.({
        step: 'fill',
        status: 'pending',
        depositId,
      })

      const destRpcUrl = NETWORKS_INFO[destinationChain.id as ChainId]?.defaultRpcUrl
      if (!destRpcUrl) {
        throw new Error(`No RPC URL found for destination chain: ${destinationChain.id}`)
      }

      const destClient = createPublicClient({
        chain: destinationChain,
        transport: http(destRpcUrl),
      })

      const destinationBlock = await destClient.getBlockNumber()

      const { fillTxReceipt, fillTxTimestamp } = await waitForFillTx({
        deposit: {
          originChainId: originChain.id,
          destinationChainId: destinationChain.id,
          destinationSpokePoolAddress,
          message,
        },
        depositId,
        depositTxHash: depositTxReceipt.transactionHash,
        destinationChainClient: destClient,
        fromBlock: destinationBlock - 100n,
      })

      const fillLog = parseFillLogs(fillTxReceipt.logs)

      // Note: actionSuccess from SDK checks MulticallHandler events.
      // Since we use our own BridgeAdapter (not MulticallHandler),
      // we consider the action successful if the fill tx succeeded.
      // The BridgeAdapter reverts on failure, so tx success = action success.
      const actionSuccessOverride = true

      onProgress?.({
        step: 'fill',
        status: 'txSuccess',
        txReceipt: fillTxReceipt,
        fillTxTimestamp,
        actionSuccess: actionSuccessOverride,
        fillLog,
      })

      return {
        depositId,
        swapAndBridgeTxReceipt: depositTxReceipt,
        fillTxReceipt,
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
        depositId: undefined,
        swapAndBridgeTxReceipt: undefined,
        fillTxReceipt: undefined,
        error,
      }
    }
  }

  async getTransactionStatus(params: NormalizedTxResponse): Promise<SwapStatus> {
    try {
      const res = await fetch(`https://app.across.to/api/deposit/status?depositTxHash=${params.sourceTxHash}`).then(
        res => res.json(),
      )
      return {
        txHash: res.fillTx || '',
        status: res.status === 'refunded' ? 'Refunded' : res.status === 'filled' ? 'Success' : 'Processing',
      }
    } catch (error) {
      console.error('Error fetching transaction status:', error)
      return {
        txHash: '',
        status: 'Processing',
      }
    }
  }
}
