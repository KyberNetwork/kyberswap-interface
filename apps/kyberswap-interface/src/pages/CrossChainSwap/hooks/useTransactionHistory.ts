import { useCallback, useEffect, useMemo, useRef } from 'react'

import { ETHER_ADDRESS } from 'constants/index'
import useTracking, { CROSS_CHAIN_MIXPANEL_TYPE, TRACKING_EVENT_TYPE, useCrossChainMixpanel } from 'hooks/useTracking'
import {
  type Chain,
  type Currency,
  NonEvmChain,
  type NormalizedTxResponse,
  type SwapStatus,
} from 'pages/CrossChainSwap/adapters/types'
import { registry } from 'pages/CrossChainSwap/hooks/useCrossChainSwap'
import { getChainName } from 'pages/CrossChainSwap/utils'
import { useCrossChainTransactions } from 'state/crossChainSwap'

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

const hasTokenId = (token: Currency): token is Currency & { id: string } => 'id' in token

const hasAssetId = (token: Currency): token is Currency & { assetId: string } => 'assetId' in token

const hasWrappedAddress = (token: Currency): token is Currency & { wrapped: { address?: string } } =>
  'wrapped' in token && typeof token.wrapped === 'object' && token.wrapped !== null

const getTokenTrackingId = (chain: Chain, token: Currency) => {
  if (chain === NonEvmChain.Bitcoin) return token.symbol
  if (chain === NonEvmChain.Solana && hasTokenId(token)) return token.id
  if (chain === NonEvmChain.Near && hasAssetId(token)) return token.assetId
  if ('isNative' in token && token.isNative) return ETHER_ADDRESS
  if ('address' in token && typeof token.address === 'string') return token.address
  if (hasWrappedAddress(token) && typeof token.wrapped.address === 'string') return token.wrapped.address

  return token.symbol
}

const buildSwapDetails = (tx: NormalizedTxResponse, status: TransactionStatus, targetTxHash?: string) => ({
  amount_in: tx.inputAmount,
  amount_in_usd: tx.amountInUsd,
  amount_out: tx.outputAmount,
  amount_out_usd: tx.amountOutUsd,
  currency: 'USD',
  fee_percent: tx.platformFeePercent,
  from_chain: tx.sourceChain,
  from_chain_name: getChainName(tx.sourceChain),
  from_token: getTokenTrackingId(tx.sourceChain, tx.sourceToken),
  from_token_symbol: tx.sourceToken?.symbol,
  from_token_decimals: tx.sourceToken?.decimals,
  to_chain: tx.targetChain,
  to_chain_name: getChainName(tx.targetChain),
  to_token: getTokenTrackingId(tx.targetChain, tx.targetToken),
  to_token_symbol: tx.targetToken?.symbol,
  to_token_decimals: tx.targetToken?.decimals,
  partner: tx.adapter,
  platform: 'KyberSwap Cross-Chain',
  source_tx_hash: tx.sourceTxHash,
  target_tx_hash: targetTxHash || tx.targetTxHash,
  recipient: tx.recipient,
  sender: tx.sender,
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

  if (!hasTargetTxUpdate && !hasStatusUpdate && !hasActualAmountOut) return null

  return {
    targetTxHash: txHash || tx.targetTxHash,
    status,
    ...(hasActualAmountOut && {
      outputAmount: amountOut,
      estimatedAmountOut: tx.estimatedAmountOut || tx.outputAmount,
    }),
  }
}

export const useTransactionHistory = () => {
  const { crossChainMixpanelHandler } = useCrossChainMixpanel()
  const { trackingHandler } = useTracking()
  const [transactions, setTransactions] = useCrossChainTransactions()

  const ongoingCallsRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const transactionsRef = useRef(transactions)
  transactionsRef.current = transactions

  const { pollingTxs, expiredProcessingTxs } = useMemo(() => getStatusCheckGroups(transactions), [transactions])
  const pollingTxIdsKey = getTransactionIdsKey(pollingTxs)
  const expiredProcessingTxIdsKey = getTransactionIdsKey(expiredProcessingTxs)

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
    [setTransactions, trackStatusChange],
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

  return transactions
}
