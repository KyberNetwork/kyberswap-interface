import { useCallback, useEffect, useRef } from 'react'
import { useStore } from 'react-redux'
import { getSwapTrackingData } from 'services/crossChain/tracking'

import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import type { AppState } from 'state'
import {
  finishTransactionSync,
  saveTransactionSync,
  selectTransactionSync,
  selectTransactionSyncs,
} from 'state/crossChainSwap'
import { type OutboxEntry, isBackendResolved, mergeOutboxTransaction } from 'state/crossChainSwap/model'
import { reconcileTransaction } from 'state/crossChainSwap/reconcile'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import type { NormalizedTxResponse } from 'types/crossChain'

const getBackendCompletionTrackingData = (entry: OutboxEntry, tx: NormalizedTxResponse) => {
  return {
    ...getSwapTrackingData(tx),
    ...(entry.backend && entry.backend.quoteId !== entry.quoteId
      ? {
          amount_in: entry.backend.fromAmount,
          from_token: entry.backend.fromToken,
          from_token_symbol: undefined,
          from_token_decimals: undefined,
          to_token: entry.backend.toToken,
          to_token_symbol: undefined,
          to_token_decimals: undefined,
          from_chain: entry.backend.fromChain,
          from_chain_name: entry.backend.fromChain,
          to_chain: entry.backend.toChain,
          to_chain_name: entry.backend.toChain,
          recipient: entry.backend.recipient,
          partner: entry.backend.provider,
          fee_percent: undefined,
        }
      : {}),
    amount_in_usd: undefined,
    amount_out_usd: undefined,
    amount_out: entry.backend?.actualOutput ?? undefined,
    target_tx_hash: tx.targetTxHash,
    status: tx.status === 'Success' ? 'succeed' : 'failed',
    timestamp: tx.timestamp,
    time: Date.now(),
  }
}

// Keep registration serialized across updater remounts as well as ordinary renders.
const inFlight = new Set<string>()

// Registration/detail polling belongs to local sync, independently of History.
// Settlement is persisted on the local row; KD owns indexed history refreshes.
export const useBackendTransactionUpdater = () => {
  const dispatch = useAppDispatch()
  const store = useStore<AppState>()
  const entries = useAppSelector(selectTransactionSyncs)

  const { trackingHandler } = useTracking()
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const handlers = useRef({ trackingHandler, crossChainMixpanelHandler })
  handlers.current = { trackingHandler, crossChainMixpanelHandler }

  const refreshed = useRef(new Set<string>())
  const mounted = useRef(false)

  const settle = useCallback(
    (key: string) => {
      const entry = selectTransactionSync(store.getState(), key)
      if (!entry) return

      if (entry.backend && isBackendResolved(entry.backend)) {
        const tx = mergeOutboxTransaction(entry)
        if (
          !entry.completionNotified &&
          entry.feStatus === 'Processing' &&
          (tx.status === 'Success' || tx.status === 'Failed')
        ) {
          dispatch(saveTransactionSync({ ...entry, completionNotified: true }))
          const details = getBackendCompletionTrackingData(entry, tx)
          handlers.current.crossChainMixpanelHandler(
            tx.status === 'Success'
              ? CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_SUCCESS
              : CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_FAILED,
            details,
          )
          handlers.current.trackingHandler(
            tx.status === 'Success' ? TRACKING_EVENT_TYPE.CC_SWAP_COMPLETED : TRACKING_EVENT_TYPE.CC_SWAP_FAILED,
            details,
          )
        }

        dispatch(finishTransactionSync(key))
      } else if (entry.recordingStatus === 'permanent_error' || entry.trackingIssue) {
        dispatch(finishTransactionSync(key))
      }
    },
    [dispatch, store],
  )

  const checkLocal = useCallback(
    async (entry: OutboxEntry) => {
      if (inFlight.has(entry.key)) return

      inFlight.add(entry.key)

      try {
        const refreshStopped = !refreshed.current.has(entry.key)
        refreshed.current.add(entry.key)
        await dispatch(reconcileTransaction(entry.key, refreshStopped))

        if (mounted.current) settle(entry.key)
      } finally {
        inFlight.delete(entry.key)
      }
    },
    [dispatch, settle],
  )

  const tick = useCallback(() => {
    if (!mounted.current || !navigator.onLine) return

    const state = store.getState()
    const entries = selectTransactionSyncs(state)
    entries.forEach(entry => void checkLocal(entry))
  }, [store, checkLocal])

  useEffect(() => {
    mounted.current = true
    const timer = setInterval(tick, 10_000)
    window.addEventListener('online', tick)

    return () => {
      mounted.current = false
      clearInterval(timer)
      window.removeEventListener('online', tick)
    }
  }, [tick])

  useEffect(tick, [tick, entries])
}
