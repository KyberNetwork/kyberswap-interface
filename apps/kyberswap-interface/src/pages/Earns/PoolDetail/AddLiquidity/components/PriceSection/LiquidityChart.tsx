import { Pool, univ3PoolNormalize } from '@kyber/schema'
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3'
import { Bound, LiquidityChartRangeInput, MIN_PRICE } from '@kyberswap/liquidity-chart'
import '@kyberswap/liquidity-chart/style.css'
import { rgba } from 'polished'
import { useCallback, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { toString } from 'utils/numbers'

const parseChartPrice = (value: string | null) => {
  if (!value) return NaN
  return parseFloat(value.replace(/,/g, ''))
}

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`

const Bar = styled.div<{ $height: number }>`
  position: relative;
  flex: 1 1 0;
  min-width: 2px;
  max-width: 8px;
  height: ${({ $height }) => $height}%;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background: ${({ theme }) => theme.tabActive};
  overflow: hidden;
`

const Shimmer = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${rgba(theme.text, 0)} 0%, ${rgba(theme.text, 0.12)} 50%, ${rgba(theme.text, 0)} 100%)`};
  opacity: 0.6;
  animation: ${shimmer} 1.8s linear infinite;
`

const ChartWrapper = styled.div<{ $disableBrush?: boolean }>`
  ${({ $disableBrush }) =>
    $disableBrush
      ? `
      .overlay,
      .selection,
      .handle {
        pointer-events: none;
        cursor: default;
      }`
      : ''}
