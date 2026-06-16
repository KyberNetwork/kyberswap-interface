import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import InfoHelper from 'components/InfoHelper'
import { HStack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import {
  FULL_PRICE_RANGE,
  getDefaultRangePreset,
  getRangePresetOptions,
} from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/utils'
import { cn } from 'utils/cn'

interface RangePresetSelectorProps {
  chainId: number
  poolType: PoolType
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  tickLower: number | null
  tickUpper: number | null
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
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
    return getRangePresetOptions({
      pool,
      poolPrice,
      revertPrice,
    })
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

  useLayoutEffect(() => {
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
    if (lastSelected || tickLower === null || tickUpper === null) return

    const matches = priceRanges.filter(item => item.tickLower === tickLower && item.tickUpper === tickUpper)
    if (matches.length <= 1) return

    const defaultRangePreset = getDefaultRangePreset(pool.category)
    const matchedDefaultRange = matches.find(item => item.range === defaultRangePreset) || matches[0]
    if (!matchedDefaultRange) return

    setLastSelected(matchedDefaultRange.range)
  }, [lastSelected, pool.category, priceRanges, tickLower, tickUpper])

  if (!priceRanges.length) return null

  return (
    <HStack className="gap-0 rounded-[20px] border border-solid border-border">
      {priceRanges.map(item => {
        const isActive = rangeSelected === item.range

        return (
          <button
            key={`${item.range}`}
            onClick={() => handleSelectPriceRange(item.range, true)}
            className={cn(
              'min-w-0 flex-1 cursor-pointer rounded-[20px] border-0 py-2 pl-3 pr-2 text-sm',
              isActive
                ? 'bg-tabActive font-medium text-text hover:bg-tabActive-80'
                : 'bg-transparent font-normal text-subText hover:bg-buttonGray',
            )}
          >
            {item.range === FULL_PRICE_RANGE ? (
              <HStack as="span" className="items-center justify-center gap-1">
                Full Range
                <InfoHelper
                  color={isActive ? theme.blue : theme.subText}
                  margin={false}
                  placement="top"
                  size={12}
                  text="Your liquidity is active across the full price range. However, this may result in a lower APR than estimated due to less concentration of liquidity."
                />
              </HStack>
            ) : (
              `${Number(item.range) * 100}%`
            )}
          </button>
        )
      })}
    </HStack>
  )
}

export default RangePresetSelector
