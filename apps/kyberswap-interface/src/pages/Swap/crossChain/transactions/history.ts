import type { BackendTransaction } from 'services/crossChainTransactions'
import type { IndexedTransaction, IndexedTransactionPage } from 'services/walletTransactions'

import type { Chain, Currency, NormalizedTxResponse } from 'pages/Swap/crossChain/adapters/types'

import {
  type LocalTransaction,
  backendChainToChain,
  backendToFeStatus,
  isBackendResolved,
  transactionIdentity,
} from './model'

export type HistoryTransaction = Omit<NormalizedTxResponse, 'sourceToken' | 'targetToken'> & {
  sourceToken: Currency | string
  targetToken: Currency | string
  fromBackend?: boolean
}

type HistoryRecord = BackendTransaction | IndexedTransaction

const sameSender = (chain: Chain, left: string, right: string) =>
  typeof chain === 'number' ? left.toLowerCase() === right.toLowerCase() : left === right

const historyRecordToTransaction = (row: HistoryRecord): HistoryTransaction | undefined => {
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
    amountInUsd: row.inputUsd ?? 0,
    amountOutUsd: row.outputUsd ?? 0,
    platformFeePercent: 0,
    recipient: row.recipient,
    fromBackend: true,
  }
}

/** The single local -> display projection used by History and Processing.
 * It consumes the transaction domain's retained settlement and never reads API
 * detail caches, so both consumers show the same local row. */
export const localTransactionToHistory = (tx: LocalTransaction): HistoryTransaction => {
  const settlement = tx.settlement ?? (isBackendResolved(tx.sync?.backend) ? tx.sync?.backend : undefined)
  const settled = settlement ? historyRecordToTransaction(settlement) : undefined
  const { sync: _, settlement: __, ...broadcast } = tx
  return settled ? { ...broadcast, ...settled } : broadcast
}

export const mergeTransactionHistory = ({
  server,
  local,
  sender,
}: {
  server: HistoryRecord[]
  local: LocalTransaction[]
  sender: string
}): HistoryTransaction[] => {
  if (!sender) return []
  const rows = new Map<string, HistoryRecord>()
  const result = new Map<string, HistoryTransaction>()
  const sourceKey = (chain: Chain, hash: string) => transactionIdentity(chain, hash, '')

  for (const row of server) {
    const tx = historyRecordToTransaction(row)
    const indexedWalletMatches =
      'historyWallet' in row &&
      (row.historyWallet?.startsWith('0x')
        ? row.historyWallet.toLowerCase() === sender.toLowerCase()
        : row.historyWallet === sender)
    if (
      !tx ||
      (!indexedWalletMatches &&
        !sameSender(tx.sourceChain, row.sender, sender) &&
        !sameSender(tx.targetChain, row.recipient, sender))
    )
      continue
    const key = sourceKey(tx.sourceChain, tx.sourceTxHash)
    if (isBackendResolved(rows.get(key)) && !isBackendResolved(row)) continue
    rows.set(key, row)
    result.set(key, tx)
  }

  for (const transaction of local.map(localTransactionToHistory)) {
    if (
      !sameSender(transaction.sourceChain, transaction.sender || '', sender) &&
      !sameSender(transaction.targetChain, transaction.recipient || '', sender)
    )
      continue
    const key = sourceKey(transaction.sourceChain, transaction.sourceTxHash)
    const row = rows.get(key)
    if (row && isBackendResolved(row) && 'fromToken' in row && row.fromToken && row.toToken) continue
    result.set(key, transaction)
  }
  return [...result.values()].sort((left, right) => right.timestamp - left.timestamp)
}

export const HISTORY_PAGE_SIZE = 10

export const getLoadedHistory = (pages: IndexedTransactionPage[], local: LocalTransaction[], sender: string) => {
  const server = pages.flatMap(page => page.transactions)
  const hasMore = !!pages.at(-1)?.nextCursor
  const oldest = server.at(-1)
  const boundary = pages.at(-1)?.oldestTimestamp ?? (oldest ? Date.parse(oldest.createdAt) : Infinity)
  const transactions = mergeTransactionHistory({ server, local, sender })
  return { transactions: hasMore ? transactions.filter(tx => tx.timestamp > boundary) : transactions, hasMore }
}
