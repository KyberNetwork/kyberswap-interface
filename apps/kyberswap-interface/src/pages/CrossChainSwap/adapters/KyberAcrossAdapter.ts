import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { WalletAdapterProps } from '@solana/wallet-adapter-base'
import { Connection } from '@solana/web3.js'
import {
  type Address,
  type Hash,
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

// TransferType enum
export enum TransferType {
  Approval = 0,
  Transfer = 1,
  Permit2Approval = 2,
}

// Type definitions for SwapAndDepositData
export interface Fees {
  amount: bigint
  recipient: Address
}

export interface BaseDepositData {
  inputToken: Address
  outputToken: `0x${string}` // bytes32
  outputAmount: bigint
  depositor: Address
  recipient: `0x${string}` // bytes32
  destinationChainId: bigint
  exclusiveRelayer: `0x${string}` // bytes32
  quoteTimestamp: number
  fillDeadline: number
  exclusivityParameter: number
  message: `0x${string}`
}

export interface SwapAndDepositData {
  submissionFees: Fees
  depositData: BaseDepositData
  swapToken: Address
  exchange: Address
  transferType: TransferType
  swapTokenAmount: bigint
  minExpectedInputTokenAmount: bigint
  routerCalldata: `0x${string}`
  enableProportionalAdjustment: boolean
  spokePool: Address
  nonce: bigint
}

// ABI for SpokePoolPeriphery contract
export const spokePoolPeripheryAbi = [
  {
    inputs: [{ internalType: 'contract IPermit2', name: '_permit2', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'InvalidMinExpectedInputAmount', type: 'error' },
  { inputs: [], name: 'InvalidMsgValue', type: 'error' },
  { inputs: [], name: 'InvalidNonce', type: 'error' },
  { inputs: [], name: 'InvalidShortString', type: 'error' },
  { inputs: [], name: 'InvalidSignature', type: 'error' },
  { inputs: [], name: 'MinimumExpectedInputAmount', type: 'error' },
  { inputs: [{ internalType: 'string', name: 'str', type: 'string' }], name: 'StringTooLong', type: 'error' },
  { anonymous: false, inputs: [], name: 'EIP712DomainChanged', type: 'event' },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'exchange', type: 'address' },
      { indexed: false, internalType: 'bytes', name: 'exchangeCalldata', type: 'bytes' },
      { indexed: true, internalType: 'address', name: 'swapToken', type: 'address' },
      { indexed: true, internalType: 'address', name: 'acrossInputToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'swapTokenAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'acrossInputAmount', type: 'uint256' },
      { indexed: true, internalType: 'bytes32', name: 'acrossOutputToken', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'acrossOutputAmount', type: 'uint256' },
    ],
    name: 'SwapBeforeBridge',
    type: 'event',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: 'uint256', name: 'amount', type: 'uint256' },
              { internalType: 'address', name: 'recipient', type: 'address' },
            ],
            internalType: 'struct SpokePoolPeripheryInterface.Fees',
            name: 'submissionFees',
            type: 'tuple',
          },
          {
            components: [
              { internalType: 'address', name: 'inputToken', type: 'address' },
              { internalType: 'bytes32', name: 'outputToken', type: 'bytes32' },
              { internalType: 'uint256', name: 'outputAmount', type: 'uint256' },
              { internalType: 'address', name: 'depositor', type: 'address' },
              { internalType: 'bytes32', name: 'recipient', type: 'bytes32' },
              { internalType: 'uint256', name: 'destinationChainId', type: 'uint256' },
              { internalType: 'bytes32', name: 'exclusiveRelayer', type: 'bytes32' },
              { internalType: 'uint32', name: 'quoteTimestamp', type: 'uint32' },
              { internalType: 'uint32', name: 'fillDeadline', type: 'uint32' },
              { internalType: 'uint32', name: 'exclusivityParameter', type: 'uint32' },
              { internalType: 'bytes', name: 'message', type: 'bytes' },
            ],
            internalType: 'struct SpokePoolPeripheryInterface.BaseDepositData',
            name: 'depositData',
            type: 'tuple',
          },
          { internalType: 'address', name: 'swapToken', type: 'address' },
          { internalType: 'address', name: 'exchange', type: 'address' },
          { internalType: 'enum SpokePoolPeripheryInterface.TransferType', name: 'transferType', type: 'uint8' },
          { internalType: 'uint256', name: 'swapTokenAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'minExpectedInputTokenAmount', type: 'uint256' },
          { internalType: 'bytes', name: 'routerCalldata', type: 'bytes' },
          { internalType: 'bool', name: 'enableProportionalAdjustment', type: 'bool' },
          { internalType: 'address', name: 'spokePool', type: 'address' },
          { internalType: 'uint256', name: 'nonce', type: 'uint256' },
        ],
        internalType: 'struct SpokePoolPeripheryInterface.SwapAndDepositData',
        name: 'swapAndDepositData',
        type: 'tuple',
      },
    ],
    name: 'swapAndBridge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

