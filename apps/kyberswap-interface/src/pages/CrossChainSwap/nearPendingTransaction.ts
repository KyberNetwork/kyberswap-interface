import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

const MY_NEAR_WALLET_PENDING_TRANSACTION_KEY = 'cross-chain-swap-my-near-wallet-tx'

export const saveMyNearWalletPendingTransaction = (transaction: NormalizedTxResponse) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY, JSON.stringify(transaction))
}

export const getMyNearWalletPendingTransaction = (): NormalizedTxResponse | null => {
  if (typeof window === 'undefined') return null

  const rawTransaction = window.localStorage.getItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
  if (!rawTransaction) return null

  try {
    const parsedTransaction: unknown = JSON.parse(rawTransaction)

    if (!parsedTransaction || typeof parsedTransaction !== 'object') return null

    const transaction = parsedTransaction as Partial<NormalizedTxResponse>
    if (!transaction.id || !transaction.sourceTxHash) return null

    return transaction as NormalizedTxResponse
  } catch {
    return null
  }
}

export const removeMyNearWalletPendingTransaction = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
}
