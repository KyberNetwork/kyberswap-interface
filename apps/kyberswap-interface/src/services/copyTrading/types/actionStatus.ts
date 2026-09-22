// Operator-authored selector: preserve every field verbatim when observing a submitted call.
export type ActionStatusContext = {
  expectedOwner?: string
  [field: string]: unknown
}

export type ActionReceiptReference = { blockNumber?: string; blockHash?: string }

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
}

export type SubmittedActionStatusResponse = { data: SubmittedActionStatusData }
