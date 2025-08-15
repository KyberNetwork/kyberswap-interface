import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { Bound, LiquidityChartRangeInput } from '@kyberswap/liquidity-chart'
import '@kyberswap/liquidity-chart/style.css'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { usePoolDetailQuery } from 'services/zapEarn'
import styled, { keyframes } from 'styled-components'

import { ChartWrapper } from 'pages/Earns/PositionDetail/styles'
import { MEDIA_WIDTHS } from 'theme'
import { toString } from 'utils/numbers'

export default function LiquidityChart({
  chainId,
  poolAddress,
  price,
  minPrice,
  maxPrice,
  revertPrice,
}: {
  chainId: number
  poolAddress: string
  price: number
  minPrice: number
  maxPrice: number
  revertPrice: boolean
}) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { data: pool } = usePoolDetailQuery({ chainId, address: poolAddress })
  const isUninitialized = !pool || Object.keys(pool).length === 0

  const fee = isUninitialized ? undefined : pool.swapFee * 10_000
  const tickCurrent = isUninitialized ? undefined : pool.positionInfo.tick
  const tickSpacing = isUninitialized ? undefined : pool.positionInfo.tickSpacing
  const ticks = isUninitialized ? [] : pool.positionInfo.ticks
  const liquidity = isUninitialized ? '0' : pool.positionInfo.liquidity
  const token0 = isUninitialized ? undefined : pool.tokens?.[0]
  const token1 = isUninitialized ? undefined : pool.tokens?.[1]

  const priceLower = !revertPrice ? minPrice : maxPrice === 0 ? 0 : 1 / maxPrice
  const priceUpper = !revertPrice
    ? maxPrice === 0
      ? Number.MAX_SAFE_INTEGER
      : maxPrice
    : minPrice === 0
    ? Number.MAX_SAFE_INTEGER
    : 1 / minPrice

  const ticksAtLimit: { [bound in Bound]?: boolean } | undefined = useMemo(() => {
    if (!tickSpacing || !token0 || !token1) return

    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const parsedMinPrice = toString(Number(minPrice.toFixed(18)))
    const parsedMaxPrice = toString(Number(maxPrice.toFixed(18)))
    const tickLower =
      parsedMinPrice === '0'
        ? minTick
        : priceToClosestTick(parsedMinPrice, token0.decimals, token1.decimals, revertPrice)
    const tickUpper =
      Number(parsedMaxPrice) === Infinity || Number(parsedMaxPrice) === 0
        ? maxTick
        : priceToClosestTick(parsedMaxPrice, token0.decimals, token1.decimals, revertPrice)

    if (tickLower === undefined || tickUpper === undefined) return

    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === undefined || usableTickUpper === undefined) return

    return {
      [Bound.LOWER]: !revertPrice ? usableTickLower === minTick : usableTickUpper === maxTick,
      [Bound.UPPER]: !revertPrice ? usableTickUpper === maxTick : usableTickLower === minTick,
    }
  }, [maxPrice, minPrice, revertPrice, tickSpacing, token0, token1])

  if (!ticksAtLimit) return null

  return (
    <ChartWrapper>
      <LiquidityChartRangeInput
        id="earn-position-detail-liquidity-chart"
        pool={{
          fee,
          tickCurrent,
          tickSpacing,
          ticks,
          liquidity,
          token0,
          token1,
        }}
        price={{ current: price, lower: priceLower.toString(), upper: priceUpper.toString() }}
        ticksAtLimit={ticksAtLimit}
        revertPrice={revertPrice}
        zoomPosition={{
          top: !upToSmall ? '0px' : '-16px',
          left: undefined,
          right: !upToSmall ? '-32px' : '0px',
          bottom: undefined,
          gap: '8px',
        }}
        dimensions={upToSmall ? { width: 400, height: 200 } : { width: 800, height: 400 }}
        margins={upToSmall ? { top: 0, right: 10, bottom: 20, left: 10 } : { top: 20, right: 20, bottom: 40, left: 20 }}
        alwaysShowLabel
        showLabelAsAmount
      />
    </ChartWrapper>
  )
}

export const LiquidityChartSkeleton = () => {
  const BAR_COUNT = 22
  const barHeights = [5, 10, 15, 30, 45, 55, 60, 70, 85, 90, 100, 100, 80, 75, 55, 60, 30, 30, 25, 15, 10, 5]

  return (
    <SkeletonWrapper>
      <BarsContainer>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <Bar key={i} height={barHeights[i]}>
            <Shimmer />
          </Bar>
        ))}
      </BarsContainer>
    </SkeletonWrapper>
  )
}

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

const SkeletonWrapper = styled.div`
  width: 100%;
  height: 300px;
  padding-top: 8px;
  margin-top: 16px;
  position: relative;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 210px;
  `}
`

const BarsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2px;
  height: 100%;
  width: 100%;
  padding: 0 8px 4px 8px;
  z-index: 2;
`

const Bar = styled.div<{ height: number }>`
  flex: 1 1 0;
  min-width: 2px;
  max-width: 8px;
  background: ${({ theme }) => theme.background};
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  height: ${({ height }) => height}%;
`

const Shimmer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.6;
  background: linear-gradient(90deg, transparent 0%, #292929 50%, transparent 100%);
  z-index: 2;
  animation: ${shimmer} 1.8s linear infinite;
`
