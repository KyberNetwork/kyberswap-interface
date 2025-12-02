import {
  AcrossClient,
  createAcrossClient,
  getIntegratorDataSuffix,
  parseDepositLogs,
  parseFillLogs,
  waitForDepositTx,
  waitForFillTx,
} from '@across-protocol/app-sdk'
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
  encodeFunctionData,
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

// Integrator ID for Across tracking
const KYBERSWAP_INTEGRATOR_ID: Hex = '0x008a'

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
      status: 'simulationPending'
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'simulationSuccess'
      txRequest: any
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'txPending'
      txHash: Hash
      txRequest?: any
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'txSuccess'
      txReceipt: TransactionReceipt
      depositId: bigint
      depositLog: ReturnType<typeof parseDepositLogs>
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'fill'
      status: 'pending'
      meta: FillMeta
    }
  | {
      step: 'fill'
      status: 'txSuccess'
      txReceipt: TransactionReceipt
      fillTxTimestamp: bigint
      actionSuccess: boolean | undefined
      fillLog: ReturnType<typeof parseFillLogs>
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
  destinationChain: ViemChain
  // User address
  userAddress: Address
  // Swap and bridge data
  swapAndDepositData: SwapAndDepositData
  // Contract addresses
  spokePoolPeripheryAddress: Address
  destinationSpokePoolAddress: Address
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
  fillTxReceipt?: TransactionReceipt
  error?: Error
}

/**
 * Transforms raw API quote data (with string values) to properly typed SwapAndDepositData (with bigint values)
 * The API returns numeric values as strings, but the contract expects bigint types
 */
function transformSwapAndDepositData(raw: any): SwapAndDepositData {
  return {
    submissionFees: {
      amount: BigInt(raw.submissionFees?.amount || '0'),
      recipient: raw.submissionFees?.recipient as Address,
    },
    depositData: {
      inputToken: raw.depositData?.inputToken as Address,
      outputToken: raw.depositData?.outputToken as `0x${string}`,
      outputAmount: BigInt(raw.depositData?.outputAmount || '0'),
      depositor: raw.depositData?.depositor as Address,
      recipient: raw.depositData?.recipient as `0x${string}`,
      destinationChainId: BigInt(raw.depositData?.destinationChainId || '0'),
      exclusiveRelayer: raw.depositData?.exclusiveRelayer as `0x${string}`,
      quoteTimestamp: Number(raw.depositData?.quoteTimestamp || 0),
      fillDeadline: Number(raw.depositData?.fillDeadline || 0),
      exclusivityParameter: Number(raw.depositData?.exclusivityParameter || 0),
      message: raw.depositData?.message as `0x${string}`,
    },
    swapToken: raw.swapToken as Address,
    exchange: raw.exchange as Address,
    transferType: Number(raw.transferType) as TransferType,
    swapTokenAmount: BigInt(raw.swapTokenAmount || '0'),
    minExpectedInputTokenAmount: BigInt(raw.minExpectedInputTokenAmount || '0'),
    routerCalldata: raw.routerCalldata as `0x${string}`,
    enableProportionalAdjustment: Boolean(raw.enableProportionalAdjustment),
    spokePool: raw.spokePool as Address,
    nonce: BigInt(raw.nonce || '0'),
  }
}

export class KyberAcrossAdapter extends BaseSwapAdapter {
  private acrossClient: AcrossClient

