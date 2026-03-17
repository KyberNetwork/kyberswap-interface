import { PoolType, TxStatus, univ3Types } from '@kyber/schema'
import { translateZapMessage } from '@kyber/ui'
import { friendlyError } from '@kyber/utils'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BuildZapInData, useBuildZapInRouteMutation } from 'services/zapInService'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityReviewModal'
import AddLiquidityRoutePreview from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityRoutePreview'
import AddLiquidityWidget from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidget'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import {
  AddLiquidityApprovalInfo,
  AddLiquidityRuntimeProvider,
  AddLiquiditySubmitTxData,
  useAddLiquidityRuntimeContext,
} from 'pages/Earns/PoolDetail/AddLiquidity/context'
import useReviewData from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
import useZapPool from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapPool'
import useZapState from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useZapState'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager } from 'state/user/hooks'
import { getCookieValue } from 'utils'

interface AddLiquidityProps {
  children?: ReactNode
}

interface AddLiquidityBodyProps extends AddLiquidityProps {
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  showPriceRangeSkeleton: boolean
}

const TRACKING_EVENT_MAP: Record<string, TRACKING_EVENT_TYPE> = {
  LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
  LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
  LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
  LIQ_EXISTING_POSITION_SELECTED: TRACKING_EVENT_TYPE.LIQ_EXISTING_POSITION_SELECTED,
  PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
  PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
  LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
}

const WarningCard = styled(NoteCard)<{ $tone: 'info' | 'warning' | 'error' }>`
  background: ${({ theme, $tone }) =>
    $tone === 'error' ? `${theme.red}14` : $tone === 'warning' ? `${theme.warning}1f` : `${theme.primary}14`};
  border-color: ${({ theme, $tone }) =>
    $tone === 'error' ? `${theme.red}40` : $tone === 'warning' ? `${theme.warning}40` : `${theme.primary}26`};
`

const getModalTxStatus = (status?: TxStatus): '' | 'success' | 'failed' | 'cancelled' => {
  if (status === TxStatus.SUCCESS) return 'success'
  if (status === TxStatus.FAILED) return 'failed'
  if (status === TxStatus.CANCELLED) return 'cancelled'

  return ''
}

