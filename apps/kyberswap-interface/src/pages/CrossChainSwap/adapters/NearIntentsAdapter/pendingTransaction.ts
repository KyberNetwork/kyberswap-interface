import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

const MY_NEAR_WALLET_PENDING_TRANSACTION_KEY = 'cross-chain-swap-my-near-wallet-tx'

export type PendingNearTransaction = Omit<NormalizedTxResponse, 'sourceTxHash' | 'depositAddress'> & {
  depositAddress: string
  quoteId?: string
  quoteToken?: string
  expectedTransactions?: number
}

// NEAR FT deposits include a preceding storage registration. Only the final
// transfer hash is the source swap transaction, never the storage receipt.
export const getNearTransferHash = (hashes: string[] | undefined, expectedTransactions = 1): string | undefined => {
  if (hashes?.length !== expectedTransactions) return undefined
  const hash = hashes[hashes.length - 1]
  return /^[1-9A-HJ-NP-Za-km-z]{32,64}$/.test(hash) ? hash : undefined
}

export const saveMyNearWalletPendingTransaction = (transaction: PendingNearTransaction) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY, JSON.stringify(transaction))
}

export const getMyNearWalletPendingTransaction = (): PendingNearTransaction | null => {
  if (typeof window === 'undefined') return null

  const rawTransaction = window.localStorage.getItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
  if (!rawTransaction) return null

  try {
    const parsedTransaction: unknown = JSON.parse(rawTransaction)

    if (!parsedTransaction || typeof parsedTransaction !== 'object') return null

    const transaction = parsedTransaction as Partial<PendingNearTransaction> & { sourceTxHash?: string }
    // Compatibility with saved redirects from before depositAddress was explicit.
    // The old sourceTxHash was a deposit address, not an on-chain transaction.
    const depositAddress = transaction.depositAddress ?? transaction.id
    if (!transaction.id || !depositAddress) return null
    const { sourceTxHash: _hash, ...pending } = transaction
    return { ...pending, depositAddress } as PendingNearTransaction
  } catch {
    return null
  }
}

export const removeMyNearWalletPendingTransaction = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(MY_NEAR_WALLET_PENDING_TRANSACTION_KEY)
}
