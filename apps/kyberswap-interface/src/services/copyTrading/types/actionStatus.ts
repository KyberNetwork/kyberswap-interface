import type { DataFinality, LooseString, Metric } from 'services/copyTrading/types/primitives'

// Operator-authored selector: preserve every field verbatim when observing a submitted call.
export type ActionStatusContext = {
  expectedOwner?: string
  creationTransactionHash?: string
  [field: string]: unknown
}

export type ActionReceiptReference = { blockNumber?: string; blockHash?: string }

export type SubmittedActionResultMode =
  | 'SUBMITTED_ACTION_RESULT_MODE_UNSPECIFIED'
  | 'SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST'

export type ActionTransactionEffect = {
  cursor?: ActionReceiptReference & {
    transactionHash?: string
    transactionIndex?: number
    logIndex?: number
    blockTime?: string
  }
  emitter?: string
  create?: {
    account?: string
    owner?: string
    leader?: string
    requestSalt?: string
    initialSigners?: string[]
    createAmountRaw?: string
  }
  transfer?: { token?: string; from?: string; to?: string; amountRaw?: string }
  pause?: { pauseState?: number }
  liquidationConfig?: {
    configs?: {
      followerPositionId?: string
      leaderPositionId?: string
      minimumBaseTokenRateRaw?: string
      deadlineRaw?: string
    }[]
    merkleRoot?: string
  }
  withdrawQuote?: { token?: string; recipient?: string; amountRaw?: string }
  sell?: {
    leaderPositionId?: string
    actor?: string
    baseSoldRaw?: string
    baseUnsoldRaw?: string
    quoteReceivedRaw?: string
  }
}

export type SubmittedActionReceiptResult = {
  kind?: LooseString<
    | 'ACTION_TRANSACTION_KIND_UNSPECIFIED'
    | 'ACTION_TRANSACTION_KIND_START_COPY_CREATE'
    | 'ACTION_TRANSACTION_KIND_START_COPY_FUND'
    | 'ACTION_TRANSACTION_KIND_ADD_CAPITAL'
    | 'ACTION_TRANSACTION_KIND_STOP_COPY'
    | 'ACTION_TRANSACTION_KIND_WITHDRAW_QUOTE'
    | 'ACTION_TRANSACTION_KIND_MANUAL_SELL'
    | 'ACTION_TRANSACTION_KIND_CLOSE_POSITION'
    | 'ACTION_TRANSACTION_KIND_WITHDRAW_TOKENS'
  >
  chainId?: string
  factory?: string
  generationId?: string
  copyAccount?: string
  readOwnerAddress?: string
  effects?: ActionTransactionEffect[]
}

export type SubmittedActionDisplay = {
  status?: LooseString<
    | 'SUBMITTED_ACTION_DISPLAY_STATUS_UNSPECIFIED'
    | 'SUBMITTED_ACTION_DISPLAY_STATUS_PENDING'
    | 'SUBMITTED_ACTION_DISPLAY_STATUS_READY'
    | 'SUBMITTED_ACTION_DISPLAY_STATUS_SYNCING'
  >
  copyRunId?: string
  readOwnerAddress?: string
  userPositionId?: string
  capitalInUsd?: Metric
  capitalOutUsd?: Metric
  finality?: DataFinality
  reason?: string
}

export type SubmittedActionStatusData = {
  status?:
    | 'SUBMITTED_ACTION_STATUS_UNSPECIFIED'
    | 'SUBMITTED_ACTION_STATUS_PENDING'
    | 'SUBMITTED_ACTION_STATUS_CONFIRMING'
    | 'SUBMITTED_ACTION_STATUS_SYNCING'
    | 'SUBMITTED_ACTION_STATUS_SUCCEEDED'
    | 'SUBMITTED_ACTION_STATUS_FAILED'
    | 'SUBMITTED_ACTION_STATUS_UNKNOWN'
  reason?: string
  transaction?: {
    transactionHash?: string
    outcome?:
      | 'ACTION_TRANSACTION_RECEIPT_OUTCOME_UNSPECIFIED'
      | 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS'
      | 'ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED'
    receipt?: ActionReceiptReference
  }
  display?: SubmittedActionDisplay
  receiptResult?: SubmittedActionReceiptResult
  result?: {
    copyRunId?: string
    readOwnerAddress?: string
    stop?: { stopIntentId?: string }
  }
  guidance?: { message?: string; retryAfterMs?: number }
}

export type SubmittedActionStatusRequest = {
  ownerAddress: string
  statusContext: ActionStatusContext
  transactionHash: string
  previousReceipt?: ActionReceiptReference
  resultMode?: SubmittedActionResultMode
}

export type SubmittedActionStatusResponse = { data: SubmittedActionStatusData }
