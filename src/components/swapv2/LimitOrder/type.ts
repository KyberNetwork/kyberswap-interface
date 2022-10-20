export type LimitOrderSwapState = {
  showConfirm: boolean
  attemptingTxn: boolean
  swapErrorMessage: string | undefined
  txHash: string | undefined
  pendingText: string
}
