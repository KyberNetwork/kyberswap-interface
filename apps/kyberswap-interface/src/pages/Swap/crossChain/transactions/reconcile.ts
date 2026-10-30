import crossChainTransactionsApi, {
  type TransactionApiError,
  isPermanentTransactionError,
} from 'services/crossChainTransactions'

import type { AppDispatch, AppState } from 'state'
import { saveTransactionSync, selectTransactionSync } from 'state/crossChainSwap'

import {
  MAX_DETAIL_RECOVERY_ATTEMPTS,
  MAX_RECORD_ATTEMPTS,
  type OutboxEntry,
  applyBackendSnapshot,
  canRetryRegistration,
  isBackendResolved,
  normalizeTransactionHash,
  retryDelay,
} from './model'

const TRACKING_TTL = 24 * 60 * 60 * 1000
const failRegistration = (
  patch: (key: string, update: (entry: OutboxEntry) => OutboxEntry) => void,
  key: string,
  permanent: boolean,
  now: number,
) =>
  patch(key, entry => {
    const attempts = entry.attempts + 1
    const stopped = permanent || attempts >= MAX_RECORD_ATTEMPTS || now >= entry.registrationExpiresAt
    return {
      ...entry,
      attempts,
      recordingStatus: stopped ? 'permanent_error' : 'retryable_error',
      quoteToken: stopped ? undefined : entry.quoteToken,
      trackingIssue: stopped ? 'unavailable' : entry.trackingIssue,
      nextRetryAt: now + retryDelay(attempts),
    }
  })

/** Runs one BE step. The caller serializes by key; every write reads the latest
 * entry so provider updates and newly submitted swaps cannot be overwritten. */
export const reconcileTransaction =
  (key: string, refreshStopped = false, now = Date.now()) =>
  async (dispatch: AppDispatch, getState: () => AppState) => {
    const current = (key: string) => selectTransactionSync(getState(), key)
    const patch = (key: string, update: (entry: OutboxEntry) => OutboxEntry) => {
      const entry = current(key)
      if (entry) dispatch(saveTransactionSync(update(entry)))
    }
    let entry = current(key)
    if (!entry || isBackendResolved(entry.backend)) return
    if (entry.nextRetryAt > now && !(refreshStopped && entry.trackingIssue)) return

    if (entry.recordingStatus === 'queued' || entry.recordingStatus === 'retryable_error') {
      if (!canRetryRegistration(entry, now) || !entry.quoteToken) {
        failRegistration(patch, key, true, now)
        return
      }
      try {
        const recorded = await dispatch(
          crossChainTransactionsApi.endpoints.recordTransaction.initiate(
            { quoteToken: entry.quoteToken, sourceTxHash: entry.sourceTxHash },
            { track: false },
          ),
        ).unwrap()
        if (
          recorded.quoteId !== entry.quoteId ||
          normalizeTransactionHash(entry.sourceChain, recorded.sourceTxHash) !==
            normalizeTransactionHash(entry.sourceChain, entry.sourceTxHash)
        ) {
          failRegistration(patch, key, true, now)
          return
        }
        patch(key, latest => ({ ...latest, backendId: recorded.id, recordingStatus: 'recorded' }))
      } catch (reason) {
        const error = reason as TransactionApiError
        if (error.status === 409 || error.code === 4013) {
          patch(key, latest => ({
            ...latest,
            recordingStatus: 'recorded',
            conflictLookup: true,
            quoteToken: undefined,
          }))
        } else {
          const permanent = isPermanentTransactionError(error)
          failRegistration(patch, key, permanent, now)
          return
        }
      }
    }

    entry = current(key)
    if (!entry) return
    // Quote-token expiry limits registration retries only. Accepted records keep
    // polling detail until settlement, a tracking issue or the tracking TTL.
    const stopped = entry.trackingIssue || now - entry.createdAt >= TRACKING_TTL
    if (stopped && !refreshStopped) {
      if (!entry.trackingIssue) patch(key, latest => ({ ...latest, trackingIssue: 'expired', quoteToken: undefined }))
      return
    }
    if (entry.recordingStatus !== 'recorded' && !refreshStopped) return

    try {
      const backend = await dispatch(
        crossChainTransactionsApi.endpoints.getTransaction.initiate(
          {
            sourceTxHash: entry.sourceTxHash,
            chain: entry.sourceChain,
            ...(entry.conflictLookup ? {} : { quoteId: entry.backend?.quoteId ?? entry.quoteId }),
          },
          { subscribe: false, forceRefetch: true },
        ),
      ).unwrap()
      patch(key, latest => {
        if (isBackendResolved(latest.backend)) return latest
        const updated = applyBackendSnapshot(
          latest,
          backend,
          !!latest.conflictLookup || latest.backendId === backend.id,
        )
        if (updated === latest) return { ...latest, trackingIssue: 'unavailable', quoteToken: undefined }
        return { ...updated, detailAttempts: 0, nextRetryAt: now + 10_000 }
      })
    } catch (reason) {
      const error = reason as TransactionApiError
      patch(key, latest => {
        if (isBackendResolved(latest.backend)) return latest
        const detailAttempts = latest.detailAttempts + 1
        const missing = error.status === 404
        const permanent = !missing && isPermanentTransactionError(error)
        // Only an explicit detail 404 can requeue an accepted record. Never infer
        // deletion from absence in a list page, or replace its original quote.
        const canRecordAgain =
          missing &&
          error.code === 4040 &&
          !!latest.quoteToken &&
          now < latest.registrationExpiresAt &&
          detailAttempts < 3 &&
          !latest.conflictLookup
        const stopped = permanent || detailAttempts >= MAX_DETAIL_RECOVERY_ATTEMPTS || (missing && !canRecordAgain)
        return {
          ...latest,
          detailAttempts,
          ...(canRecordAgain ? { recordingStatus: 'queued' as const } : {}),
          ...(stopped
            ? { trackingIssue: missing ? ('missing_record' as const) : ('unavailable' as const), quoteToken: undefined }
            : {}),
          nextRetryAt: now + retryDelay(detailAttempts),
        }
      })
    }
  }
