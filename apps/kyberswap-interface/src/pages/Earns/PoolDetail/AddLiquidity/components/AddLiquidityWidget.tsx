import { PoolType, univ3Types } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useNavigate } from 'react-router-dom'
import { useBuildZapInRouteMutation } from 'services/zapInService'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import AddLiquidityWidgetView from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetView'
import useAddLiquidityApproval from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityApproval'
import useAddLiquidityReviewData from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityReviewData'
import useAddLiquiditySecurityWarnings from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquiditySecurityWarnings'
import useAddLiquidityState from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityState'
import useAddLiquidityValidation from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityValidation'
import useAddLiquidityWidgetActions from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityWidgetActions'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { submitTransaction } from 'pages/Earns/utils'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager } from 'state/user/hooks'
import { getCookieValue } from 'utils'

const TRACKING_EVENT_MAP: Record<string, TRACKING_EVENT_TYPE> = {
  LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
  LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
  LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
  LIQ_EXISTING_POSITION_SELECTED: TRACKING_EVENT_TYPE.LIQ_EXISTING_POSITION_SELECTED,
  PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
  PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
  LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
}

interface AddLiquidityWidgetProps {
  exchange?: string
  poolAddress?: string
  chainId?: number
  positionId?: string
  tickLower?: string | null
  tickUpper?: string | null
}

