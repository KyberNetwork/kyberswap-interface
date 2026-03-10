import { formatUnits } from '@ethersproject/units'
import { NATIVE_TOKEN_ADDRESS, PoolType, TxStatus, univ3Types } from '@kyber/schema'
import { friendlyError } from '@kyber/utils'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { BuildZapInData, useBuildZapInRouteMutation, useGetHoneypotInfoQuery } from 'services/zapInService'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import PositionApr from 'pages/Earns/PoolDetail/components/PositionApr'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityReviewModal'
import AddLiquidityRouteInsights from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityRouteInsights'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityTokenInput'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityWidgetSkeleton'
import SlippageControl from 'pages/Earns/PoolDetail/components/add-liquidity/SlippageControl'
import PriceSection from 'pages/Earns/PoolDetail/components/price-range/PriceSection'
import useAddLiquidityApproval from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityApproval'
import useAddLiquidityReviewData from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityReviewData'
import useAddLiquidityState from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityState'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import useTransactionReplacement from 'pages/Earns/hooks/useTransactionReplacement'
import { EarnPool } from 'pages/Earns/types'
import { submitTransaction } from 'pages/Earns/utils'
import { navigateToPositionAfterZap } from 'pages/Earns/utils/zap'
import { useKyberSwapConfig, useWalletModalToggle } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useDegenModeManager } from 'state/user/hooks'
import { getCookieValue } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const FormStack = styled(Stack)`
  width: 100%;
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(20, 20, 22, 0.98) 0%, rgba(16, 16, 18, 0.98) 100%);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    border-radius: 18px;
  `}
`

const WidgetTitle = styled(Text)`
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin: 0;
`

const FooterButton = styled.button<{ $primary?: boolean }>`
  flex: 1 1 0;
  height: 44px;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.primary : theme.tabActive)};
  cursor: pointer;
  border-radius: 14px;
  background: ${({ theme, $primary }) => ($primary ? theme.primary : 'transparent')};
  color: ${({ theme, $primary }) => ($primary ? theme.buttonBlack : theme.subText)};
  font-size: 16px;
  font-weight: 500;

  :disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const TRACKING_EVENT_MAP: Record<string, TRACKING_EVENT_TYPE> = {
  LIQ_TOKEN_SELECTED: TRACKING_EVENT_TYPE.LIQ_TOKEN_SELECTED,
  LIQ_MAX_CLICKED: TRACKING_EVENT_TYPE.LIQ_MAX_CLICKED,
  LIQ_HALF_CLICKED: TRACKING_EVENT_TYPE.LIQ_HALF_CLICKED,
  LIQ_EXISTING_POSITION_SELECTED: TRACKING_EVENT_TYPE.LIQ_EXISTING_POSITION_SELECTED,
  PRICE_RANGE_PRESET_SELECTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_PRESET_SELECTED,
  PRICE_RANGE_ADJUSTED: TRACKING_EVENT_TYPE.LIQ_PRICE_RANGE_ADJUSTED,
  LIQ_MAX_SLIPPAGE_CHANGED: TRACKING_EVENT_TYPE.LIQ_MAX_SLIPPAGE_CHANGED,
}

const getDecimalCount = (value: string) => {
  if (!value.includes('.')) return 0
  return value.split('.')[1]?.length || 0
}

interface AddLiquidityWidgetProps {
  exchange?: string
  poolAddress?: string
  chainId?: number
  positionId?: string
  tickLower?: string | null
  tickUpper?: string | null
  earnPool?: EarnPool
}

