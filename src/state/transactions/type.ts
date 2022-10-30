export interface SerializableTransactionReceipt {
  blockHash: string
  status?: number
}

export interface TransactionDetails {
  hash: string
  approval?: { tokenAddress: string; spender: string }
  type?: string
  summary?: string
  receipt?: SerializableTransactionReceipt
  lastCheckedBlockNumber?: number
  addedTime: number
  confirmedTime?: number
  from: string
  arbitrary: any // To store anything arbitrary, so it has any type
  needCheckSubgraph?: boolean
}

export interface GroupedTxsByHash {
  [firstTxHash: string]: TransactionDetails[] | undefined
}
