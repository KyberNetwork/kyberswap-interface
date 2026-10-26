import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { formatUnits } from 'viem'

import { NotificationType } from 'components/Announcement/type'
import { NativeCurrencies } from 'constants/tokens'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import { KyberCrossAdapter } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter'
import { kyberCrossApi } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'
import { mapRouteStateToSwapStatus } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/utils'
import { type NormalizedTxResponse, type SwapStatus } from 'pages/CrossChainSwap/adapters/types'
import { registry } from 'pages/CrossChainSwap/factory'
import { getSwapTrackingData } from 'pages/CrossChainSwap/tracking'
import { getChainName } from 'pages/CrossChainSwap/utils'
import { useNotify } from 'state/application/hooks'
import { updateTransactionStatus, useCrossChainTransactions } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'
import { formatDisplayNumber } from 'utils/numbers'

const STATUS_CHECK_INTERVAL = 10_000
const PROCESSING_STATUS_CHECK_TTL = 24 * 60 * 60 * 1000

export type TransactionStatus = NonNullable<NormalizedTxResponse['status']>

export const isProcessingTransactionStatus = (status?: TransactionStatus) => !status || status === 'Processing'

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

const getTransactionIdsKey = (transactions: NormalizedTxResponse[]) => transactions.map(tx => tx.id).join('|')

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

export const useTransactionHistory = () => {
  const notify = useNotify()
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const [transactions, setTransactions] = useCrossChainTransactions()
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
      const txsToCheck = txs.filter(tx => !ongoingCallsRef.current.has(tx.id))

      if (txsToCheck.length === 0) return

      txsToCheck.forEach(tx => {
        ongoingCallsRef.current.add(tx.id)
      })

      const checkedTxs = await Promise.allSettled(
        txsToCheck.map(async tx => {
          try {
            const adapter = registry.getAdapter(tx.adapter)
            if (!adapter) return null

            const result = await adapter.getTransactionStatus(tx)
            const txUpdate = getTransactionUpdate(tx, result)
            if (!txUpdate) return null

            return { tx, update: txUpdate }
          } finally {
            ongoingCallsRef.current.delete(tx.id)
          }
        }),
      )

      const txUpdates = checkedTxs.flatMap((result, index) => {
        if (result.status === 'fulfilled') return result.value ? [result.value] : []

        console.error(`Failed to check status for transaction ${txsToCheck[index].id}:`, result.reason)
        return []
      })

      if (txUpdates.length > 0) {
        let hasUpdates = false
        const txUpdateMap = new Map(txUpdates.map(({ tx, update }) => [tx.id, update]))
        const updatedTransactions = transactionsRef.current.map(tx => {
          const txUpdate = txUpdateMap.get(tx.id)
          if (!txUpdate) return tx

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

          hasUpdates = true
          return {
            ...tx,
            ...txUpdate,
          }
        })

        if (!hasUpdates) return

        setTransactions(updatedTransactions)
      }
    },
    [setTransactions, trackStatusChange, notify],
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
    const txsToEnrich = terminalTxs.filter(tx => !terminalCheckedRef.current.has(tx.id))

    txsToEnrich.forEach(tx => {
      terminalCheckedRef.current.add(tx.id)

      void kyberCrossApi
        .scanTxStatus(tx.sourceTxHash as `0x${string}`)
        .then(response => {
          const result = mapRouteStateToSwapStatus(response.data.route_execution, !!tx.gasDrop)

          dispatch(updateTransactionStatus({ id: tx.id, result }))
        })
        .catch(() => undefined)
    })
  }, [dispatch, terminalTxs])

  return transactions
}