const AddLiquidityWidget = ({
  exchange,
  poolAddress,
  chainId,
  positionId,
  tickLower,
  tickUpper,
}: AddLiquidityWidgetProps) => {
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

  const normalizedExchange = exchange as Exchange | undefined
  const normalizedChainId = chainId as ChainId | undefined
  const { rpc: defaultRpcUrl } = useKyberSwapConfig(normalizedChainId)
  const poolType = normalizedExchange ? (ZAPIN_DEX_MAPPING[normalizedExchange] as unknown as PoolType) : undefined
  const parsedTickLower = tickLower && !Number.isNaN(Number(tickLower)) ? Number(tickLower) : null
  const parsedTickUpper = tickUpper && !Number.isNaN(Number(tickUpper)) ? Number(tickUpper) : null
  const referral = getCookieValue('refCode')

  const state = useAddLiquidityState({
    chainId: normalizedChainId || ChainId.MAINNET,
    poolAddress: poolAddress || '',
    poolType: poolType || PoolType.DEX_UNISWAPV3,
    account: account || undefined,
    positionId,
    initialTick:
      parsedTickLower !== null && parsedTickUpper !== null
        ? { tickLower: parsedTickLower, tickUpper: parsedTickUpper }
        : undefined,
  })

  const handleTrackEvent = (eventName: string, data?: Record<string, any>) => {
    const trackingType = TRACKING_EVENT_MAP[eventName]
    if (trackingType !== undefined) trackingHandler(trackingType, data)
  }
  const { hasPositiveInput, parsedTokensIn, validationError } = useAddLiquidityValidation({
    tokens: state.tokenInput.tokens,
    amounts: state.tokenInput.amounts,
    balances: state.tokenInput.balances,
    isUniV3: state.priceRange.isUniV3,
    tickLower: state.priceRange.tickLower,
    tickUpper: state.priceRange.tickUpper,
  })

  const reviewData = useAddLiquidityReviewData({
    chainId: normalizedChainId,
    exchange: normalizedExchange,
    poolType,
    pool: state.pool.data,
    route: state.route.data,
    tokens: state.tokenInput.tokens,
    amounts: state.tokenInput.amounts,
    prices: state.tokenInput.prices,
    revertPrice: state.priceRange.revertPrice,
    poolPrice: state.priceRange.poolPrice,
    tickLower: state.priceRange.tickLower,
    tickUpper: state.priceRange.tickUpper,
    minPrice: state.priceRange.minPrice,
    maxPrice: state.priceRange.maxPrice,
    slippage: state.slippage.value,
  })
  const securityWarnings = useAddLiquiditySecurityWarnings({
    chainId: normalizedChainId,
    pool: state.pool.data,
  })
  const isZapImpactBlocked =
    !isDegenMode &&
    reviewData?.estimate?.zapImpact !== null &&
    reviewData?.estimate?.zapImpact !== undefined &&
    ['VERY_HIGH', 'INVALID'].includes(reviewData.estimate.zapImpact.level)
  const approval = useAddLiquidityApproval({
    account,
    chainId: normalizedChainId,
    exchange: normalizedExchange,
    positionId,
    tokensIn: state.tokenInput.tokens,
    amountsIn: state.tokenInput.amounts,
    route: state.route.data,
    deadline: deadline ? +deadline.toString() : undefined,
    rpcUrl: defaultRpcUrl,
    txStatus,
    txHashMapping: originalToCurrentHash,
    onSubmitTx: async (txData, additionalInfo) => {
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
              : additionalInfo?.dexName || (normalizedExchange ? EARN_DEXES[normalizedExchange].name : 'Zap Router'),
        },
      })

      return txHash
    },
  })
  const actionState = useAddLiquidityWidgetActions({
    wallet: {
      account,
      chainId: normalizedChainId,
      walletChainId,
      library,
      toggleWalletModal,
      changeNetwork,
    },
    routeState: {
      exchange: normalizedExchange,
      poolAddress,
      positionId,
      deadline: deadline ? +deadline.toString() : undefined,
      referral,
      route: state.route.data,
      routeLoading: state.route.loading,
      pool: state.pool.data,
      buildRouteLoading: buildRouteState.isLoading,
      buildZapInRoute,
    },
    formState: {
      approval,
      hasPositiveInput,
      validationError,
      isZapImpactBlocked,
      parsedTokensIn,
    },
    transactionState: {
      originalToCurrentHash,
      txStatusMap: txStatus,
      clearTracking,
      addTrackedTxHash,
      addTransactionWithType,
    },
    navigate,
  })

  if (!normalizedExchange || !normalizedChainId || !poolAddress || !poolType) {
    return (
      <NoteCard $warning>
        Missing or unsupported pool route params. This page needs `exchange`, `poolChainId`, and `poolAddress`.
      </NoteCard>
    )
  }

  if (state.pool.error) {
    return <NoteCard $warning>{state.pool.error}</NoteCard>
  }

  if (state.pool.loading || !state.pool.data) {
    return <AddLiquidityWidgetSkeleton showPriceRange={Boolean(poolType && univ3Types.includes(poolType as any))} />
  }

  return (
    <AddLiquidityWidgetView
      context={{
        chainId: normalizedChainId,
        exchange: normalizedExchange,
        poolAddress,
        poolType,
        positionId,
        account: account || undefined,
      }}
      state={state}
      reviewData={reviewData}
      initialTick={{
        tickLower: parsedTickLower,
        tickUpper: parsedTickUpper,
      }}
      feedback={{
        validationError,
        securityWarnings,
        isZapImpactBlocked,
      }}
      action={{
        isApprovalLoading: actionState.isApprovalLoading,
        needsApprovalAction: actionState.needsApprovalAction,
        hasPositiveInput,
        primaryActionText: actionState.primaryActionText,
        onPrimaryAction: actionState.handlePrimaryAction,
      }}
      reviewDialog={{
        isOpen: actionState.isReviewOpen,
        confirmDisabled: actionState.confirmDisabled,
        confirmLoading: actionState.confirmLoading,
        txHash: actionState.submittedTxHash,
        txStatus: actionState.modalTxStatus,
        txError: actionState.submitError,
        transactionExplorerUrl:
          actionState.currentTxHash && normalizedChainId
            ? `${NETWORKS_INFO[normalizedChainId]?.etherscanUrl}/tx/${actionState.currentTxHash}`
            : undefined,
        onDismiss: actionState.handleDismissReview,
        onConfirm: actionState.handleSubmit,
        onViewPosition: actionState.modalTxStatus === 'success' ? actionState.handleViewPosition : undefined,
      }}
      onTrackEvent={handleTrackEvent}
      onConnectWallet={toggleWalletModal}
    />
  )
}

export default AddLiquidityWidget
