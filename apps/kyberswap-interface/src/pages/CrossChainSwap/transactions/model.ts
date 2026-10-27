import type { BackendTransaction } from 'services/crossChainTransactions'

import type { Chain, NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'

export type FeStatus = NonNullable<NormalizedTxResponse['status']>
export type RecordingStatus = 'queued' | 'recorded' | 'retryable_error' | 'permanent_error'
export type TrackingIssue = 'mismatched' | 'not_found' | 'expired' | 'unavailable' | 'missing_record'
export type OutboxEntry = {
  key: string
  sender: string
  sourceChain: Chain
  sourceTxHash: string
  quoteId: string
  quoteToken?: string
  transaction: NormalizedTxResponse
  feStatus: FeStatus
  recordingStatus: RecordingStatus
  backend?: BackendTransaction
  backendId?: string
  nextRetryAt: number
  attempts: number
  detailAttempts: number
  createdAt: number
  registrationExpiresAt: number
  trackingIssue?: TrackingIssue
  completionNotified?: boolean
  conflictLookup?: boolean
}

// Local history is the only persisted transaction list. Outbox entries are views
// of rows carrying BE sync state, not another stored transaction snapshot.
export type LocalTransaction = NormalizedTxResponse & {
  sync?: Omit<OutboxEntry, 'transaction' | 'feStatus'>
}
export const localTransactionKey = (tx: Pick<NormalizedTxResponse, 'sourceChain' | 'sourceTxHash' | 'sender'>) =>
  outboxKey(tx.sender || '', tx.sourceChain, tx.sourceTxHash, '')

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  avalanche: 43114,
  fantom: 250,
  arbitrum: 42161,
  optimism: 10,
  zksync: 324,
  linea: 59144,
  base: 8453,
  scroll: 534352,
  blast: 81457,
  mantle: 5000,
  sonic: 146,
  bera: 80094,
  ronin: 2020,
  unichain: 130,
  hyperevm: 999,
  etherlink: 42793,
  plasma: 9745,
  monad: 143,
  robinhood: 4663,
  arc: 5042,
  abstract: 2741,
}
export const backendChainToChain = (chain: string): Chain | undefined => {
  if (['solana', 'near', 'bitcoin'].includes(chain)) return chain as Chain
  const id = CHAIN_IDS[chain] ?? (/^\d+$/.test(chain) ? Number(chain) : undefined)
  return id as Chain | undefined
}
const canonicalChain = (chain: string | number) => String(backendChainToChain(String(chain)) ?? chain)
export const normalizeIdentity = (chain: string | number, identity: string) =>
  /^\d+$/.test(canonicalChain(chain)) ? identity.toLowerCase() : identity
export const normalizeTransactionHash = (chain: string | number, hash: string) =>
  chain === 'bitcoin' ? hash.toLowerCase() : normalizeIdentity(chain, hash)
export const transactionIdentity = (chain: string | number, hash: string, quoteId: string) =>
  JSON.stringify([canonicalChain(chain), normalizeTransactionHash(chain, hash), quoteId])
export const outboxKey = (sender: string, chain: Chain, hash: string, quoteId: string) =>
  JSON.stringify([normalizeIdentity(chain, sender), transactionIdentity(chain, hash, quoteId)])
export const isBackendResolved = (backend?: Pick<BackendTransaction, 'verification' | 'status'>) =>
  backend?.verification === 'verified' && ['success', 'failed', 'refunded'].includes(backend.status)
export const backendToFeStatus: Record<BackendTransaction['status'], FeStatus> = {
  unknown: 'Processing',
  in_progress: 'Processing',
  success: 'Success',
  failed: 'Failed',
  refunded: 'Refunded',
}
export const matchesBackendTransaction = (
  entry: OutboxEntry,
  backend: BackendTransaction,
  allowDifferentQuote = false,
) =>
  canonicalChain(entry.sourceChain) === canonicalChain(backend.fromChain) &&
  normalizeTransactionHash(entry.sourceChain, entry.sourceTxHash) ===
    normalizeTransactionHash(entry.sourceChain, backend.sourceTxHash) &&
  normalizeIdentity(entry.sourceChain, entry.sender) === normalizeIdentity(entry.sourceChain, backend.sender) &&
  (entry.quoteId === backend.quoteId || (allowDifferentQuote && backend.verification === 'verified'))

export const applyBackendSnapshot = (
  entry: OutboxEntry,
  backend: BackendTransaction,
  allowDifferentQuote = false,
): OutboxEntry => {
  if (!matchesBackendTransaction(entry, backend, allowDifferentQuote)) return entry
  if (isBackendResolved(entry.backend) && !isBackendResolved(backend)) return entry
  const resolved = isBackendResolved(backend)
  const stopped = backend.verification === 'mismatched' || backend.verification === 'not_found' || !!backend.expiredAt
  return {
    ...entry,
    backend,
    backendId: backend.id,
    recordingStatus: 'recorded',
    detailAttempts: 0,
    conflictLookup: false,
    ...(resolved || stopped ? { quoteToken: undefined } : {}),
    trackingIssue:
      backend.verification === 'mismatched' || backend.verification === 'not_found'
        ? backend.verification
        : !resolved && backend.expiredAt
        ? 'expired'
        : undefined,
  }
}

export const mergeOutboxTransaction = (entry: OutboxEntry): NormalizedTxResponse => {
  const tx = { ...entry.transaction, status: entry.feStatus }
  const backend = entry.backend
  if (!backend || !isBackendResolved(backend)) return tx
  // Canonical settlement must never inherit a conflicting provider's fill/hash.
  // Quote-time USD values remain estimates; do not synthesize settlement USD.
  return {
    ...tx,
    status: backendToFeStatus[backend.status],
    outputAmount: backend.actualOutput ?? backend.quotedOutput,
    estimatedAmountOut: backend.quotedOutput,
    targetTxHash: backend.destTxHash ?? undefined,
    amountOutUsd: 0,
  }
}

export const canRemoveOutboxEntry = (entry: OutboxEntry) =>
  isBackendResolved(entry.backend) || entry.recordingStatus === 'permanent_error' || !!entry.trackingIssue
export const REGISTRATION_RETRY_WINDOW = 2 * 60 * 60 * 1000
export const MAX_RECORD_ATTEMPTS = 12
export const MAX_DETAIL_RECOVERY_ATTEMPTS = 5
export const retryDelay = (attempt: number) =>
  Math.min(5 * 60 * 1000, 5_000 * 2 ** Math.min(Math.max(attempt - 1, 0), 6))
export const canRetryRegistration = (entry: OutboxEntry, now = Date.now()) =>
  !!entry.quoteToken && now < entry.registrationExpiresAt && entry.attempts < MAX_RECORD_ATTEMPTS