function AddLiquidityBody({ children, onTrackEvent, showPriceRangeSkeleton }: AddLiquidityBodyProps) {
  const { pool } = usePoolDetailContext()
  const {
    account,
    chainId,
    exchange,
    poolAddress,
    poolType,
    positionId,
    isDegenMode,
    library,
    deadline,
    referral,
    navigate,
    buildRouteLoading,
    buildZapInRoute,
    txStatusMap,
    txHashMapping,
    clearTracking,
    addTrackedTxHash,
    addTransactionWithType,
  } = useAddLiquidityRuntimeContext()

  const normalizedPool = useZapPool({
    chainId: chainId || ChainId.MAINNET,
    pool,
    poolType: poolType || PoolType.DEX_UNISWAPV3,
  })

  const state = useZapState({
    chainId: chainId || ChainId.MAINNET,
    pool: normalizedPool.data,
    poolAddress: poolAddress || '',
    poolType: poolType || PoolType.DEX_UNISWAPV3,
    account,
    positionId,
  })

  const review = useReviewData({
    pool: normalizedPool.data,
    route: state.route.data,
    zapState: {
      chainId,
      poolType,
      tokens: state.tokenInput.tokens,
      amounts: state.tokenInput.amounts,
      prices: state.tokenInput.prices,
      slippage: state.slippage.value,
      priceRange: {
        revertPrice: state.priceRange.revertPrice,
        poolPrice: state.priceRange.poolPrice,
        tickLower: state.priceRange.tickLower,
        tickUpper: state.priceRange.tickUpper,
        minPrice: state.priceRange.minPrice,
        maxPrice: state.priceRange.maxPrice,
      },
    },
  })

  const isZapImpactBlocked =
    !isDegenMode &&
    review.estimate?.zapImpact !== null &&
    review.estimate?.zapImpact !== undefined &&
    ['VERY_HIGH', 'INVALID'].includes(review.estimate.zapImpact.level)

  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedTxHash, setSubmittedTxHash] = useState('')
  const [buildData, setBuildData] = useState<BuildZapInData | null>(null)

  const currentTxHash = submittedTxHash ? txHashMapping[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatusMap[submittedTxHash] || txStatusMap[currentTxHash] : undefined
  const modalTxStatus = getModalTxStatus(currentTxStatus)

  const openReview = useCallback(() => {
    setSubmitError(null)
    setSubmittedTxHash('')
    clearTracking()
    setIsReviewOpen(true)
  }, [clearTracking])

  const handlePreview = useCallback(
    async (permitData?: string) => {
      if (!account || !chainId || !state.route.data || !deadline) return

      openReview()

      try {
        const builtRoute = await buildZapInRoute({
          chainId,
          sender: account,
          recipient: account,
          route: state.route.data.route,
          deadline,
          permits: permitData && positionId ? { [positionId]: permitData } : undefined,
          source: 'kyberswap-earn',
          referral,
        }).unwrap()

        setBuildData(builtRoute)
      } catch (error) {
        setBuildData(null)
        setSubmitError(friendlyError(error as Error) || (error as Error)?.message || 'Failed to build zap transaction')
      }
    },
    [account, buildZapInRoute, chainId, deadline, openReview, positionId, referral, state.route.data],
  )

  const handleDismissReview = useCallback(() => {
    setIsReviewOpen(false)
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmittedTxHash('')
    setBuildData(null)
    clearTracking()
  }, [clearTracking])

  const handleSubmit = useCallback(async () => {
    if (!account || !exchange || !chainId || !poolAddress || !state.route.data || !normalizedPool.data || !library)
      return

    setSubmitError(null)

    if (!buildData) {
      setSubmitError('Build route is unavailable.')
      return
    }

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

      setSubmittedTxHash(txHash)
      addTrackedTxHash(txHash)
      addTransactionWithType({
        hash: txHash,
        type: TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
        extraInfo: {
          pool: `${normalizedPool.data.token0.symbol}/${normalizedPool.data.token1.symbol}`,
          tokensIn: state.validation.parsedTokensIn,
          dexLogoUrl: EARN_DEXES[exchange].logo,
          dex: exchange,
        },
      })
    } catch (error) {
      setSubmitError(
        friendlyError(error as Error) || (error as Error)?.message || 'Failed to build or submit zap transaction',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [
    account,
    addTrackedTxHash,
    addTransactionWithType,
    buildData,
    chainId,
    exchange,
    library,
    normalizedPool.data,
    poolAddress,
    state.route.data,
    state.validation.parsedTokensIn,
  ])

  const handleViewPosition = useCallback(async () => {
    if (!library || !currentTxHash || !exchange || !poolAddress || !chainId) return

    await navigateToPositionAfterZap(library, currentTxHash, chainId, exchange, poolAddress, navigate)
    handleDismissReview()
  }, [chainId, currentTxHash, exchange, handleDismissReview, library, navigate, poolAddress])

  const renderWidget = () => {
    if (!exchange || !chainId || !poolAddress || !poolType) {
      return (
        <NoteCard $warning>
          Missing or unsupported pool route params. This page needs `exchange`, `poolChainId`, and `poolAddress`.
        </NoteCard>
      )
    }

    if (normalizedPool.error) {
      return <NoteCard $warning>{normalizedPool.error}</NoteCard>
    }

    if (normalizedPool.loading || !normalizedPool.data) {
      return <AddLiquidityWidgetSkeleton showPriceRange={showPriceRangeSkeleton} />
    }

    return (
      <>
        <AddLiquidityWidget
          context={{
            chainId,
            poolAddress,
            poolType,
            pool: normalizedPool.data,
          }}
          state={state}
          isZapImpactBlocked={isZapImpactBlocked}
          preview={{
            loading: buildRouteLoading,
            onPreview: handlePreview,
          }}
          onTrackEvent={onTrackEvent}
          onCancel={() => navigate(-1)}
        />

        {account && !state.route.error ? (
          <Stack gap={12}>
            {isZapImpactBlocked ? (
              <WarningCard $tone="error">
                To protect against very high zap impact, preview is disabled for this route. Turn on Degen Mode in
                settings if you still want to continue.
              </WarningCard>
            ) : null}

            {review.warnings.map((warning, index) => (
              <WarningCard key={`${warning.tone}-${index}`} $tone={warning.tone}>
                {translateZapMessage(warning.message)}
              </WarningCard>
            ))}
          </Stack>
        ) : null}
      </>
    )
  }

  return (
    <>
      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack flex="1 1 480px" width="100%" maxWidth="480px" minWidth={0} gap={16}>
          {renderWidget()}
        </Stack>
        <Stack flex="1 1 320px" gap={24} minWidth={0}>
          <AddLiquidityRoutePreview chainId={chainId} zapRoute={state.route.data} />
          {children}
        </Stack>
      </HStack>

      <AddLiquidityReviewModal
        isOpen={isReviewOpen}
        review={review}
        confirmDisabled={buildRouteLoading || isSubmitting || !buildData}
        confirmLoading={buildRouteLoading || isSubmitting}
        txHash={submittedTxHash}
        txStatus={modalTxStatus}
        txError={submitError}
        transactionExplorerUrl={
          currentTxHash && chainId ? `${NETWORKS_INFO[chainId]?.etherscanUrl}/tx/${currentTxHash}` : undefined
        }
        onDismiss={handleDismissReview}
        onConfirm={() => {
          void handleSubmit()
        }}
        onUseSuggestedSlippage={() => {
          if (
            review.estimate?.suggestedSlippage !== undefined &&
            review.estimate.slippage !== review.estimate.suggestedSlippage
          ) {
            state.slippage.setValue(review.estimate.suggestedSlippage)
          }
          handleDismissReview()
        }}
        onRevertPriceToggle={state.priceRange.toggleRevertPrice}
        onViewPosition={modalTxStatus === 'success' ? handleViewPosition : undefined}
      />
    </>
  )
}

const AddLiquidity = ({ children }: AddLiquidityProps) => {
  const { poolParams } = usePoolDetailContext()
  const [searchParams] = useSearchParams()

  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()

  const { account } = useActiveWeb3React()
  const { library, chainId: walletChainId } = useWeb3React()

  const { trackingHandler } = useTracking()
  const { changeNetwork } = useChangeNetwork()
  const deadline = useTransactionDeadline()

  const addTransactionWithType = useTransactionAdder()
  const [isDegenMode] = useDegenModeManager()
  const [buildZapInRoute, buildRouteState] = useBuildZapInRouteMutation()
  const { originalToCurrentHash, txStatus, addTrackedTxHash, clearTracking } = useTransactionReplacement()

  const positionId = searchParams.get('positionId') || undefined
  const exchange = poolParams.exchange as Exchange | undefined
  const chainId = poolParams.poolChainId as ChainId | undefined

  const { rpc: rpcUrl } = useKyberSwapConfig(chainId)
  const poolType = exchange ? (ZAPIN_DEX_MAPPING[exchange] as unknown as PoolType) : undefined
  const referral = getCookieValue('refCode')

  const showPriceRangeSkeleton = useMemo(() => Boolean(poolType && univ3Types.includes(poolType as any)), [poolType])

  const submitApprovalTx = useCallback(
    async (txData: AddLiquiditySubmitTxData, additionalInfo?: AddLiquidityApprovalInfo) => {
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

  const runtimeValue = useMemo(
    () => ({
      account: account || undefined,
      chainId,
      walletChainId,
      exchange,
      poolAddress: poolParams.poolAddress || undefined,
      poolType,
      positionId,
      deadline: deadline ? +deadline.toString() : undefined,
      referral,
      rpcUrl,
      isDegenMode,
      library,
      navigate,
      buildRouteLoading: buildRouteState.isLoading,
      buildZapInRoute,
      toggleWalletModal,
      changeNetwork,
      txStatusMap: txStatus,
      txHashMapping: originalToCurrentHash,
      clearTracking,
      addTrackedTxHash,
      addTransactionWithType,
      submitApprovalTx,
    }),
    [
      account,
      addTrackedTxHash,
      addTransactionWithType,
      buildRouteState.isLoading,
      buildZapInRoute,
      changeNetwork,
      clearTracking,
      deadline,
      exchange,
      isDegenMode,
      library,
      navigate,
      originalToCurrentHash,
      poolParams.poolAddress,
      poolType,
      positionId,
      referral,
      rpcUrl,
      submitApprovalTx,
      toggleWalletModal,
      txStatus,
      walletChainId,
      chainId,
    ],
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
      <AddLiquidityBody showPriceRangeSkeleton={showPriceRangeSkeleton} onTrackEvent={handleTrackEvent}>
        {children}
      </AddLiquidityBody>
    </AddLiquidityRuntimeProvider>
  )
}

export default AddLiquidity
