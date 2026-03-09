import { PoolType, univ3Types } from '@kyber/schema'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import PositionApr from 'pages/Earns/PoolDetail/components/PositionApr'
import AddLiquidityReviewModal from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityReviewModal'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquiditySettings'
import AddLiquidityTokenInput from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityTokenInput'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/components/add-liquidity/AddLiquidityWidgetSkeleton'
import SlippageControl from 'pages/Earns/PoolDetail/components/add-liquidity/SlippageControl'
import PriceSection from 'pages/Earns/PoolDetail/components/price-range/PriceSection'
import useAddLiquidityReviewData from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityReviewData'
import useAddLiquidityState from 'pages/Earns/PoolDetail/hooks/add-liquidity/useAddLiquidityState'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'
import { EarnPool } from 'pages/Earns/types'
import { useWalletModalToggle } from 'state/application/hooks'

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
  margin: 0;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
`

const FooterButton = styled.button<{ $primary?: boolean }>`
  flex: 1 1 0;
  height: 44px;
  border-radius: 14px;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.primary : theme.tabActive)};
  background: ${({ theme, $primary }) => ($primary ? theme.primary : 'transparent')};
  color: ${({ theme, $primary }) => ($primary ? theme.buttonBlack : theme.subText)};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

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

interface AddLiquidityWidgetProps {
  exchange?: string
  poolAddress?: string
  chainId?: number
  tickLower?: string | null
  tickUpper?: string | null
  earnPool?: EarnPool
}

const AddLiquidityWidget = ({
  exchange,
  poolAddress,
  chainId,
  tickLower,
  tickUpper,
  earnPool,
}: AddLiquidityWidgetProps) => {
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const normalizedExchange = exchange as Exchange | undefined
  const normalizedChainId = chainId as ChainId | undefined
  const poolType = normalizedExchange ? (ZAPIN_DEX_MAPPING[normalizedExchange] as unknown as PoolType) : undefined
  const parsedTickLower = tickLower && !Number.isNaN(Number(tickLower)) ? Number(tickLower) : null
  const parsedTickUpper = tickUpper && !Number.isNaN(Number(tickUpper)) ? Number(tickUpper) : null

  const state = useAddLiquidityState({
    chainId: normalizedChainId || ChainId.MAINNET,
    poolAddress: poolAddress || '',
    poolType: poolType || PoolType.DEX_UNISWAPV3,
    account: account || undefined,
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

  const reviewData = useAddLiquidityReviewData({
    chainId: normalizedChainId,
    exchange: normalizedExchange,
    poolType,
    pool: state.pool.data,
    tokens: state.tokenInput.tokens,
    amounts: state.tokenInput.amounts,
    prices: state.tokenInput.prices,
    revertPrice: state.priceRange.revertPrice,
    poolPrice: state.priceRange.poolPrice,
    minPrice: state.priceRange.minPrice,
    maxPrice: state.priceRange.maxPrice,
    slippage: state.slippage.value,
  })

  const handleOpenReview = () => {
    if (!account) {
      toggleWalletModal()
      return
    }

    if (!hasPositiveInput) return
    setIsReviewOpen(true)
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
          <FooterButton type="button" $primary onClick={handleOpenReview} disabled={!hasPositiveInput && !!account}>
            Preview
          </FooterButton>
        </HStack>
      </Stack>

      <AddLiquidityReviewModal
        isOpen={isReviewOpen}
        exchange={normalizedExchange}
        data={reviewData}
        onDismiss={() => setIsReviewOpen(false)}
        onConfirm={() => setIsReviewOpen(false)}
        onRevertPriceToggle={state.priceRange.toggleRevertPrice}
      />
    </FormStack>
  )
}

export default AddLiquidityWidget
