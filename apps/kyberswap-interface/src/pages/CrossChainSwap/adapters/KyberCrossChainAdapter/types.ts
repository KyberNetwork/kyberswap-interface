import { type Address, type Hash, type Hex, type TransactionReceipt, type Chain as ViemChain, WalletClient } from 'viem'

export type KyberCrossTx = {
  to?: Address
  data?: Hex
  txData?: Hex
  value?: string | number | bigint
}

export type KyberCrossRoutePlan = {
  route_id?: string
  provider?: string
}

export type KyberCrossResponseData = {
  route_plan?: KyberCrossRoutePlan
  build?: {
    tx?: KyberCrossTx
  }
}

export type KyberCrossRawQuote = {
  request_id?: string
  data?: KyberCrossResponseData | Hex
  steps?: {
    provider?: string
  }[]
  build?: {
    tx?: KyberCrossTx
  }
  tx?: KyberCrossTx
  to?: Address
  txData?: Hex
  value?: string | number | bigint
  isNativeToken?: boolean
}

export type ApproveMeta = {
  approvalAmount: bigint
  spender: Address
}

export type CrossChainExecuteProgress =
  | { step: 'approve'; status: 'checking' }
  | { step: 'approve'; status: 'txPending'; txHash: Hash; meta: ApproveMeta }
  | { step: 'approve'; status: 'txSuccess'; txReceipt: TransactionReceipt; meta: ApproveMeta }
  | { step: 'ksExecute'; status: 'simulationPending' }
  | { step: 'ksExecute'; status: 'simulationSuccess'; txRequest: unknown }
  | { step: 'ksExecute'; status: 'txPending'; txHash: Hash }
  | { step: 'ksExecute'; status: 'txSuccess'; txReceipt: TransactionReceipt }
  | { step: 'approve' | 'ksExecute'; status: 'error'; error: Error }

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
  inputToken: Address
  inputAmount: bigint
  isNativeToken: boolean
  infiniteApproval?: boolean
  throwOnError?: boolean
  onProgress?: (progress: CrossChainExecuteProgress) => void
}
