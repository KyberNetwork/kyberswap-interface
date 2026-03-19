import { type ApprovalAdditionalInfo } from '@kyber/hooks'
import { PoolType, Pool as ZapPool } from '@kyber/schema'
import { translateZapMessage } from '@kyber/ui'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuildZapInRouteMutation } from 'services/zapInService'

import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
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
import { submitTransaction } from 'pages/Earns/utils'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager } from 'state/user/hooks'

type AddLiquidityProps = {
  children?: ReactNode
}

type AddLiquidityBodyProps = AddLiquidityProps & {
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  tracking: AddLiquidityTracking
  normalizedPool: ZapPool
  state: ZapState
}

type AddLiquidityTracking = {
  clearTracking: () => void
  addTrackedTxHash: (hash: string) => void
  addTransactionWithType: (transaction: any) => void
}

const DEFAULT_CHAIN_ID = ChainId.MAINNET

const TRACKING_EVENT_MAP: Record<string, TRACKING_EVENT_TYPE> = {
  LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
  LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
  LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
  PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
  PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
  LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
}

const AddLiquidityBody = ({ children, onTrackEvent, normalizedPool, state, tracking }: AddLiquidityBodyProps) => {
  const navigate = useNavigate()
  const [isDegenMode] = useDegenModeManager()
  const { poolParams } = usePoolDetailContext()
  const { buildRouteLoading } = useAddLiquidityRuntimeContext()
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const chainId = poolParams.poolChainId || DEFAULT_CHAIN_ID
  const poolType = normalizedPool.poolType
  const reviewRoute = state.route.data
  const refetchReviewRoute = state.route.refetch

  const feedback = useFeedback({
    poolChainId: chainId,
    pool: normalizedPool,
    poolType,
    state,
    isDegenMode,
  })

  const handlePreview = useCallback(async () => {
    setIsReviewOpen(true)
  }, [])

  const handleDismissReview = useCallback(() => {
    setIsReviewOpen(false)
    tracking.clearTracking()
  }, [tracking])

  return (
    <>
      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack flex="1 1 480px" maxWidth="480px" minWidth={0} gap={16}>
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
              onPreview: handlePreview,
            }}
            feedback={feedback.widget}
            onTrackEvent={onTrackEvent}
            onCancel={() => navigate(-1)}
          />

          {feedback.page.warnings.length ? (
            <Stack gap={12}>
              {feedback.page.warnings.map((warning, index) => (
                <NoteCard key={`${warning.kind}-${index}`} $tone={warning.tone}>
                  {translateZapMessage(warning.message)}
                </NoteCard>
              ))}
            </Stack>
          ) : null}
        </Stack>

        <Stack flex="1 1 480px" gap={24} minWidth={0}>
          <AddLiquidityRoutePreview
            inputTokens={state.tokenInput.tokens}
            inputAmounts={state.tokenInput.amounts}
            pool={normalizedPool}
            zapRoute={state.route.data}
          />
          {children}
        </Stack>
      </HStack>

      {reviewRoute ? (
        <AddLiquidityReviewModal
          isOpen={isReviewOpen}
          pool={normalizedPool}
          warnings={feedback.modal.warnings}
          route={reviewRoute}
          routeLoading={state.route.loading}
          refetchRoute={refetchReviewRoute}
          chainId={chainId}
          tokenInput={state.tokenInput}
          slippage={state.slippage.value}
          priceRange={state.priceRange}
          confirmText="Add Liquidity"
          onClearTracking={tracking.clearTracking}
          onAddTrackedTxHash={tracking.addTrackedTxHash}
          onAddTransactionWithType={tracking.addTransactionWithType}
          onDismiss={handleDismissReview}
          onUseSuggestedSlippage={suggestedSlippage => {
            if (suggestedSlippage !== undefined) {
              state.slippage.setValue(suggestedSlippage)
            }
          }}
        />
      ) : null}
    </>
  )
}

const AddLiquidity = ({ children }: AddLiquidityProps) => {
  const { pool, poolParams } = usePoolDetailContext()
  const { account } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { trackingHandler } = useTracking()

  const addTransactionWithType = useTransactionAdder()
  const [buildZapInRoute, buildRouteState] = useBuildZapInRouteMutation()
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()

  const exchange = poolParams.exchange as Exchange | undefined
  const chainId = poolParams.poolChainId || DEFAULT_CHAIN_ID
  const poolAddress = poolParams.poolAddress
  const poolType =
    (poolParams.exchange ? (ZAPIN_DEX_MAPPING[poolParams.exchange as Exchange] as unknown as PoolType) : undefined) ||
    PoolType.DEX_UNISWAPV3

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
              : additionalInfo?.dexName || (exchange ? EARN_DEXES[exchange].name : 'Zap Router'),
        },
      })

      return txHash
    },
    [addTrackedTxHash, addTransactionWithType, exchange, library],
  )

  const runtimeValue = useMemo<AddLiquidityRuntimeContextValue>(
    () => ({
      buildRouteLoading: buildRouteState.isLoading,
      buildZapInRoute,
      txStatusMap: txStatus,
      txHashMapping: originalToCurrentHash,
      submitApprovalTx,
    }),
    [buildRouteState.isLoading, buildZapInRoute, originalToCurrentHash, submitApprovalTx, txStatus],
  )

  const tracking = useMemo<AddLiquidityTracking>(
    () => ({
      clearTracking,
      addTrackedTxHash,
      addTransactionWithType,
    }),
    [addTrackedTxHash, addTransactionWithType, clearTracking],
  )

  const handleTrackEvent = useCallback(
    (eventName: string, data?: Record<string, any>) => {
      const trackingType = TRACKING_EVENT_MAP[eventName]
      if (trackingType !== undefined) trackingHandler(trackingType, data)
    },
    [trackingHandler],
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
          onTrackEvent={handleTrackEvent}
          normalizedPool={normalizedPool.data}
          state={state}
          tracking={tracking}
        >
          {children}
        </AddLiquidityBody>
      )}
    </AddLiquidityRuntimeProvider>
  )
}

export default AddLiquidity