  constructor() {
    super()
    this.acrossClient = createAcrossClient({
      integratorId: KYBERSWAP_INTEGRATOR_ID,
      chains: [mainnet, arbitrum, bsc, optimism, linea, polygon, zksync, base, scroll, blast, unichain, plasma, monad],
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

    console.log('rawQuote ======== ', rawQuote)

    // Check if sourceSwap is null - if so, use executeQuote directly to SpokePool
    if (!rawQuote.sourceSwap) {
      return new Promise<NormalizedTxResponse>((resolve, reject) => {
        this.acrossClient
          .executeQuote({
            walletClient: walletClient as any,
            deposit: rawQuote.bridge.deposit,
            onProgress: progress => {
              if (progress.step === 'deposit' && 'txHash' in progress) {
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
          })
          .catch(reject)
      })
    }

    // Extract and transform swapAndDepositData from rawQuote
    // The API returns numeric values as strings, so we need to convert them to bigints
    const swapAndDepositData: SwapAndDepositData = transformSwapAndDepositData(rawQuote.swapAndDepositData)

    // Determine if this is a native token swap, explicitly set in rawQuote
    const isNative: boolean = rawQuote.swapAndDepositData?.isNative

    // Get origin chain from quoteParams
    const originChainId = quote.quote.quoteParams.fromChain as ChainId
    const originChain = chainIdToViemChain[originChainId]

    if (!originChain) {
      throw new Error(`Unsupported chain: ${originChainId}`)
    }

    // Get destination chain from quoteParams
    const destinationChainId = quote.quote.quoteParams.toChain as ChainId
    const destinationChain = chainIdToViemChain[destinationChainId]

    if (!destinationChain) {
      throw new Error(`Unsupported destination chain: ${destinationChainId}`)
    }

    // Get spokePoolPeripheryAddress from rawQuote
    const spokePoolPeripheryAddress: Address = rawQuote.spokePoolPeripheryAddress
    if (!spokePoolPeripheryAddress) {
      throw new Error(`No SpokePoolPeriphery address found for chain: ${originChainId}`)
    }

    // Get destinationSpokePoolAddress from rawQuote
    const destinationSpokePoolAddress: Address = rawQuote.destinationSpokePoolAddress
    if (!destinationSpokePoolAddress) {
      throw new Error(`No SpokePool address found for destination chain: ${destinationChainId}`)
    }

    // Get user address from quote params
    const userAddress = quote.quote.quoteParams.sender as Address

    // Get RPC URL for the origin chain
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
   * Executes a swap-and-bridge transaction by:
   * 1. Approving the SpokePoolPeriphery contract if necessary
   * 2. Executing the swapAndBridge transaction
   * 3. Parsing the deposit ID from transaction logs
   */
  async executeSwapAndBridge(params: ExecuteSwapAndBridgeParams): Promise<ExecuteSwapAndBridgeResponse> {
    const {
      walletClient,
      originChain,
      destinationChain,
      userAddress,
      swapAndDepositData,
      spokePoolPeripheryAddress,
      destinationSpokePoolAddress,
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
      // Create public clients for reading blockchain state
      const originClient = this.acrossClient.getPublicClient(originChain.id)
      const destinationClient = this.acrossClient.getPublicClient(destinationChain.id)

      // Get user's nonce for replay protection
      const nonce = await originClient.getTransactionCount({
        address: userAddress,
      })

      // Step 1: Check and handle approval if necessary (skip for native ETH)
      if (!skipAllowanceCheck && !isNative) {
        const allowance = await originClient.readContract({
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
          const approveTxReceipt = await originClient.waitForTransactionReceipt({
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
      // 1. Simulate the swapAndBridge transaction
      // 2. If successful, execute the swapAndBridge transaction
      // 3. Wait for the transaction to be mined
      currentProgressMeta = {
        swapAndDepositData,
      }

      // Report simulation pending status
      currentProgress = {
        step: 'swapAndBridge',
        status: 'simulationPending',
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      // Prepare the swapAndBridge args with updated nonce
      const swapAndBridgeArgs = { ...swapAndDepositData, nonce: BigInt(nonce) }

      // Encode calldata for Tenderly simulation
      const calldata = encodeFunctionData({
        abi: spokePoolPeripheryAbi,
        functionName: 'swapAndBridge',
        args: [{ ...swapAndBridgeArgs }] as any,
      })
      const dataSuffix = getIntegratorDataSuffix(KYBERSWAP_INTEGRATOR_ID)
      const fullCalldata = `${calldata}${dataSuffix.slice(2)}` as Hex // Remove 0x from suffix before concatenating

      // Log for Tenderly simulation
      console.log('🔵 🔵 🔵 🔵 🔵 🔵 🔵')
      console.log('Contract Address:', spokePoolPeripheryAddress)
      console.log('Sender (from):', userAddress)
      console.log('Value (wei):', isNative ? swapAndDepositData.swapTokenAmount.toString() : '0')
      console.log('Calldata:', fullCalldata)
      console.log('Chain ID:', originChain.id)

      // Simulate the transaction to catch revert errors with proper decoding
      // and get the request object for execution
      const { request: txRequest } = await originClient.simulateContract({
        address: spokePoolPeripheryAddress,
        abi: spokePoolPeripheryAbi,
        functionName: 'swapAndBridge',
        args: [{ ...swapAndBridgeArgs }] as any,
        account: walletClient.account,
        value: isNative ? swapAndDepositData.swapTokenAmount : undefined,
        dataSuffix: getIntegratorDataSuffix(KYBERSWAP_INTEGRATOR_ID),
      })

      // Report simulation success status
      currentProgress = {
        step: 'swapAndBridge',
        status: 'simulationSuccess',
        txRequest,
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      // Execute the transaction using writeContract with the simulated request
      const swapAndBridgeTxHash = await walletClient.writeContract(txRequest)

      currentProgress = {
        step: 'swapAndBridge',
        status: 'txPending',
        txHash: swapAndBridgeTxHash,
        txRequest,
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      // Wait for deposit transaction and parse logs using SDK
      const { depositId, depositTxReceipt } = await waitForDepositTx({
        originChainId: originChain.id,
        transactionHash: swapAndBridgeTxHash,
        publicClient: originClient,
      })
      const depositLog = parseDepositLogs(depositTxReceipt.logs)

      currentProgress = {
        step: 'swapAndBridge',
        status: 'txSuccess',
        txReceipt: depositTxReceipt,
        depositId,
        depositLog,
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      // Step 3: Wait for fill on destination chain
      currentProgressMeta = {
        depositId,
      }
      currentProgress = {
        step: 'fill',
        status: 'pending',
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      const destinationBlock = await destinationClient.getBlockNumber()

      const { fillTxReceipt, fillTxTimestamp, actionSuccess } = await waitForFillTx({
        deposit: {
          originChainId: originChain.id,
          destinationChainId: destinationChain.id,
          destinationSpokePoolAddress: destinationSpokePoolAddress,
          message: swapAndDepositData.depositData.message,
        },
        depositId,
        depositTxHash: depositTxReceipt.transactionHash,
        destinationChainClient: destinationClient,
        fromBlock: destinationBlock - 100n,
      })

      const fillLog = parseFillLogs(fillTxReceipt.logs)

      currentProgress = {
        step: 'fill',
        status: 'txSuccess',
        txReceipt: fillTxReceipt,
        fillTxTimestamp,
        actionSuccess,
        fillLog,
        meta: currentProgressMeta,
      }
      onProgressHandler(currentProgress)

      return {
        depositId,
        swapAndBridgeTxReceipt: depositTxReceipt,
        fillTxReceipt,
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

  // getTransactionStatus is empty for now - will be added later
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
