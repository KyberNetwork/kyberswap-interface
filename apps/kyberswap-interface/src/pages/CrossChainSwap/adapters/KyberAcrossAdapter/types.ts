import { parseDepositLogs, parseFillLogs } from '@across-protocol/app-sdk'
import { type Address, type Hash, type Hex, type TransactionReceipt, type Chain as ViemChain, WalletClient } from 'viem'

import { AcrossDeposit } from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'

export enum TransferType {
  Approval = 0,
  Transfer = 1,
  Permit2Approval = 2,
}

export interface Fees {
  amount: bigint
  recipient: Address
}

export interface BaseDepositData {
  inputToken: Address
  outputToken: Hex
  outputAmount: bigint
  depositor: Address
  recipient: Hex
  destinationChainId: bigint
  exclusiveRelayer: Hex
  quoteTimestamp: number
  fillDeadline: number
  exclusivityParameter: number
  message: Hex
}

export interface SwapAndDepositData {
  submissionFees: Fees
  depositData: BaseDepositData
  swapToken: Address
  exchange: Address
  transferType: TransferType
  swapTokenAmount: bigint
  minExpectedInputTokenAmount: bigint
  routerCalldata: Hex
  enableProportionalAdjustment: boolean
  spokePool: Address
  nonce: bigint
}

export interface RawBaseDepositData {
  inputToken?: Address
  outputToken?: Hex
  outputAmount?: string
  depositor?: Address
  recipient?: Hex
  destinationChainId?: string
  exclusiveRelayer?: Hex
  quoteTimestamp?: string | number
  fillDeadline?: string | number
  exclusivityParameter?: string | number
  message?: Hex
}

export interface RawSwapAndDepositData {
  submissionFees?: {
    amount?: string
    recipient?: Address
  }
  depositData?: RawBaseDepositData
  swapToken?: Address
  exchange?: Address
  transferType?: TransferType | string | number
  swapTokenAmount?: string
  minExpectedInputTokenAmount?: string
  routerCalldata?: Hex
  enableProportionalAdjustment?: boolean
  spokePool?: Address
  nonce?: string
  isNative?: boolean
}

export interface KyberAcrossRawQuote {
  sourceSwap?: unknown | null
  bridge: {
    deposit: AcrossDeposit
  }
  swapAndDepositData?: RawSwapAndDepositData
  spokePoolPeripheryAddress?: Address
  destinationSpokePoolAddress?: Address
}

export type ProgressMeta = ApproveMeta | SwapAndBridgeMeta | FillMeta | undefined

export type ApproveMeta = {
  approvalAmount: bigint
  spender: Address
}

export type SwapAndBridgeMeta = {
  swapAndDepositData: SwapAndDepositData
}

export type FillMeta = {
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
      txRequest: unknown
      meta: SwapAndBridgeMeta
    }
  | {
      step: 'swapAndBridge'
      status: 'txPending'
      txHash: Hash
      txRequest?: unknown
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
  walletClient: WalletClient
  originChain: ViemChain
  destinationChain: ViemChain
  userAddress: Address
  swapAndDepositData: SwapAndDepositData
  spokePoolPeripheryAddress: Address
  destinationSpokePoolAddress: Address
  isNative?: boolean
  infiniteApproval?: boolean
  skipAllowanceCheck?: boolean
  throwOnError?: boolean
  onProgress?: (progress: SwapAndBridgeProgress) => void
}

export interface ExecuteSwapAndBridgeResponse {
  depositId?: bigint
  swapAndBridgeTxReceipt?: TransactionReceipt
  fillTxReceipt?: TransactionReceipt
  error?: Error
}
