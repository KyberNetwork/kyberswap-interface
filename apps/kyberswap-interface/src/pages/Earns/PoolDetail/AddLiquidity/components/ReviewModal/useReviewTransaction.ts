import { Pool, TxStatus } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuildZapInData } from 'services/zap'

import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import type { ZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { getParsedTokensIn } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { EARN_DEXES } from 'pages/Earns/constants'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { TRANSACTION_TYPE, TransactionHistory } from 'state/transactions/type'

type UseReviewTransactionProps = {
  isOpen: boolean
  buildData?: BuildZapInData | null
  pool: Pool
  tokenInput: ZapState['tokenInput']
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: TransactionHistory) => void
  onDismiss?: () => void
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
  tokenInput,
  onAddTrackedTxHash,
  onAddTransactionWithType,
  onDismiss,
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

  const resetTransactionState = useCallback(() => {
    submitAttemptIdRef.current += 1
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmittedTxHash('')
  }, [])

  useEffect(() => {
    resetTransactionState()
  }, [isOpen, resetTransactionState])

  const currentTxHash = submittedTxHash ? txHashMapping[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatusMap[submittedTxHash] || txStatusMap[currentTxHash] : undefined
  const txStatus = getModalTxStatus(currentTxStatus)
  const tokensIn = useMemo(
    () => getParsedTokensIn(tokenInput.tokens, tokenInput.amounts),
    [tokenInput.amounts, tokenInput.tokens],
  )
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
    } catch (error) {
      if (submitAttemptIdRef.current !== submitAttemptId) return

      setSubmitError(
        friendlyError(error as Error) || (error as Error)?.message || 'Failed to build or submit zap transaction',
      )
    } finally {
      if (submitAttemptIdRef.current !== submitAttemptId) return

      setIsSubmitting(false)
    }
  }, [account, buildData, exchange, library, onAddTrackedTxHash, onAddTransactionWithType, pool, tokensIn])

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
