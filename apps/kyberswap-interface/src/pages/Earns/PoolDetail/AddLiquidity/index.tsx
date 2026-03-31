import { type ApprovalAdditionalInfo } from '@kyber/hooks'
import { NETWORKS_INFO, PoolType, Pool as ZapPool, ZapRouteDetail } from '@kyber/schema'
import { translateFriendlyErrorMessage, translateZapMessage } from '@kyber/ui'
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BuildZapInData, prepareBuildZapInRouteRequest, useBuildZapInRouteMutation } from 'services/zap'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import AddLiquidityRoutePreview from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityRoutePreview'
import AddLiquidityWidget from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidget'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/AddLiquidity/components/ReviewModal'
import {
  AddLiquidityRuntimeContextValue,
  AddLiquidityRuntimeProvider,
  AddLiquiditySubmitTxData,
  useAddLiquidityRuntimeContext,
} from 'pages/Earns/PoolDetail/AddLiquidity/context'
import { useFeedback } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useFeedback'
import { useZapPool } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapPool'
import { type ZapState, useZapState } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { submitTransaction } from 'pages/Earns/utils'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionHistory } from 'state/transactions/type'
import { useDegenModeManager } from 'state/user/hooks'

type AddLiquidityProps = {
  children?: ReactNode
}

type AddLiquidityFeedback = ReturnType<typeof useFeedback>
type AddLiquidityReviewWarnings = ReturnType<typeof useFeedback>['modal']['warnings']

type ReviewState = {
  buildData: BuildZapInData
  route: ZapRouteDetail
  slippage?: number
  warnings: AddLiquidityReviewWarnings
}

type AddLiquidityBodyProps = AddLiquidityProps & {
  chainId: number
  feedback: AddLiquidityFeedback
  isRefreshingReview: boolean
  onOpenZapMigration?: (
    position: { exchange: string; poolId: string; positionId: string | number },
    initialTick?: { tickUpper: number; tickLower: number },
    initialSlippage?: number,
  ) => void
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onDismissReview: () => void
  onPreview: () => Promise<void>
  previewError?: string | null
  reviewState: ReviewState | null
  onUseSuggestedSlippage: (suggestedSlippage?: number) => void
  tracking: AddLiquidityTracking
  normalizedPool: ZapPool
  state: ZapState
}

type AddLiquidityTracking = {
  addTrackedTxHash: (hash: string) => void
  addTransactionWithType: (transaction: TransactionHistory) => void
}

const PoolInformationColumn = styled(Stack)`
  flex: 1 1 480px;
  min-width: 0;
  gap: 24px;
  order: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    order: 2;
  `}
`

const AddLiquidityColumn = styled(Stack)`
  flex: 1 1 480px;
  max-width: 480px;
  min-width: 0;
  gap: 16px;
  order: 2;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    order: 1;
    max-width: none;
  `}
`

const TRACKING_EVENT_MAP: Record<string, TRACKING_EVENT_TYPE> = {
  LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
  LIQ_EXISTING_POSITION_SELECTED: TRACKING_EVENT_TYPE.LIQ_EXISTING_POSITION_SELECTED,
  LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
  LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
  PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
  PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
  LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
  LIQ_ZAP_SUMMARY_VIEWED: TRACKING_EVENT_TYPE.LIQ_ZAP_SUMMARY_VIEWED,
  LIQ_PREVIEW_CLICKED: TRACKING_EVENT_TYPE.LIQ_PREVIEW_CLICKED,
  LIQ_ADDED: TRACKING_EVENT_TYPE.LIQ_ADDED,
  LIQ_ADD_COMPLETED: TRACKING_EVENT_TYPE.LIQ_ADD_COMPLETED,
  LIQ_ADD_FAILED: TRACKING_EVENT_TYPE.LIQ_ADD_FAILED,
  LIQ_ADD_CANCELLED: TRACKING_EVENT_TYPE.LIQ_ADD_CANCELLED,
}

