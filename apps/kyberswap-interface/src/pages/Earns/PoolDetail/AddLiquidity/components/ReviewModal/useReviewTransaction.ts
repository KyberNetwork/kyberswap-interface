import { NETWORKS_INFO, Pool, TxStatus, ZapRouteDetail } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuildZapInData } from 'services/zap'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getOutputTokenItems, getParsedTokensIn } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { EARN_DEXES } from 'pages/Earns/constants'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { TRANSACTION_TYPE, TransactionHistory } from 'state/transactions/type'

type UseReviewTransactionProps = {
  isOpen: boolean
  buildData?: BuildZapInData | null
  pool: Pool
  route: ZapRouteDetail
  tokenInput: ZapState['tokenInput']
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: TransactionHistory) => void
  onDismiss?: () => void
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
}

export type ReviewTransactionStatusPhase = 'idle' | 'waiting_wallet' | 'processing' | 'success' | 'failed' | 'cancelled'

const getModalTxStatus = (status?: TxStatus): '' | 'success' | 'failed' | 'cancelled' => {
  if (status === TxStatus.SUCCESS) return 'success'
  if (status === TxStatus.FAILED) return 'failed'
  if (status === TxStatus.CANCELLED) return 'cancelled'

  return ''
}

export const useReviewTransaction = ({
  isOpen,
  buildData,
  pool,
  route,
  tokenInput,
  onAddTrackedTxHash,
  onAddTransactionWithType,
  onDismiss,
  onTrackEvent,
}: UseReviewTransactionProps) => {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const { chainId, chainInfo, exchange, poolAddress } = usePoolDetailContext()
  const { txStatusMap, txHashMapping } = useAddLiquidityRuntimeContext()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedTxHash, setSubmittedTxHash] = useState('')
  const submitAttemptIdRef = useRef(0)
  const hasTrackedCompletionRef = useRef(false)

  const resetTransactionState = useCallback(() => {
    submitAttemptIdRef.current += 1
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmittedTxHash('')
  }, [])

  useEffect(() => {
    resetTransactionState()
    hasTrackedCompletionRef.current = false
  }, [isOpen, resetTransactionState])

  const currentTxHash = submittedTxHash ? txHashMapping[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatusMap[submittedTxHash] || txStatusMap[currentTxHash] : undefined
  const txStatus = getModalTxStatus(currentTxStatus)
  const tokensIn = useMemo(
    () => getParsedTokensIn(tokenInput.tokens, tokenInput.amounts),
    [tokenInput.amounts, tokenInput.tokens],
  )
  const outputTokenItems = useMemo(() => getOutputTokenItems(pool, route), [pool, route])
  const statusPhase: ReviewTransactionStatusPhase =
    isSubmitting && !submittedTxHash && !txStatus && !submitError
      ? 'waiting_wallet'
      : submittedTxHash && !txStatus && !submitError
      ? 'processing'
      : txStatus === 'success'
      ? 'success'
      : txStatus === 'failed' || submitError
      ? 'failed'
      : txStatus === 'cancelled'
      ? 'cancelled'
      : 'idle'
  const transactionExplorerUrl = currentTxHash ? `${chainInfo.etherscanUrl}/tx/${currentTxHash}` : undefined

  useEffect(() => {
    if (statusPhase !== 'success' || !currentTxHash || hasTrackedCompletionRef.current) return

    const completedAmountUsd = Number(route.positionDetails.addedAmountUsd || route.zapDetails.initialAmountUsd || 0)

    onTrackEvent?.('LIQ_ADD_COMPLETED', {
      pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      pool_protocol: EARN_DEXES[exchange]?.name,
      pool_fee_tier: `${pool.fee}%`,
      deposit_amount_usd: completedAmountUsd,
      actual_added_token0: outputTokenItems[0]?.amount,
      actual_added_token1: outputTokenItems[1]?.amount,
      tx_hash: currentTxHash,
      chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      pool: poolAddress,
      volume: completedAmountUsd,
    })
    hasTrackedCompletionRef.current = true
  }, [chainId, currentTxHash, exchange, onTrackEvent, outputTokenItems, pool, poolAddress, route, statusPhase])

  const handleSubmit = useCallback(async () => {
    if (!account || !library) return

    setSubmitError(null)

    if (!buildData) {
      setSubmitError('Build route is unavailable.')
      return
    }

    const submitAttemptId = submitAttemptIdRef.current + 1
    submitAttemptIdRef.current = submitAttemptId
    setIsSubmitting(true)

    try {
      const { txHash, error } = await submitTransaction({
        library,
        txData: {
          from: account,
          to: buildData.routerAddress,
          data: buildData.callData,
          value: buildData.value,
        },
      })

      if (!txHash || error) {
        throw new Error(error?.message || 'Transaction failed')
      }

      if (submitAttemptIdRef.current !== submitAttemptId) return

      setSubmittedTxHash(txHash)
      onAddTrackedTxHash?.(txHash)
      onAddTransactionWithType?.({
        hash: txHash,
        type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
        extraInfo: {
          pool: `${pool.token0.symbol}/${pool.token1.symbol}`,
          tokensIn,
          dexLogoUrl: EARN_DEXES[exchange].logo,
          dex: exchange,
        },
      })
      onTrackEvent?.('LIQ_ADDED', {
        pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        pool_protocol: EARN_DEXES[exchange]?.name,
        is_existing_position: false,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
        pool: poolAddress,
        tx_hash: txHash,
      })
    } catch (error) {
      if (submitAttemptIdRef.current !== submitAttemptId) return

      const errorMessage =
        friendlyError(error as Error) || (error as Error)?.message || 'Failed to build or submit zap transaction'
      const normalizedError = errorMessage.toLowerCase()
      const isUserRejected = normalizedError.includes('reject') || normalizedError.includes('denied')

      setSubmitError(errorMessage)
      onTrackEvent?.('LIQ_ADD_FAILED', {
        pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
        pool_fee_tier: `${pool.fee}%`,
        error_type: isUserRejected ? 'user_rejected' : 'transaction_error',
        error_message: errorMessage,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })
    } finally {
      if (submitAttemptIdRef.current !== submitAttemptId) return

      setIsSubmitting(false)
    }
  }, [
    account,
    buildData,
    chainId,
    exchange,
    library,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    onTrackEvent,
    pool,
    poolAddress,
    tokensIn,
  ])

  const handleViewPosition = useCallback(async () => {
    if (!library || !currentTxHash) return

    await navigateToPositionAfterZap(library, currentTxHash, chainId, exchange, poolAddress, navigate)
    onDismiss?.()
  }, [chainId, currentTxHash, exchange, library, navigate, onDismiss, poolAddress])

  return {
    confirmDisabled: isSubmitting || !buildData,
    confirmLoading: isSubmitting,
    statusPhase,
    submitError,
    txHash: submittedTxHash,
    txStatus,
    transactionExplorerUrl,
    handleSubmit,
    handleViewPosition,
    resetTransactionState,
  }
}