// V3FundsDeposited event ABI for parsing deposit ID from logs
const V3FundsDepositedAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'inputToken', type: 'address' },
      { indexed: false, internalType: 'address', name: 'outputToken', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'inputAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'outputAmount', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'destinationChainId', type: 'uint256' },
      { indexed: true, internalType: 'uint32', name: 'depositId', type: 'uint32' },
      { indexed: false, internalType: 'uint32', name: 'quoteTimestamp', type: 'uint32' },
      { indexed: false, internalType: 'uint32', name: 'fillDeadline', type: 'uint32' },
      { indexed: false, internalType: 'uint32', name: 'exclusivityDeadline', type: 'uint32' },
      { indexed: true, internalType: 'address', name: 'depositor', type: 'address' },
      { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'address', name: 'exclusiveRelayer', type: 'address' },
      { indexed: false, internalType: 'bytes', name: 'message', type: 'bytes' },
    ],
    name: 'V3FundsDeposited',
    type: 'event',
  },
] as const

// V3FundsDeposited event signature
const V3_FUNDS_DEPOSITED_EVENT_SIGNATURE = '0xa123dc29aebf7d0c3322c8eeb5b999e859f39937950ed31056532713d0de396f'

// Progress tracking types
type ProgressMeta = ApproveMeta | SwapAndBridgeMeta | FillMeta | undefined

type ApproveMeta = {
  approvalAmount: bigint
  spender: Address
}

type SwapAndBridgeMeta = {
  swapAndDepositData: SwapAndDepositData
}

type FillMeta = {
  depositId: bigint
}

export type SwapAndBridgeProgress =
  | {
      step: 'approve'
      status: 'idle'
    }
  | {
      step: 'approve'
      status: 'txPending'
      txHash: Hash
      meta: ApproveMeta
    }
  | {
      step: 'approve'
      status: 'txSuccess'
      txReceipt: TransactionReceipt
      meta: ApproveMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'txPending'
      txHash: Hash
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'txSuccess'
      txReceipt: TransactionReceipt
      depositId: bigint
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'fill'
      status: 'pending'
      meta: FillMeta
    }
  | {
      step: 'approve' | 'swapAndBridge' | 'fill'
      status: 'error'
      error: Error
      meta: ProgressMeta
    }

export interface ExecuteSwapAndBridgeParams {
  // Wallet and clients
  walletClient: WalletClient
  originChain: ViemChain
  rpcUrl: string
  // User address
  userAddress: Address
  // Swap and bridge data
  swapAndDepositData: SwapAndDepositData
  // Contract addresses
  spokePoolPeripheryAddress: Address
  // Options
  isNative?: boolean
  infiniteApproval?: boolean
  skipAllowanceCheck?: boolean
  throwOnError?: boolean
  // Progress handler
  onProgress?: (progress: SwapAndBridgeProgress) => void
}

export interface ExecuteSwapAndBridgeResponse {
  depositId?: bigint
  swapAndBridgeTxReceipt?: TransactionReceipt
  error?: Error
}

/**
 * Gets deposit info from transaction logs
 */
