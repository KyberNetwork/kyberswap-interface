import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from 'react-redux'
import { KyberCrossAdapter } from 'services/crossChain/adapters/KyberCrossAdapter'
import { kyberCrossApi } from 'services/crossChain/adapters/KyberCrossAdapter/api'
import { mapRouteStateToSwapStatus } from 'services/crossChain/adapters/KyberCrossAdapter/utils'
import { registry } from 'services/crossChain/factory'
import { getSwapTrackingData } from 'services/crossChain/tracking'
import { getChainName } from 'services/crossChain/utils'
import { formatUnits } from 'viem'

import { NotificationType } from 'components/Announcement/type'
import { NativeCurrencies } from 'constants/tokens'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import type { AppState } from 'state'
import { useNotify } from 'state/application/hooks'
import { patchProviderTransactions, useCrossChainTransactions } from 'state/crossChainSwap'
import { isBackendResolved, localTransactionKey } from 'state/crossChainSwap/model'
import { useAppDispatch } from 'state/hooks'
import {
  type NormalizedTxResponse,
  type SwapStatus,
  type TransactionStatus,
  isProcessingTransactionStatus,
} from 'types/crossChain'
import { formatDisplayNumber } from 'utils/numbers'

const STATUS_CHECK_INTERVAL = 10_000
const PROCESSING_STATUS_CHECK_TTL = 24 * 60 * 60 * 1000

const shouldCheckTransactionStatus = (tx: NormalizedTxResponse) => isProcessingTransactionStatus(tx.status)

const isExpiredProcessingTransaction = (tx: NormalizedTxResponse, now = Date.now()) =>
  isProcessingTransactionStatus(tx.status) && now - tx.timestamp >= PROCESSING_STATUS_CHECK_TTL

const getStatusCheckGroups = (transactions: NormalizedTxResponse[]) => {
  const now = Date.now()
  const pollingTxs: NormalizedTxResponse[] = []
  const expiredProcessingTxs: NormalizedTxResponse[] = []

  transactions.forEach(tx => {
    if (!shouldCheckTransactionStatus(tx)) return

    if (isExpiredProcessingTransaction(tx, now)) {
      expiredProcessingTxs.push(tx)
    } else {
      pollingTxs.push(tx)
    }
  })

  return { pollingTxs, expiredProcessingTxs }
}

const getTransactionIdsKey = (transactions: NormalizedTxResponse[]) => transactions.map(localTransactionKey).join('|')

const buildSwapDetails = (tx: NormalizedTxResponse, status: TransactionStatus, targetTxHash?: string) => ({
  ...getSwapTrackingData(tx),
  target_tx_hash: targetTxHash || tx.targetTxHash,
  status,
  time: Date.now(),
  timestamp: tx.timestamp,
})

const getTransactionUpdate = (
  tx: NormalizedTxResponse,
  result?: SwapStatus | null,
): Partial<NormalizedTxResponse> | null => {
  const txHash = result?.txHash || ''
  const status = result?.status || 'Processing'
  const amountOut = result?.amountOut
  const hasActualAmountOut = !!amountOut && amountOut !== '0' && amountOut !== tx.outputAmount
  const hasTargetTxUpdate = !!txHash && txHash !== tx.targetTxHash
  const hasStatusUpdate = status !== tx.status
  const hasGasDropUpdate =
    !!result?.gasDropStatus &&
    (result.gasDropStatus.status !== tx.gasDropStatus?.status ||
      result.gasDropStatus.amount !== tx.gasDropStatus?.amount)

  if (!hasTargetTxUpdate && !hasStatusUpdate && !hasActualAmountOut && !hasGasDropUpdate) return null

  return {
    ...(result?.gasDropStatus ? { gasDropStatus: result.gasDropStatus } : {}),
    targetTxHash: txHash || tx.targetTxHash,
    status,
    ...(hasActualAmountOut && {
      outputAmount: amountOut,
      estimatedAmountOut: tx.estimatedAmountOut || tx.outputAmount,
    }),
  }
}

