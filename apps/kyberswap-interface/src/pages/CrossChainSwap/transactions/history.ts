import type { BackendTransaction, TransactionPage } from 'services/crossChainTransactions'

import type { Chain, Currency, NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

import {
  type LocalTransaction,
  backendChainToChain,
  backendToFeStatus,
  isBackendResolved,
  transactionIdentity,
} from './model'

// API history carries token IDs; local broadcasts already carry Currency objects.
// Keep that distinction here. The row resolves metadata with the existing token
// hooks; mapping/merging transactions must not depend on token request timing.
export type HistoryTransaction = Omit<NormalizedTxResponse, 'sourceToken' | 'targetToken'> & {
  sourceToken: Currency | string
  targetToken: Currency | string
  // BE destination hashes are chain transactions; legacy provider IDs may instead
  // point to a provider explorer (e.g. deBridge orders).
  fromBackend?: boolean
}

const sameSender = (chain: Chain, left: string, right: string) =>
  typeof chain === 'number' ? left.toLowerCase() === right.toLowerCase() : left === right

const backendHistoryTransaction = (row: BackendTransaction): HistoryTransaction | undefined => {
  const sourceChain = backendChainToChain(row.fromChain)
  const targetChain = backendChainToChain(row.toChain)
  if (sourceChain === undefined || targetChain === undefined) return undefined
  return {
    id: row.id,
    sourceTxHash: row.sourceTxHash,
    sender: row.sender,
    adapter: row.provider,
    sourceChain,
    targetChain,
    sourceToken: row.fromToken,
    targetToken: row.toToken,
    inputAmount: row.fromAmount,
    outputAmount: row.actualOutput ?? row.quotedOutput,
    targetTxHash: row.destTxHash ?? undefined,
    timestamp: Date.parse(row.createdAt),
    status: backendToFeStatus[row.status],
    // These are quote values only. History does not present them as settlement USD.
    amountInUsd: row.inputUsd ?? 0,
    amountOutUsd: row.outputUsd ?? 0,
    platformFeePercent: 0,
    recipient: row.recipient,
    fromBackend: true,
  }
}

export const mergeTransactionHistory = ({
  server,
  local,
  sender,
}: {
  server: BackendTransaction[]
  local: LocalTransaction[]
  sender: string
}): HistoryTransaction[] => {
  if (!sender) return []
  const rows = new Map<string, BackendTransaction>()
  const result = new Map<string, HistoryTransaction>()
  const sourceKey = (chain: Chain, hash: string) => transactionIdentity(chain, hash, '')
  for (const row of server) {
    const tx = backendHistoryTransaction(row)
    if (!tx || !sameSender(tx.sourceChain, row.sender, sender)) continue
    const key = sourceKey(tx.sourceChain, tx.sourceTxHash)
    if (isBackendResolved(rows.get(key)) && !isBackendResolved(row)) continue
    rows.set(key, row)
    result.set(key, tx)
  }
  for (const tx of local) {
    if (!sameSender(tx.sourceChain, tx.sender || '', sender)) continue
    const key = sourceKey(tx.sourceChain, tx.sourceTxHash)
    const row = rows.get(key)
    if (isBackendResolved(row)) continue
    // Provider progress remains visible while BE registration/status lags.
    // Sync expiry leaves a plain local row with exactly the legacy behavior.
    const { sync: _, ...transaction } = tx
    result.set(key, transaction)
  }
  return [...result.values()].sort((left, right) => right.timestamp - left.timestamp)
}

export const HISTORY_PAGE_SIZE = 10

// API pages are newest-first, but they are not UI pages: local rows consume slots
// too. Only expose the time range already covered by the cursor. Older local rows
// wait until that range is fetched, otherwise later API pages would insert ahead
// of them and move records between UI pages. Exhausting the cursor releases all.
export const getLoadedHistory = (
  pages: TransactionPage[],
  local: LocalTransaction[],
  cached: BackendTransaction[],
  sender: string,
) => {
  const server = pages.flatMap(page => page.transactions)
  const cachedById = new Map(cached.map(row => [row.id, row]))
  const listedIds = new Set(server.map(row => row.id))
  const hasMore = !!pages.at(-1)?.nextCursor
  const oldest = server.at(-1)
  const boundary = oldest ? Date.parse(oldest.createdAt) : Infinity
  const transactions = mergeTransactionHistory({
    server: [
      ...server.map(row => cachedById.get(row.id) ?? row),
      // Settlement removes the local row before the list necessarily refetches.
      // Retain that handoff from detail cache within the same cursor boundary.
      ...cached.filter(row => !listedIds.has(row.id) && isBackendResolved(row)),
    ],
    local,
    sender,
  })
  // Keep equal timestamps behind the boundary until the next cursor is loaded.
  return { transactions: hasMore ? transactions.filter(tx => tx.timestamp > boundary) : transactions, hasMore }
}