function getDepositFromLogs(receipt: TransactionReceipt): { depositId: bigint } {
  const depositLog = receipt.logs.find(log => log.topics[0] === V3_FUNDS_DEPOSITED_EVENT_SIGNATURE)

  if (!depositLog) {
    throw new Error('V3FundsDeposited event not found in transaction logs')
  }

  // depositId is the second indexed parameter (topics[2])
  const depositId = BigInt(depositLog.topics[2] || '0')

  return { depositId }
}

/**
 * Executes a swap-and-bridge transaction by:
 * 1. Approving the SpokePoolPeriphery contract if necessary
 * 2. Executing the swapAndBridge transaction
 * 3. Parsing the deposit ID from transaction logs
 */
async function executeSwapAndBridge(params: ExecuteSwapAndBridgeParams): Promise<ExecuteSwapAndBridgeResponse> {
  const {
    walletClient,
    originChain,
    rpcUrl,
    userAddress,
    swapAndDepositData,
    spokePoolPeripheryAddress,
    isNative = false,
    infiniteApproval = false,
    skipAllowanceCheck = false,
    throwOnError = true,
    onProgress,
  } = params

  const onProgressHandler = onProgress || ((progress: SwapAndBridgeProgress) => console.log('Progress:', progress))

  let currentProgress: SwapAndBridgeProgress = {
    status: 'idle',
    step: 'approve',
  }
  let currentProgressMeta: ProgressMeta

  try {
    // Create public client for reading blockchain state
    const originPublicClient = createPublicClient({
      chain: originChain,
      transport: http(rpcUrl),
    })

    // Step 1: Check and handle approval if necessary (skip for native ETH)
    if (!skipAllowanceCheck && !isNative) {
      const allowance = await originPublicClient.readContract({
        address: swapAndDepositData.swapToken,
        abi: parseAbi(['function allowance(address owner, address spender) public view returns (uint256)']),
        functionName: 'allowance',
        args: [userAddress, spokePoolPeripheryAddress],
      })

      if (swapAndDepositData.swapTokenAmount > allowance) {
        const approvalAmount = infiniteApproval ? maxUint256 : swapAndDepositData.swapTokenAmount

        currentProgressMeta = {
          approvalAmount,
          spender: spokePoolPeripheryAddress,
        }

        // Execute approval
        const approveCalldata = encodeFunctionData({
          abi: parseAbi(['function approve(address spender, uint256 value)']),
          args: [spokePoolPeripheryAddress, approvalAmount],
        })

        const approveTxHash = await walletClient.sendTransaction({
          account: walletClient.account!,
          chain: originChain,
          to: swapAndDepositData.swapToken,
          data: approveCalldata,
        })

        currentProgress = {
          step: 'approve',
          status: 'txPending',
          txHash: approveTxHash,
          meta: currentProgressMeta,
        }
        onProgressHandler(currentProgress)

        // Wait for approval confirmation
        const approveTxReceipt = await originPublicClient.waitForTransactionReceipt({
          hash: approveTxHash,
        })

        currentProgress = {
          step: 'approve',
          status: 'txSuccess',
          txReceipt: approveTxReceipt,
          meta: currentProgressMeta,
        }
        onProgressHandler(currentProgress)
      }
    }

    // Step 2: Execute swapAndBridge
    currentProgressMeta = {
      swapAndDepositData,
    }

    // Encode the swapAndBridge call
    const swapAndBridgeCalldata = encodeFunctionData({
      abi: spokePoolPeripheryAbi,
      functionName: 'swapAndBridge',
      args: [
        {
          submissionFees: swapAndDepositData.submissionFees,
          depositData: swapAndDepositData.depositData,
          swapToken: swapAndDepositData.swapToken,
          exchange: swapAndDepositData.exchange,
          transferType: swapAndDepositData.transferType,
          swapTokenAmount: swapAndDepositData.swapTokenAmount,
          minExpectedInputTokenAmount: swapAndDepositData.minExpectedInputTokenAmount,
          routerCalldata: swapAndDepositData.routerCalldata,
          enableProportionalAdjustment: swapAndDepositData.enableProportionalAdjustment,
          spokePool: swapAndDepositData.spokePool,
          nonce: swapAndDepositData.nonce,
        },
      ],
    })

    // First simulate the transaction to catch revert errors with proper decoding
    await originPublicClient.simulateContract({
      address: spokePoolPeripheryAddress,
      abi: spokePoolPeripheryAbi,
      functionName: 'swapAndBridge',
      args: [swapAndDepositData] as any,
      account: userAddress,
      value: isNative ? swapAndDepositData.swapTokenAmount : undefined,
    })

    const swapAndBridgeTxHash = await walletClient.sendTransaction({
      account: walletClient.account!,
      chain: originChain,
      to: spokePoolPeripheryAddress,
      data: swapAndBridgeCalldata,
      value: isNative ? swapAndDepositData.swapTokenAmount : undefined,
    })

    currentProgress = {
      step: 'swapAndBridge',
      status: 'txPending',
      txHash: swapAndBridgeTxHash,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    // Wait for transaction confirmation
    const swapAndBridgeTxReceipt = await originPublicClient.waitForTransactionReceipt({
      hash: swapAndBridgeTxHash,
    })

    // Parse deposit ID from logs
    const deposit = getDepositFromLogs(swapAndBridgeTxReceipt)
    const depositId = deposit.depositId

    currentProgress = {
      step: 'swapAndBridge',
      status: 'txSuccess',
      txReceipt: swapAndBridgeTxReceipt,
      depositId,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    // Step 3: Notify about fill pending
    currentProgressMeta = {
      depositId,
    }

    currentProgress = {
      step: 'fill',
      status: 'pending',
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    return {
      depositId,
      swapAndBridgeTxReceipt,
    }
  } catch (error) {
    currentProgress = {
      ...currentProgress,
      status: 'error',
      error: error as Error,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    if (!throwOnError) {
      return { error: error as Error }
    }

    throw error
  }
}

export class KyberAcrossAdapter extends BaseSwapAdapter {
  constructor() {
    super()
  }

  getName(): string {
    return 'KyberAcross'
  }

  getIcon(): string {
    return 'https://i.ibb.co/fVLsZryT/kyberacross.jpg'
  }

  // canSupport returns true for all cases - uses default implementation from BaseSwapAdapter

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
    throw new Error('KyberAcross does not support direct quote fetching. Use stream API response instead.')
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

    // Extract swapAndDepositData from rawQuote
    const swapAndDepositData: SwapAndDepositData = rawQuote.swapAndDepositData
    const spokePoolPeripheryAddress: Address = rawQuote.spokePoolPeripheryAddress
    const isNative: boolean = rawQuote.isNative ?? false

    // Get origin chain from quoteParams
    const originChainId = quote.quote.quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]

    if (!originChain) {
      throw new Error(`Unsupported chain: ${originChainId}`)
    }

    // Get user address from quote params
    const userAddress = quote.quote.quoteParams.sender as Address

    // Get RPC URL for the origin chain
    const rpcUrl = NETWORKS_INFO[originChainId]?.defaultRpcUrl

    if (!rpcUrl) {
      throw new Error(`No RPC URL found for chain: ${originChainId}`)
    }

    return new Promise<NormalizedTxResponse>((resolve, reject) => {
      executeSwapAndBridge({
        walletClient,
        originChain,
        rpcUrl,
        userAddress,
        swapAndDepositData,
        spokePoolPeripheryAddress,
        isNative,
        infiniteApproval: false,
        skipAllowanceCheck: false,
        throwOnError: true,
        onProgress: (progress: SwapAndBridgeProgress) => {
          // Resolve when swapAndBridge transaction is pending (similar to Across SDK behavior)
          if (progress.step === 'swapAndBridge' && progress.status === 'txPending') {
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

          if (progress.status === 'error') {
            reject(progress.error)
          }
        },
      }).catch(reject)
    })
  }

  // getTransactionStatus is empty for now - will be added later
  async getTransactionStatus(_params: NormalizedTxResponse): Promise<SwapStatus> {
    // TODO: Implement transaction status tracking
    return {
      txHash: '',
      status: 'Processing',
    }
  }
}