const AddLiquidityBody = ({
  chainId,
  children,
  feedback,
  isRefreshingReview,
  onOpenZapMigration,
  onTrackEvent,
  onDismissReview,
  onPreview,
  previewError,
  reviewState,
  onUseSuggestedSlippage,
  normalizedPool,
  state,
  tracking,
}: AddLiquidityBodyProps) => {
  const { buildRouteLoading } = useAddLiquidityRuntimeContext()

  return (
    <>
      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <PoolInformationColumn>
          <AddLiquidityRoutePreview
            inputTokens={state.tokenInput.tokens}
            inputAmounts={state.tokenInput.amounts}
            pool={normalizedPool}
            zapRoute={state.route.data}
          />
          {children}
        </PoolInformationColumn>

        <AddLiquidityColumn>
          <AddLiquidityWidget
            context={{
              chainId,
              poolAddress: normalizedPool.address,
              poolType: normalizedPool.poolType,
              pool: normalizedPool,
            }}
            state={state}
            preview={{
              loading: buildRouteLoading,
              onPreview,
            }}
            feedback={feedback.widget}
            onOpenZapMigration={onOpenZapMigration}
            onTrackEvent={onTrackEvent}
          />

          {feedback.page.warnings.length || previewError ? (
            <Stack gap={12}>
              {feedback.page.warnings.map((warning, index) => (
                <NoteCard key={`${warning.kind}-${index}`} $tone={warning.tone}>
                  {translateZapMessage(warning.message)}
                </NoteCard>
              ))}

              {previewError ? (
                <NoteCard $tone="error">{translateFriendlyErrorMessage(previewError) || previewError}</NoteCard>
              ) : null}
            </Stack>
          ) : null}
        </AddLiquidityColumn>
      </HStack>

      {reviewState ? (
        <AddLiquidityReviewModal
          pool={normalizedPool}
          buildData={reviewState.buildData}
          chainId={chainId}
          error={previewError}
          isRefreshing={isRefreshingReview}
          priceRange={state.priceRange}
          route={reviewState.route}
          slippage={reviewState.slippage}
          tokenInput={state.tokenInput}
          warnings={reviewState.warnings}
          onDismiss={onDismissReview}
          onTrackEvent={onTrackEvent}
          onUseSuggestedSlippage={onUseSuggestedSlippage}
          onAddTrackedTxHash={tracking.addTrackedTxHash}
          onAddTransactionWithType={tracking.addTransactionWithType}
        />
      ) : null}
    </>
  )
}

