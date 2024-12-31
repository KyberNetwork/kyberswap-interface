import { useEffect, useMemo, useRef } from 'react'
import { PoolDetail } from 'services/poolService'

import { ChartEntry, PRICE_FIXED_DIGITS, TickProcessed } from './types'
import { tickToPrice } from './uniswapv3'
import { computeSurroundingTicks } from './utils'

export const useDensityChartData = ({ pool, revertPrice }: { pool: PoolDetail | undefined; revertPrice: boolean }) => {
  const ticksProcessed = usePoolActiveLiquidity({
    pool,
    revertPrice,
  })

  const chartData = useMemo(() => {
    if (!ticksProcessed.length) {
      return undefined
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < ticksProcessed.length; i++) {
      const t = ticksProcessed[i]

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }, [ticksProcessed])

  return chartData
}

export const usePoolActiveLiquidity = ({
  pool,
  revertPrice,
}: {
  pool: PoolDetail | undefined
  revertPrice: boolean
}) => {
  const isPoolAvailable = !!pool && Object.keys(pool).length > 0
  const tickCurrent = isPoolAvailable ? pool.positionInfo.tick : undefined
  const tickSpacing = isPoolAvailable ? pool.positionInfo.tickSpacing : undefined

  return useMemo(() => {
    if (!isPoolAvailable || (!tickCurrent && tickCurrent !== 0) || !tickSpacing) return []

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing
    const ticks = pool.positionInfo.ticks || []

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot = ticks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1

    if (pivot < 0) {
      // consider setting a local error
      // TickData pivot not found
      return []
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: BigInt(pool.positionInfo.liquidity),
      tick: activeTick,
      liquidityNet: Number(ticks[pivot].index) === activeTick ? BigInt(ticks[pivot].liquidityNet) : 0n,
      price0: Number(tickToPrice(activeTick, pool.tokens[0].decimals, pool.tokens[1].decimals, revertPrice)).toFixed(
        PRICE_FIXED_DIGITS,
      ),
    }

    const subsequentTicks = computeSurroundingTicks(
      pool.tokens[revertPrice ? 1 : 0].decimals,
      pool.tokens[revertPrice ? 0 : 1].decimals,
      activeTickProcessed,
      ticks,
      pivot,
      true,
    )
    const previousTicks = computeSurroundingTicks(
      pool.tokens[revertPrice ? 1 : 0].decimals,
      pool.tokens[revertPrice ? 0 : 1].decimals,
      activeTickProcessed,
      ticks,
      pivot,
      false,
    )
    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks)

    return ticksProcessed
  }, [pool, revertPrice, tickCurrent, tickSpacing, isPoolAvailable])
}

export const usePreviousValue = <TValue>(value?: TValue): TValue | undefined => {
  const prevValue = useRef<TValue>()

  useEffect(() => {
    prevValue.current = value

    return () => {
      prevValue.current = undefined
    }
  })

  return prevValue.current
}
