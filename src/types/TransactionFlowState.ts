export type TransactionFlowState = {
  showConfirm: boolean
  attemptingTxn: boolean
  errorMessage: string | undefined
  txHash: string | undefined
  pendingText: string | undefined
}
