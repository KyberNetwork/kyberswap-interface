import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType } from '@kyber/schema'
import { rgba } from 'polished'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { HStack } from 'components/Stack'
import useTheme from 'hooks/useTheme'

import { FULL_PRICE_RANGE, getDefaultRangePreset, getRangePresetOptions } from './utils'

const RangeButton = styled.button<{ $active: boolean }>`
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 8px 8px 12px;
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
