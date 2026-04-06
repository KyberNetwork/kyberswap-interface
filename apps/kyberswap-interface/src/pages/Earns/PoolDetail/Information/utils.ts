import { formatAprNumber, formatUnits } from '@kyber/utils/number'
import { MAX_TICK, MIN_TICK, getPositionAmounts, nearestUsableTick } from '@kyber/utils/uniswapv3'
import dayjs from 'dayjs'
import { type PoolAnalyticsWindow, type PoolDetail } from 'services/zapEarn'

import { type SegmentedControlOption } from 'components/SegmentedControl'
import { formatDisplayNumber } from 'utils/numbers'

export const CHART_WINDOW_OPTIONS: readonly SegmentedControlOption<PoolAnalyticsWindow>[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

const hasValue = (value?: number | null): value is number =>
  value !== undefined && value !== null && !Number.isNaN(value)

const getCurrentTickRange = (tick: number, tickSpacing: number) => {
  const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
  const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)
  const tickLower = Math.min(Math.max(Math.floor(tick / tickSpacing) * tickSpacing, minTick), maxTick - tickSpacing)

  return {
    tickLower,
    tickUpper: tickLower + tickSpacing,
  }
}

export const getPoolLiquidityUsd = (pool: PoolDetail, tokenPrices: Record<string, number>) => {
  const token0 = pool.tokens[0]
  const token1 = pool.tokens[1]
  const positionInfo = pool.positionInfo

  if (!positionInfo?.liquidity || !positionInfo?.sqrtPriceX96 || !positionInfo?.tickSpacing) {
    return undefined
  }

  const { tickLower, tickUpper } = getCurrentTickRange(positionInfo.tick, positionInfo.tickSpacing)
  const { amount0, amount1 } = getPositionAmounts(
    positionInfo.tick,
    tickLower,
    tickUpper,
    BigInt(positionInfo.sqrtPriceX96),
    BigInt(positionInfo.liquidity),
  )

  const token0Amount = parseFloat(formatUnits(amount0.toString(), token0.decimals))
  const token1Amount = parseFloat(formatUnits(amount1.toString(), token1.decimals))
  const token0Price = tokenPrices[token0.address] || 0
  const token1Price = tokenPrices[token1.address] || 0

  const liquidityUsd = token0Amount * token0Price + token1Amount * token1Price

  return hasValue(liquidityUsd) && liquidityUsd > 0 ? liquidityUsd : undefined
}

export const formatUsd = (value?: number) =>
  hasValue(value) ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }) : '--'

export const formatApr = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

export const formatPrice = (value?: number) =>
  hasValue(value)
    ? formatDisplayNumber(value, {
        significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
      })
    : '--'

export const formatSignedPercent = (value?: number) =>
  hasValue(value)
    ? `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatDisplayNumber(Math.abs(value), { significantDigits: 4 })}%`
    : '--'

export const formatCompactUsd = (value?: number) => {
  if (!hasValue(value)) return '--'
  return formatDisplayNumber(value, {
    allowDisplayNegative: true,
    significantDigits: 4,
    style: 'currency',
  })
}

export const formatAxisTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '24h') return dayjs.unix(timestamp).format('HH:mm')
  if (window === '7d') return dayjs.unix(timestamp).format('MMM D')
  return dayjs.unix(timestamp).format('MMM D')
}

export const formatTooltipTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '30d') return dayjs.unix(timestamp).format('MMM D, YYYY')
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}