const AddLiquidityWidget = ({
  exchange,
  poolAddress,
  chainId,
  positionId,
  tickLower,
  tickUpper,
  earnPool,
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
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedTxHash, setSubmittedTxHash] = useState('')
  const [buildData, setBuildData] = useState<BuildZapInData | null>(null)

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

  const hasPositiveInput = useMemo(
    () =>
      state.tokenInput.amounts
        .split(',')
        .some(amount => Number.isFinite(Number(amount.trim())) && Number(amount.trim()) > 0),
    [state.tokenInput.amounts],
  )
  const parsedTokensIn = useMemo(
    () =>
      state.tokenInput.tokens
        .map((token, index) => ({
          token,
          amount: state.tokenInput.amounts.split(',')[index]?.trim() || '',
        }))
        .filter(item => Number.isFinite(Number(item.amount)) && Number(item.amount) > 0)
        .map(item => ({
          symbol: item.token.symbol,
          logoUrl: item.token.logo,
          amount: formatDisplayNumber(item.amount, {
            significantDigits: 6,
          }),
        })),
    [state.tokenInput.amounts, state.tokenInput.tokens],
  )
  const currentTxHash = submittedTxHash ? originalToCurrentHash[submittedTxHash] || submittedTxHash : ''
  const currentTxStatus = submittedTxHash ? txStatus[submittedTxHash] || txStatus[currentTxHash] : undefined
  const modalTxStatus =
    currentTxStatus === TxStatus.SUCCESS
      ? 'success'
      : currentTxStatus === TxStatus.FAILED
      ? 'failed'
      : currentTxStatus === TxStatus.CANCELLED
      ? 'cancelled'
      : ''

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
  const tokensToCheck = useMemo(
    () =>
      state.pool.data
        ? [state.pool.data.token0, state.pool.data.token1].filter(
            token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
          )
        : [],
    [state.pool.data],
  )
  const { data: honeypotInfoMap } = useGetHoneypotInfoQuery(
    {
      chainId: normalizedChainId || ChainId.MAINNET,
      addresses: tokensToCheck.map(token => token.address),
    },
    {
      skip: !normalizedChainId || !tokensToCheck.length,
    },
  )
  const securityWarnings = useMemo(
    () =>
      tokensToCheck.flatMap(token => {
        const info = honeypotInfoMap?.[token.address.toLowerCase()]
        if (!info) return []

        const warnings: string[] = []
        if (info.isHoneypot) {
          warnings.push(
            `Our security checks detected that ${token.symbol} may be a honeypot token (cannot be sold or carries extremely high sell fee). Please research carefully before adding liquidity or trading.`,
          )
        }
        if (info.isFOT) {
          warnings.push(
            `${token.symbol} is a Fee-On-Transfer token with a ${Math.round(
              info.tax * 100,
            )}% transaction fee applied on every transfer. Please beware before triggering trades with this token.`,
          )
        }

        return warnings
      }),
    [honeypotInfoMap, tokensToCheck],
  )
  const validationError = useMemo(() => {
    if (!state.tokenInput.tokens.length) return 'Select token in'
    if (!hasPositiveInput) return 'Enter amount'

    if (state.priceRange.isUniV3) {
      if (state.priceRange.tickLower === null) return 'Enter min price'
      if (state.priceRange.tickUpper === null) return 'Enter max price'
      if (state.priceRange.tickLower >= state.priceRange.tickUpper) return 'Invalid price range'
    }

    try {
      for (let index = 0; index < state.tokenInput.tokens.length; index++) {
        const token = state.tokenInput.tokens[index]
        const amount = state.tokenInput.amounts.split(',')[index]?.trim() || ''
        if (!amount || Number(amount) <= 0) continue

        if (getDecimalCount(amount) > token.decimals) return 'Invalid input amount'

        const balanceKey =
          token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? NATIVE_TOKEN_ADDRESS.toLowerCase()
            : token.address.toLowerCase()
        const balance = formatUnits(state.tokenInput.balances[balanceKey]?.toString() || '0', token.decimals)
        if (Number(amount) > Number(balance)) return 'Insufficient balance'
      }
    } catch {
      return 'Invalid input amount'
    }

    return ''
  }, [
    hasPositiveInput,
    state.priceRange.isUniV3,
    state.priceRange.tickLower,
    state.priceRange.tickUpper,
    state.tokenInput.amounts,
    state.tokenInput.balances,
    state.tokenInput.tokens,
  ])
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
  const isPreviewLoading = state.route.loading || buildRouteState.isLoading
  const isApprovalLoading =
    approval.tokenApprovalLoading ||
    approval.tokenApprovalPending ||
    approval.nftApprovalChecking ||
    approval.nftApprovalPending ||
    approval.permitState === 'signing'
  const needsApprovalAction =
    !!approval.nextTokenToApprove || approval.needsPermitSignature || approval.needsNftApproval

  const primaryActionText = useMemo(() => {
    if (!account) return 'Connect Wallet'
    if (walletChainId !== normalizedChainId && normalizedChainId)
      return `Switch to ${NETWORKS_INFO[normalizedChainId]?.name}`
    if (approval.tokenApprovalPending) return 'Approving...'
    if (approval.nextTokenToApprove) return `Approve ${approval.nextTokenToApprove.symbol}`
    if (approval.permitState === 'signing') return 'Signing...'
    if (approval.needsPermitSignature) return 'Permit NFT'
    if (approval.nftApprovalPending) return 'Approving NFT...'
    if (approval.nftApprovalChecking) return 'Checking NFT Approval...'
    if (approval.needsNftApproval) return 'Approve NFT'
    if (isPreviewLoading) return 'Building...'
    return 'Preview'
  }, [
    account,
    approval.needsNftApproval,
    approval.needsPermitSignature,
    approval.nextTokenToApprove,
    approval.nftApprovalChecking,
    approval.nftApprovalPending,
    approval.permitState,
    approval.tokenApprovalPending,
    isPreviewLoading,
    normalizedChainId,
    walletChainId,
  ])

  const buildPreview = async () => {
    if (!account || !normalizedChainId || !state.route.data || !deadline) return

    setSubmitError(null)
    setSubmittedTxHash('')
    clearTracking()
    setIsReviewOpen(true)

    try {
      const builtRoute = await buildZapInRoute({
        chainId: normalizedChainId,
        sender: account,
        recipient: account,
        route: state.route.data.route,
        deadline: +deadline.toString(),
        permits:
          approval.permitData?.permitData && positionId
            ? {
                [positionId]: approval.permitData.permitData,
              }
            : undefined,
        source: 'kyberswap-earn',
        referral,
      }).unwrap()

      setBuildData(builtRoute)
    } catch (error) {
      setBuildData(null)
      setSubmitError(friendlyError(error as Error) || (error as Error)?.message || 'Failed to build zap transaction')
    }
  }

  const runPrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!hasPositiveInput || validationError || !state.route.data || state.route.loading || !normalizedChainId) return

    if (approval.nextTokenToApprove) {
      await approval.approveToken(approval.nextTokenToApprove.address)
      return
    }

    if (approval.needsPermitSignature) {
      await approval.signPermit()
      return
    }

    if (approval.needsNftApproval) {
      await approval.approveNft()
      return
    }

    if (isZapImpactBlocked) return

    await buildPreview()
  }

  const handlePrimaryAction = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!normalizedChainId) return

    if (walletChainId !== normalizedChainId) {
      await changeNetwork(
        normalizedChainId,
        () => {
          void runPrimaryAction()
        },
        undefined,
        true,
      )
      return
    }

    await runPrimaryAction()
  }

  const handleDismissReview = () => {
    setIsReviewOpen(false)
    setIsSubmitting(false)
    setSubmitError(null)
    setSubmittedTxHash('')
    setBuildData(null)
    clearTracking()
  }

  const handleSubmit = async () => {
    if (!account) {
      toggleWalletModal()
      return
    }
    if (!normalizedExchange || !normalizedChainId || !poolAddress || !state.route.data || !state.pool.data || !library)
      return

    setSubmitError(null)

    if (walletChainId !== normalizedChainId) {
      await changeNetwork(normalizedChainId, undefined, undefined, true)
      return
    }

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
          pool: `${state.pool.data.token0.symbol}/${state.pool.data.token1.symbol}`,
          tokensIn: parsedTokensIn,
          dexLogoUrl: EARN_DEXES[normalizedExchange].logo,
          dex: normalizedExchange,
        },
      })
    } catch (error) {
      setSubmitError(
        friendlyError(error as Error) || (error as Error)?.message || 'Failed to build or submit zap transaction',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewPosition = async () => {
    if (!library || !currentTxHash || !normalizedExchange || !poolAddress || !normalizedChainId) return
    await navigateToPositionAfterZap(
      library,
      currentTxHash,
      normalizedChainId,
      normalizedExchange,
      poolAddress,
      navigate,
    )
    handleDismissReview()
  }

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
    <FormStack gap={16}>
      <Stack gap={20}>
        <HStack align="center" justify="space-between">
          <WidgetTitle>ADD LIQUIDITY</WidgetTitle>
          <AddLiquiditySettings />
        </HStack>

        <AddLiquidityTokenInput
          context={{
            chainId: normalizedChainId,
            poolAddress,
            poolType,
            positionId,
            pool: state.pool.data,
          }}
          wallet={{
            address: account || undefined,
            onConnect: toggleWalletModal,
          }}
          value={{
            tokens: state.tokenInput.tokens,
            amounts: state.tokenInput.amounts,
            balances: state.tokenInput.balances,
            prices: state.tokenInput.prices,
            slippage: state.slippage.value,
            tickLower: state.priceRange.tickLower,
            tickUpper: state.priceRange.tickUpper,
          }}
          onTrackEvent={handleTrackEvent}
          onTokensChange={state.tokenInput.setTokens}
          onAmountsChange={state.tokenInput.setAmounts}
        />
      </Stack>

      {state.priceRange.isUniV3 && (
        <>
          <PriceSection
            context={{
              chainId: normalizedChainId,
              poolType,
              pool: state.pool.data,
            }}
            value={{
              poolPrice: state.priceRange.poolPrice,
              revertPrice: state.priceRange.revertPrice,
              minPrice: state.priceRange.minPrice,
              maxPrice: state.priceRange.maxPrice,
              tickLower: state.priceRange.tickLower,
              tickUpper: state.priceRange.tickUpper,
              hasInitialTick: parsedTickLower !== null && parsedTickUpper !== null,
            }}
            onTrackEvent={handleTrackEvent}
            onRevertPriceToggle={state.priceRange.toggleRevertPrice}
            onTickLowerChange={state.priceRange.setTickLower}
            onTickUpperChange={state.priceRange.setTickUpper}
          />

          <PositionApr
            chainId={normalizedChainId}
            poolAddress={poolAddress}
            pool={earnPool}
            isFarming={state.pool.data.isFarming}
            tickLower={state.priceRange.tickLower}
            tickUpper={state.priceRange.tickUpper}
            hasInput={state.positionApr.hasInput}
            positionLiquidity={state.positionApr.positionLiquidity}
            positionTvl={state.positionApr.positionTvl}
          />
        </>
      )}

      {validationError ? <NoteCard $warning>{validationError}</NoteCard> : null}
      {securityWarnings.map(message => (
        <NoteCard key={message} $warning>
          {message}
        </NoteCard>
      ))}
      {!validationError && state.route.error ? <NoteCard $warning>{state.route.error}</NoteCard> : null}

      {!state.route.error ? (
        <AddLiquidityRouteInsights data={reviewData} degenModeBlocked={isZapImpactBlocked} />
      ) : null}

      <Stack gap={8}>
        <SlippageControl
          context={{
            chainId: normalizedChainId,
            poolType,
            pool: state.pool.data,
          }}
          value={{
            slippage: state.slippage.value,
            suggestedSlippage: state.slippage.suggestedValue,
          }}
          onTrackEvent={handleTrackEvent}
          onSlippageChange={state.slippage.setValue}
        />

        <HStack gap={16}>
          <FooterButton type="button">Cancel</FooterButton>
          <FooterButton
            $primary
            disabled={
              !!account &&
              (!hasPositiveInput ||
                !!validationError ||
                !state.route.data ||
                isApprovalLoading ||
                (isZapImpactBlocked && !needsApprovalAction))
            }
            onClick={handlePrimaryAction}
            type="button"
          >
            {primaryActionText}
          </FooterButton>
        </HStack>
      </Stack>

      <AddLiquidityReviewModal
        isOpen={isReviewOpen}
        exchange={normalizedExchange}
        data={reviewData}
        confirmDisabled={buildRouteState.isLoading || isSubmitting || !buildData || isZapImpactBlocked}
        confirmLoading={buildRouteState.isLoading || isSubmitting}
        txHash={submittedTxHash}
        txStatus={modalTxStatus}
        txError={submitError}
        transactionExplorerUrl={
          currentTxHash && normalizedChainId
            ? `${NETWORKS_INFO[normalizedChainId]?.etherscanUrl}/tx/${currentTxHash}`
            : undefined
        }
        onDismiss={handleDismissReview}
        onConfirm={handleSubmit}
        onRevertPriceToggle={state.priceRange.toggleRevertPrice}
        onViewPosition={modalTxStatus === 'success' ? handleViewPosition : undefined}
      />
    </FormStack>
  )
}

export default AddLiquidityWidget