const AddLiquidity = ({ children }: AddLiquidityProps) => {
  const { pool, chainId, exchange, poolAddress } = usePoolDetailContext()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()
  const deadline = useTransactionDeadline()
  const deadlineValue = deadline ? Number(deadline.toString()) : undefined

  const [isDegenMode] = useDegenModeManager()
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isRefreshingReview, setIsRefreshingReview] = useState(false)
  const [reviewState, setReviewState] = useState<ReviewState | null>(null)
  const refreshSourceRouteRef = useRef<ZapRouteDetail | null>(null)

  const { widget: zapMigrationWidget, handleOpenZapMigration: openZapMigrationWidget } = useZapMigrationWidget()
  const { trackingHandler } = useTracking()

  const addTransactionWithType = useTransactionAdder()
  const [buildZapInRoute, buildRouteState] = useBuildZapInRouteMutation()
  const { originalToCurrentHash, txStatus, addTrackedTxHash } = useTransactionReplacement()

  const poolType = ZAPIN_DEX_MAPPING[exchange] || PoolType.DEX_UNISWAPV3

  const normalizedPool = useZapPool({
    chainId,
    pool,
    poolType,
  })

  const state = useZapState({
    chainId,
    pool: normalizedPool.data,
    poolAddress,
    poolType,
    account,
    source: 'kyberswap-earn',
  })

  const feedback = useFeedback({
    poolChainId: chainId,
    pool: normalizedPool.data,
    poolType,
    state,
    isDegenMode,
  })

  useEffect(() => {
    if (!reviewState) {
      setPreviewError(null)
    }
  }, [reviewState])

  const buildReviewState = useCallback(
    async (route: ZapRouteDetail, warnings: AddLiquidityReviewWarnings, slippage?: number) => {
      if (!account) {
        throw new Error('Wallet is not connected')
      }

      if (!deadlineValue) {
        throw new Error('Build route is unavailable.')
      }

      const request = prepareBuildZapInRouteRequest({
        chainId,
        sender: account,
        recipient: account,
        route: route.route,
        deadline: deadlineValue,
        source: 'kyberswap-earn',
      })
      if (!request.data) {
        throw new Error(request.error || 'Build route is unavailable.')
      }

      const response = await buildZapInRoute(request.data).unwrap()
      if (!response.data?.callData || !response.data.routerAddress) {
        throw new Error(response.message || 'Failed to build zap route')
      }

      return {
        buildData: response.data,
        route,
        slippage,
        warnings,
      }
    },
    [account, buildZapInRoute, chainId, deadlineValue],
  )

  useEffect(() => {
    if (!isRefreshingReview || !reviewState) return
    if (state.route.loading) return

    if (state.route.error) {
      setPreviewError(state.route.error)
      setIsRefreshingReview(false)
      refreshSourceRouteRef.current = null
      return
    }

    if (!state.route.data || state.route.data === refreshSourceRouteRef.current) return

    let cancelled = false

    const rebuildReview = async () => {
      try {
        const nextReviewState = await buildReviewState(
          state.route.data as ZapRouteDetail,
          feedback.modal.warnings,
          state.slippage.value,
        )
        if (cancelled) return

        setPreviewError(null)
        setReviewState(nextReviewState)
      } catch (error) {
        if (cancelled) return

        setPreviewError(error instanceof Error ? error.message : 'Failed to build zap transaction')
      } finally {
        if (cancelled) return

        setIsRefreshingReview(false)
        refreshSourceRouteRef.current = null
      }
    }

    void rebuildReview()

    return () => {
      cancelled = true
    }
  }, [
    buildReviewState,
    feedback.modal.warnings,
    isRefreshingReview,
    reviewState,
    state.route.data,
    state.route.error,
    state.route.loading,
    state.slippage.value,
  ])

  const submitApprovalTx = useCallback(
    async (txData: AddLiquiditySubmitTxData, additionalInfo?: ApprovalAdditionalInfo) => {
      if (!library) throw new Error('Wallet is not connected')

      const { txHash, error } = await submitTransaction({ library, txData })
      if (!txHash || error) throw new Error(error?.message || 'Transaction failed')

      addTrackedTxHash(txHash)
      addTransactionWithType({
        hash: txHash,
        type: TRANSACTION_TYPE.APPROVE,
        extraInfo: {
          tokenAddress: additionalInfo?.tokenAddress || '',
          summary:
            additionalInfo?.type === 'erc20_approval'
              ? additionalInfo.tokenSymbol
              : additionalInfo?.dexName || EARN_DEXES[exchange].name,
        },
      })

      return txHash
    },
    [addTrackedTxHash, addTransactionWithType, exchange, library],
  )

  const runtimeValue = useMemo<AddLiquidityRuntimeContextValue>(
    () => ({
      buildRouteLoading: buildRouteState.isLoading,
      txStatusMap: txStatus,
      txHashMapping: originalToCurrentHash,
      submitApprovalTx,
    }),
    [buildRouteState.isLoading, originalToCurrentHash, submitApprovalTx, txStatus],
  )

  const tracking = useMemo<AddLiquidityTracking>(
    () => ({
      addTrackedTxHash,
      addTransactionWithType,
    }),
    [addTrackedTxHash, addTransactionWithType],
  )

  const handleTrackEvent = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      const trackingType = TRACKING_EVENT_MAP[eventName]
      if (trackingType !== undefined) trackingHandler(trackingType, data)
    },
    [trackingHandler],
  )

  const handlePreview = useCallback(async () => {
    if (!state.route.data) return

    setPreviewError(null)

    try {
      const nextReviewState = await buildReviewState(state.route.data, feedback.modal.warnings, state.slippage.value)
      handleTrackEvent('LIQ_PREVIEW_CLICKED', {
        pool_pair: `${normalizedPool.data?.token0.symbol}/${normalizedPool.data?.token1.symbol}`,
        pool_protocol: EARN_DEXES[exchange]?.name,
        pool_fee_tier: normalizedPool.data ? `${normalizedPool.data.fee}%` : '',
        is_existing_position: false,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })
      setReviewState(nextReviewState)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build zap transaction'
      setPreviewError(message)
    }
  }, [
    buildReviewState,
    chainId,
    exchange,
    feedback.modal.warnings,
    handleTrackEvent,
    normalizedPool.data,
    state.route.data,
    state.slippage.value,
  ])

  const handleUseSuggestedSlippage = useCallback(
    (suggestedSlippage?: number) => {
      if (
        suggestedSlippage === undefined ||
        suggestedSlippage === reviewState?.slippage ||
        isRefreshingReview ||
        !reviewState
      ) {
        return
      }

      refreshSourceRouteRef.current = reviewState.route
      setPreviewError(null)
      setIsRefreshingReview(true)
      state.slippage.setValue(suggestedSlippage)
    },
    [isRefreshingReview, reviewState, state.slippage],
  )

  const handleDismissReview = useCallback(() => {
    refreshSourceRouteRef.current = null
    setIsRefreshingReview(false)
    setReviewState(null)
  }, [])

  const handleOpenZapMigration = useCallback(
    (
      position: { exchange: string; poolId: string; positionId: string | number },
      initialTick?: { tickUpper: number; tickLower: number },
      initialSlippage?: number,
    ) => {
      openZapMigrationWidget({
        from: {
          poolType: position.exchange as Exchange,
          poolAddress: position.poolId,
          positionId: position.positionId.toString(),
          dexId: position.exchange as Exchange,
        },
        to: {
          poolType: exchange,
          poolAddress,
          dexId: exchange,
        },
        chainId,
        initialTick,
        initialSlippage,
      })
    },
    [chainId, exchange, openZapMigrationWidget, poolAddress],
  )

  return (
    <AddLiquidityRuntimeProvider value={runtimeValue}>
      {!normalizedPool.data ? (
        <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
          <Stack flex="1 1 480px" maxWidth="480px" minWidth={0} gap={16}>
            <AddLiquidityWidgetSkeleton />
          </Stack>

          <Stack flex="1 1 480px" gap={24} minWidth={0}>
            <AddLiquidityRoutePreview
              inputTokens={state.tokenInput.tokens}
              inputAmounts={state.tokenInput.amounts}
              pool={null}
              zapRoute={state.route.data}
            />
            {children}
          </Stack>
        </HStack>
      ) : (
        <AddLiquidityBody
          chainId={chainId}
          feedback={feedback}
          isRefreshingReview={isRefreshingReview}
          onOpenZapMigration={handleOpenZapMigration}
          onTrackEvent={handleTrackEvent}
          onDismissReview={handleDismissReview}
          onPreview={handlePreview}
          previewError={previewError}
          reviewState={reviewState}
          onUseSuggestedSlippage={handleUseSuggestedSlippage}
          normalizedPool={normalizedPool.data}
          state={state}
          tracking={tracking}
        >
          {children}
        </AddLiquidityBody>
      )}
      {zapMigrationWidget}
    </AddLiquidityRuntimeProvider>
  )
}

export default AddLiquidity