export const useProviderTransactionUpdater = () => {
  const store = useStore<AppState>()
  const notify = useNotify()
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const transactions = useCrossChainTransactions()
  const dispatch = useAppDispatch()

  const ongoingCallsRef = useRef<Set<string>>(new Set())

  // Terminal enrichment is attempted once per updater mount, including failed requests.
  // Remounting the updater retries it; opening or paginating History does not.
  const terminalCheckedRef = useRef<Set<string>>(new Set())

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transactionsRef = useRef(transactions)
  transactionsRef.current = transactions

  const { pollingTxs, expiredProcessingTxs } = useMemo(() => getStatusCheckGroups(transactions), [transactions])
  const pollingTxIdsKey = getTransactionIdsKey(pollingTxs)
  const expiredProcessingTxIdsKey = getTransactionIdsKey(expiredProcessingTxs)

  // Processing status comes from the adapter recorded on the transaction. KyberCross
  // gets one extra terminal scan because its route API can reveal the final fill/gas
  // details after the processing poll has stopped.
  const terminalTxs = useMemo(
    () =>
      transactions.filter(
        tx => registry.getAdapter(tx.adapter) instanceof KyberCrossAdapter && !isProcessingTransactionStatus(tx.status),
      ),
    [transactions],
  )

  const trackStatusChange = useCallback(
    (tx: NormalizedTxResponse, status: TransactionStatus, targetTxHash?: string) => {
      const swapDetails = buildSwapDetails(tx, status, targetTxHash)

      if (status === 'Success') {
        crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_SUCCESS, {
          ...swapDetails,
          status: 'succeed',
        })
        trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_COMPLETED, {
          ...swapDetails,
          status: 'succeed',
        })
      } else if (status === 'Failed') {
        crossChainMixpanelHandler(CROSS_CHAIN_MIXPANEL_TYPE.CROSS_CHAIN_SWAP_FAILED, {
          ...swapDetails,
          status: 'failed',
        })
        trackingHandler(TRACKING_EVENT_TYPE.CC_SWAP_FAILED, {
          ...swapDetails,
          status: 'failed',
        })
      }
    },
    [crossChainMixpanelHandler, trackingHandler],
  )

  // This is the generic status path for every adapter. Keep analytics and Gas Drop
  // notifications here so they fire only when polling observes a real status change.
  const checkTransactions = useCallback(
    async (txs: NormalizedTxResponse[]) => {
      const txsToCheck = txs.filter(tx => !ongoingCallsRef.current.has(localTransactionKey(tx)))

      if (txsToCheck.length === 0) return

      txsToCheck.forEach(tx => {
        ongoingCallsRef.current.add(localTransactionKey(tx))
      })

      // Commit each result as it arrives; a slow provider must not hold back
      // completed transactions from another request in the same polling cycle.
      await Promise.allSettled(
        txsToCheck.map(async snapshot => {
          const key = localTransactionKey(snapshot)
          try {
            const adapter = registry.getAdapter(snapshot.adapter)
            if (!adapter) return

            const result = await adapter.getTransactionStatus(snapshot)
            const tx = store.getState().crossChainSwap.transactions.find(row => localTransactionKey(row) === key)
            // The BE may have settled this row while the provider request was in flight.
            if (!tx || isBackendResolved(tx.sync?.backend) || isBackendResolved(tx.settlement)) return
            const txUpdate = getTransactionUpdate(tx, result)
            if (!txUpdate) return

            if (txUpdate.status && txUpdate.status !== tx.status) {
              trackStatusChange(tx, txUpdate.status, txUpdate.targetTxHash)
              if (tx.gasDrop && txUpdate.status === 'Success') {
                const native = NativeCurrencies[tx.targetChain as ChainId]
                const gas = txUpdate.gasDropStatus || tx.gasDropStatus
                const input = `${formatDisplayNumber(formatUnits(BigInt(tx.inputAmount), tx.sourceToken.decimals), {
                  significantDigits: 6,
                })} ${tx.sourceToken.symbol}`
                const output = `${formatDisplayNumber(
                  formatUnits(BigInt(txUpdate.outputAmount || tx.outputAmount), tx.targetToken.decimals),
                  { significantDigits: 6 },
                )} ${tx.targetToken.symbol}`
                const gasText =
                  gas?.status === 'Delivered' && gas.amount && native
                    ? ` + ${formatDisplayNumber(formatUnits(BigInt(gas.amount), native.decimals), {
                        significantDigits: 6,
                      })} ${native.symbol} gas`
                    : ''
                const chain = getChainName(tx.targetChain)

                notify({
                  title: t`Swap completed`,
                  summary: t`Swapped ${input} for ${output}${gasText} on ${chain}`,
                  type: NotificationType.SUCCESS,
                })
              }
            }

            dispatch(patchProviderTransactions([{ key, update: txUpdate }]))
          } catch (reason) {
            console.error(`Failed to check status for transaction ${snapshot.id}:`, reason)
          } finally {
            ongoingCallsRef.current.delete(key)
          }
        }),
      )
    },
    [dispatch, trackStatusChange, notify, store],
  )

  // Expired processing txs are checked once per page load/F5, but are kept out of the polling loop.
  useEffect(() => {
    if (expiredProcessingTxIdsKey) {
      checkTransactions(getStatusCheckGroups(transactionsRef.current).expiredProcessingTxs)
    }
  }, [checkTransactions, expiredProcessingTxIdsKey])

  // Active processing txs are checked immediately, then polled every 10s from the latest transaction list.
  useEffect(() => {
    const getCurrentPollingTxs = () => getStatusCheckGroups(transactionsRef.current).pollingTxs

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (pollingTxIdsKey) {
      checkTransactions(getCurrentPollingTxs())

      intervalRef.current = setInterval(() => {
        const currentPollingTxs = getCurrentPollingTxs()

        if (currentPollingTxs.length === 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return
        }

        checkTransactions(currentPollingTxs)
      }, STATUS_CHECK_INTERVAL)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [checkTransactions, pollingTxIdsKey])

  // Terminal enrichment deliberately dispatches only. It must not emit completion
  // analytics or notifications a second time after the processing path did so.
  useEffect(() => {
    const txsToEnrich = terminalTxs.filter(tx => !terminalCheckedRef.current.has(localTransactionKey(tx)))

    txsToEnrich.forEach(tx => {
      terminalCheckedRef.current.add(localTransactionKey(tx))

      void kyberCrossApi
        .scanTxStatus(tx.sourceTxHash as `0x${string}`)
        .then(response => {
          const result = mapRouteStateToSwapStatus(response.data.route_execution, !!tx.gasDrop)

          const key = localTransactionKey(tx)
          const current = store.getState().crossChainSwap.transactions.find(row => localTransactionKey(row) === key)
          if (!current || isBackendResolved(current.sync?.backend) || isBackendResolved(current.settlement)) return

          const update = getTransactionUpdate(current, result)
          if (update) dispatch(patchProviderTransactions([{ key, update }]))
        })
        .catch(() => undefined)
    })
  }, [dispatch, store, terminalTxs])

  return transactions
}