`

interface LiquidityChartProps {
  pool: Pool
  poolPrice: number | null
  minPrice: string | null
  maxPrice: string | null
  revertPrice: boolean
  tickLower: number | null
  tickUpper: number | null
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

export const LiquidityChartSkeleton = () => {
  const barHeights = [15, 20, 5, 10, 15, 30, 10, 15, 60, 70, 85, 90, 100, 70, 80, 40, 55, 60, 15, 20, 25, 15, 10, 5]

  return (
    <Stack height="224px">
      <HStack align="flex-end" justify="center" width="100%" height="100%" gap={4} p="8px">
        {barHeights.map((height, index) => (
          <Bar $height={height * 0.8} key={index}>
            <Shimmer />
          </Bar>
        ))}
      </HStack>
    </Stack>
  )
}

const LiquidityChart = ({
  pool,
  poolPrice,
  minPrice,
  maxPrice,
  revertPrice,
  tickLower,
  tickUpper,
  onTickLowerChange,
  onTickUpperChange,
}: LiquidityChartProps) => {
  const normalizedPool = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(pool)
    return success ? data : null
  }, [pool])

  const ticksAtLimit = useMemo(
    () => ({
      LOWER: normalizedPool !== null && tickLower !== null && normalizedPool.minTick === tickLower,
      UPPER: normalizedPool !== null && tickUpper !== null && normalizedPool.maxTick === tickUpper,
    }),
    [normalizedPool, tickLower, tickUpper],
  )
  const isFullRange = Boolean(ticksAtLimit.LOWER && ticksAtLimit.UPPER)

  const onBothRangeInput = useCallback(
    (leftValue: string, rightValue: string) => {
      if (!normalizedPool) return

      const tickLowerFromPrice = priceToClosestTick(
        leftValue,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      )
      const tickUpperFromPrice = priceToClosestTick(
        rightValue,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      )

      if (tickLowerFromPrice === undefined || tickUpperFromPrice === undefined) return

      const nextTickLower = nearestUsableTick(Number(tickLowerFromPrice), normalizedPool.tickSpacing)
      const nextTickUpper = nearestUsableTick(Number(tickUpperFromPrice), normalizedPool.tickSpacing)

      if (nextTickUpper !== undefined) {
        revertPrice ? onTickLowerChange?.(nextTickUpper) : onTickUpperChange?.(nextTickUpper)
      }
      if (nextTickLower !== undefined) {
        revertPrice ? onTickUpperChange?.(nextTickLower) : onTickLowerChange?.(nextTickLower)
      }
    },
    [normalizedPool, onTickLowerChange, onTickUpperChange, revertPrice],
  )

  const onLeftRangeInput = useCallback(
    (value: string) => {
      if (!normalizedPool) return

      const tickFromPrice = priceToClosestTick(
        value,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      )

      if (tickFromPrice === undefined) return

      const nextTick = nearestUsableTick(Number(tickFromPrice), normalizedPool.tickSpacing)
      if (nextTick !== undefined) revertPrice ? onTickUpperChange?.(nextTick) : onTickLowerChange?.(nextTick)
    },
    [normalizedPool, onTickLowerChange, onTickUpperChange, revertPrice],
  )

  const onRightRangeInput = useCallback(
    (value: string) => {
      if (!normalizedPool) return

      const tickFromPrice = priceToClosestTick(
        value,
        normalizedPool.token0.decimals,
        normalizedPool.token1.decimals,
        revertPrice,
      )

      if (tickFromPrice === undefined) return

      const nextTick = nearestUsableTick(Number(tickFromPrice), normalizedPool.tickSpacing)
      if (nextTick !== undefined) revertPrice ? onTickLowerChange?.(nextTick) : onTickUpperChange?.(nextTick)
    },
    [normalizedPool, onTickLowerChange, onTickUpperChange, revertPrice],
  )

  const onBrushDomainChange = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      if (!minPrice || !maxPrice) return

      const leftPrice = parseChartPrice(!revertPrice ? minPrice : maxPrice)
      const rightPrice = parseChartPrice(!revertPrice ? maxPrice : minPrice)
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = MIN_PRICE
      }

      const updateLeft =
        (!ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER] || mode === 'reset') &&
        leftRangeValue > 0 &&
        leftRangeValue !== leftPrice

      const updateRight =
        (!ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER] || mode === 'reset') &&
        rightRangeValue > 0 &&
        rightRangeValue < 1e35 &&
        rightRangeValue !== rightPrice

      if (updateLeft && updateRight) {
        const parsedLeftValue = parseFloat(toString(Number(leftRangeValue.toFixed(18))))
        const parsedRightValue = parseFloat(toString(Number(rightRangeValue.toFixed(18))))

        if (parsedLeftValue > 0 && parsedRightValue > 0 && parsedLeftValue < parsedRightValue) {
          onBothRangeInput(leftRangeValue.toFixed(18), rightRangeValue.toFixed(18))
        }
      } else if (updateLeft) {
        onLeftRangeInput(leftRangeValue.toFixed(18))
      } else if (updateRight) {
        onRightRangeInput(rightRangeValue.toFixed(18))
      }
    },
    [maxPrice, minPrice, onBothRangeInput, onLeftRangeInput, onRightRangeInput, revertPrice, ticksAtLimit],
  )

  if (!normalizedPool) return null
  if (poolPrice === null || !minPrice || !maxPrice || tickLower === null || tickUpper === null) {
    return <LiquidityChartSkeleton />
  }

  return (
    <ChartWrapper $disableBrush={isFullRange}>
      <LiquidityChartRangeInput
        id="pool-detail-add-liquidity-chart"
        pool={{
          fee: normalizedPool.fee,
          tickCurrent: normalizedPool.tick,
          tickSpacing: normalizedPool.tickSpacing,
          ticks: normalizedPool.ticks,
          liquidity: normalizedPool.liquidity,
          token0: normalizedPool.token0,
          token1: normalizedPool.token1,
          category: normalizedPool.category,
        }}
        price={{
          current: poolPrice,
          lower: minPrice,
          upper: maxPrice,
        }}
        ticksAtLimit={ticksAtLimit}
        revertPrice={revertPrice}
        onBrushDomainChange={onBrushDomainChange}
        zoomPosition={{
          top: '0px',
          left: undefined,
          right: '0px',
          bottom: undefined,
          gap: '8px',
        }}
      />
    </ChartWrapper>
  )
}

export default LiquidityChart
