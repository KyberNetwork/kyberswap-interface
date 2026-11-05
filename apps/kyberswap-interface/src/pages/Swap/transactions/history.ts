import type { BackendTransaction } from 'services/crossChainTransactions'
import type { IndexedTransaction, IndexedTransactionPage } from 'services/walletTransactions'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import {
  type LocalTransaction,
  backendChainToChain,
  backendToFeStatus,
  getLocalSettlement,
  isBackendResolved,
  isTransactionForWallet,
  transactionIdentity,
} from 'state/crossChainSwap/model'
import { type Chain, type Currency, NonEvmChain, type NormalizedTxResponse } from 'types/crossChain'

export type HistoryTransaction = Omit<NormalizedTxResponse, 'sourceToken' | 'targetToken'> & {
  sourceToken: Currency | string
  targetToken: Currency | string
  fromBackend?: boolean
}

type HistoryRecord = BackendTransaction | IndexedTransaction

// A canonical API row owns execution fields. Retain local display metadata only
// when its chain and token identity still match that row.
const retainTokenMetadata = (
  token: Currency | string,
  chain: Chain,
  localToken: Currency | string,
  localChain: Chain,
): Currency | string => {
  if (chain !== localChain || typeof token !== 'string' || !token || typeof localToken === 'string') return token
  if (typeof chain === 'number') {
    const id = token.toLowerCase()
    if ('isNative' in localToken && localToken.isNative && [ETHER_ADDRESS.toLowerCase(), ZERO_ADDRESS].includes(id))
      return localToken
    return 'address' in localToken && localToken.address.toLowerCase() === id ? localToken : token
  }
  if (chain === NonEvmChain.Bitcoin && localToken.symbol === 'BTC') return localToken
  const ids = [
    'id' in localToken ? localToken.id : undefined,
    'assetId' in localToken ? localToken.assetId : undefined,
    'contractAddress' in localToken ? localToken.contractAddress : undefined,
  ]
  return ids.includes(token) ? localToken : token
}

const retainHistoryMetadata = (canonical: HistoryTransaction, local: HistoryTransaction): HistoryTransaction => ({
  ...canonical,
  sourceToken: retainTokenMetadata(canonical.sourceToken, canonical.sourceChain, local.sourceToken, local.sourceChain),
  targetToken: retainTokenMetadata(canonical.targetToken, canonical.targetChain, local.targetToken, local.targetChain),
})

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
  const settlement = getLocalSettlement(tx)
  const settled = settlement ? historyRecordToTransaction(settlement) : undefined
  const { sync: _, settlement: __, ...broadcast } = tx
  return settled ? retainHistoryMetadata({ ...broadcast, ...settled }, broadcast) : broadcast
}

export const mergeTransactionHistory = ({
  server,
  local,
  sender,
}: {
  server: HistoryRecord[]
  local: HistoryTransaction[]
  sender: string
}): HistoryTransaction[] => {
  if (!sender) return []
  const rows = new Map<string, HistoryRecord>()
  const result = new Map<string, HistoryTransaction>()
  const sourceKey = (tx: HistoryTransaction) => transactionIdentity(tx.sourceChain, tx.sourceTxHash, '')

  for (const row of server) {
    const tx = historyRecordToTransaction(row)
    const indexedWalletMatches =
      'historyWallet' in row &&
      (row.historyWallet?.startsWith('0x')
        ? row.historyWallet.toLowerCase() === sender.toLowerCase()
        : row.historyWallet === sender)
    if (!tx || (!indexedWalletMatches && !isTransactionForWallet(tx, sender))) continue
    const key = sourceKey(tx)
    if (isBackendResolved(rows.get(key)) && !isBackendResolved(row)) continue
    rows.set(key, row)
    result.set(key, tx)
  }

  // Local input is ordered by execution ownership. Complete settled API rows
  // supersede it; incomplete/pending index records never regress local execution.
  for (const transaction of local) {
    if (!isTransactionForWallet(transaction, sender)) continue
    const key = sourceKey(transaction)
    const row = rows.get(key)
    if (row && isBackendResolved(row) && row.fromToken && row.toToken) {
      const canonical = result.get(key)
      if (canonical) result.set(key, retainHistoryMetadata(canonical, transaction))
      continue
    }
    result.set(key, transaction)
  }
  return [...result.values()].sort((left, right) => right.timestamp - left.timestamp)
}

export const HISTORY_PAGE_SIZE = 10

export const getLoadedHistory = (pages: IndexedTransactionPage[], local: HistoryTransaction[], sender: string) => {
  const server = pages.flatMap(page => page.transactions)
  const hasMore = !!pages.at(-1)?.nextCursor
  const oldest = server.at(-1)
  const boundary = pages.at(-1)?.oldestTimestamp ?? (oldest ? Date.parse(oldest.createdAt) : Infinity)

  // Keep local rows inside the loaded time window until the remaining API pages are known.
  const transactions = mergeTransactionHistory({ server, local, sender })

  return { transactions: hasMore ? transactions.filter(tx => tx.timestamp > boundary) : transactions, hasMore }
}
