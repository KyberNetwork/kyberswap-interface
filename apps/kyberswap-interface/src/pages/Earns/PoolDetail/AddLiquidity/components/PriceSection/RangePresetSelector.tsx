import { DEXES_INFO, NETWORKS_INFO, POOL_CATEGORY, Pool, PoolType, univ3PoolNormalize } from '@kyber/schema'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/uniswapv3'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import useTheme from 'hooks/useTheme'

const FULL_PRICE_RANGE = 'Full Range'

const DEFAULT_PRICE_RANGE = {
  [POOL_CATEGORY.STABLE_PAIR]: 0.0005,
  [POOL_CATEGORY.CORRELATED_PAIR]: 0.001,
  [POOL_CATEGORY.COMMON_PAIR]: 0.1,
  [POOL_CATEGORY.EXOTIC_PAIR]: 0.3,
}

const PRICE_RANGE = {
  [POOL_CATEGORY.STABLE_PAIR]: [FULL_PRICE_RANGE, 0.01, 0.001, 0.0005],
  [POOL_CATEGORY.CORRELATED_PAIR]: [FULL_PRICE_RANGE, 0.05, 0.01, 0.001],
  [POOL_CATEGORY.COMMON_PAIR]: [FULL_PRICE_RANGE, 0.2, 0.1, 0.05],
  [POOL_CATEGORY.EXOTIC_PAIR]: [FULL_PRICE_RANGE, 0.5, 0.3, 0.2],
}

const RangeButton = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  background: ${({ theme, $active }) => ($active ? theme.tabActive : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;

  :hover {
    background: ${({ theme, $active }) => ($active ? rgba(theme.tabActive, 0.8) : theme.buttonGray)};
  }
`

interface RangeOption {
  range: number | string
  tickLower: number
  tickUpper: number
}

interface RangePresetSelectorProps {
  chainId: number
  poolType: PoolType
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  tickLower: number | null
  tickUpper: number | null
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

const RangePresetSelector = ({
  chainId,
  poolType,
  pool,
  poolPrice,
  revertPrice,
  tickLower,
  tickUpper,
  onTrackEvent,
  onTickLowerChange,
  onTickUpperChange,
}: RangePresetSelectorProps) => {
  const theme = useTheme()
  const [lastSelected, setLastSelected] = useState<number | string>('')
  const previousRevertPrice = useRef(revertPrice)
  const previousRangeSelected = useRef<number | string | undefined>()

  const priceRanges = useMemo(() => {
    if (!poolPrice || !pool.category) return []

    const priceOptions =
      PRICE_RANGE[pool.category as keyof typeof PRICE_RANGE] || PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR]
    const { success, data } = univ3PoolNormalize.safeParse(pool)

    if (!success || !priceOptions.length) return []

    return priceOptions
      .map(item => {
        if (item === FULL_PRICE_RANGE) {
          return {
            range: item,
            tickLower: data.minTick,
            tickUpper: data.maxTick,
          }
        }

        const left = poolPrice * (1 - Number(item))
        const right = poolPrice * (1 + Number(item))
        const lower = priceToClosestTick(
          !revertPrice ? `${left}` : `${right}`,
          pool.token0.decimals,
          pool.token1.decimals,
          revertPrice,
        )
        const upper = priceToClosestTick(
          !revertPrice ? `${right}` : `${left}`,
          pool.token0.decimals,
          pool.token1.decimals,
          revertPrice,
        )

        if (lower === undefined || upper === undefined) return null

        const nearestLowerTick = nearestUsableTick(lower, data.tickSpacing)
        const nearestUpperTick = nearestUsableTick(upper, data.tickSpacing)

        let validLowerTick = nearestLowerTick
        let validUpperTick = nearestUpperTick

        if (nearestLowerTick === nearestUpperTick) {
          const lowerPriceFromTick = tickToPrice(
            nearestLowerTick,
            pool.token0.decimals,
            pool.token1.decimals,
            revertPrice,
          )

          if (Number(lowerPriceFromTick) > poolPrice) {
            validLowerTick -= data.tickSpacing
          } else {
            validUpperTick += data.tickSpacing
          }
        }

        return {
          range: item,
          tickLower: validLowerTick < MIN_TICK ? MIN_TICK : validLowerTick,
          tickUpper: validUpperTick > MAX_TICK ? MAX_TICK : validUpperTick,
        }
      })
      .filter(Boolean) as RangeOption[]
  }, [pool, poolPrice, revertPrice])

  const rangeSelected = useMemo(() => {
    const matches = priceRanges.filter(item => item.tickLower === tickLower && item.tickUpper === tickUpper)
    if (matches.length === 1) return matches[0].range
    if (matches.length > 1 && lastSelected && matches.find(item => item.range === lastSelected)) return lastSelected
    return undefined
  }, [lastSelected, priceRanges, tickLower, tickUpper])

  const handleSelectPriceRange = useCallback(
    (range: string | number, isUserAction = false) => {
      const priceRange = priceRanges.find(item => item.range === range)
      if (!priceRange) return

      setLastSelected(range)
      onTickLowerChange?.(priceRange.tickLower)
      onTickUpperChange?.(priceRange.tickUpper)

      if (isUserAction) {
        const dexNameObj = DEXES_INFO[poolType]?.name
        const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]

        onTrackEvent?.('PRICE_RANGE_PRESET_SELECTED', {
          preset: range === FULL_PRICE_RANGE ? 'full_range' : `${Number(range) * 100}%`,
          pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
          pool_protocol: dexName,
          pool_fee_tier: `${pool.fee}%`,
          chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
        })
      }
    },
    [
      chainId,
      onTickLowerChange,
      onTickUpperChange,
      onTrackEvent,
      pool.fee,
      pool.token0.symbol,
      pool.token1.symbol,
      poolType,
      priceRanges,
    ],
  )

  useEffect(() => {
    if (
      revertPrice !== previousRevertPrice.current &&
      rangeSelected !== previousRangeSelected.current &&
      previousRangeSelected.current
    ) {
      handleSelectPriceRange(previousRangeSelected.current)
    }

    previousRevertPrice.current = revertPrice
    previousRangeSelected.current = rangeSelected
  }, [handleSelectPriceRange, rangeSelected, revertPrice])

  useEffect(() => {
    if (!pool.category || !priceRanges.length) return
    if (tickLower === null || tickUpper === null) {
      handleSelectPriceRange(
        DEFAULT_PRICE_RANGE[pool.category as keyof typeof DEFAULT_PRICE_RANGE] ||
          DEFAULT_PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR],
      )
    }
  }, [handleSelectPriceRange, pool.category, priceRanges, tickLower, tickUpper])

  if (!priceRanges.length) return null

  return (
    <HStack border={`1px solid ${theme.border}`} borderRadius={20} gap={0}>
      {priceRanges.map(item => (
        <RangeButton
          $active={rangeSelected === item.range}
          key={`${item.range}`}
          onClick={() => handleSelectPriceRange(item.range, true)}
        >
          {item.range === FULL_PRICE_RANGE ? 'Full Range' : `${Number(item.range) * 100}%`}
        </RangeButton>
      ))}
    </HStack>
  )
}

export default RangePresetSelector
