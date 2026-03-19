import { Pool, TxStatus } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BuildZapInData } from 'services/zapInService'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useAddLiquidityRuntimeContext } from 'pages/Earns/PoolDetail/AddLiquidity/context'
import { type ResolvedAddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { TRANSACTION_TYPE } from 'state/transactions/type'

type ReviewTokenIn = {
  symbol: string
  logoUrl?: string
  amount: string
}

type UseReviewTransactionProps = {
  isOpen: boolean
  buildData?: BuildZapInData | null
  pool: Pool
  review: ResolvedAddLiquidityReviewData
  tokensIn: ReviewTokenIn[]
  onAddTrackedTxHash?: (hash: string) => void
  onAddTransactionWithType?: (transaction: any) => void
  onDismiss?: () => void
}

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
  review,
  tokensIn,
  onAddTrackedTxHash,
  onAddTransactionWithType,
  onDismiss,
}: UseReviewTransactionProps) => {
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const { poolParams } = usePoolDetailContext()
  const { txStatusMap, txHashMapping } = useAddLiquidityRuntimeContext()

  const chainId = poolParams.poolChainId
  const exchange = poolParams.exchange as Exchange | undefined
  const poolAddress = pool.address

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
    if (!isOpen) {
      resetTransactionState()
      return
    }

    resetTransactionState()
  }, [isOpen, resetTransactionState])

  const currentTxHash = submittedTxHash ? txHashMapping[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatusMap[submittedTxHash] || txStatusMap[currentTxHash] : undefined
  const txStatus = getModalTxStatus(currentTxStatus)
  const transactionExplorerUrl =
    currentTxHash && chainId
      ? `${NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.etherscanUrl}/tx/${currentTxHash}`
      : undefined

  const handleSubmit = useCallback(async () => {
    if (!account || !exchange || !chainId || !poolAddress || !library) return

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
          pool: review.header.pairLabel,
          tokensIn,
          dexLogoUrl: exchange ? EARN_DEXES[exchange].logo : '',
          dex: exchange || '',
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
  }, [
    account,
    buildData,
    chainId,
    exchange,
    library,
    onAddTrackedTxHash,
    onAddTransactionWithType,
    poolAddress,
    review,
    tokensIn,
  ])

  const handleViewPosition = useCallback(async () => {
    if (!library || !currentTxHash || !exchange || !poolAddress || !chainId) return

    await navigateToPositionAfterZap(library, currentTxHash, chainId, exchange, poolAddress, navigate)
    onDismiss?.()
  }, [chainId, currentTxHash, exchange, library, navigate, onDismiss, poolAddress])

  return {
    confirmDisabled: isSubmitting || !buildData,
    confirmLoading: isSubmitting,
    submitError,
    txHash: submittedTxHash,
    txStatus,
    transactionExplorerUrl,
    handleSubmit,
    handleViewPosition,
    resetTransactionState,
  }
}
