import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, univ3PoolNormalize } from '@kyber/schema'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3'
import { rgba } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatDisplayNumber } from 'utils/numbers'

export enum PriceInputType {
  MinPrice = 'MinPrice',
  MaxPrice = 'MaxPrice',
}

type BoundaryState = 'normal' | 'zero' | 'infinity'

const StepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.12);
  }
`

const Input = styled.input`
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  outline: none;
  text-align: center;
`

const formatDelta = (value: number, poolPrice: number) => {
  if (!Number.isFinite(value) || !poolPrice) return '--'

  const delta = ((value - poolPrice) / poolPrice) * 100
  const digits = Math.abs(delta) < 1 ? 2 : 1
  const formatted = formatDisplayNumber(Math.abs(delta) / 100, {
    style: 'percent',
    significantDigits: digits + 1,
  })

  if (delta === 0) return '0%'
  return `${delta > 0 ? '+' : '-'}${formatted}`
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

interface PriceInputProps {
  type: PriceInputType
  chainId: number
  poolType: PoolType
  pool: Pool
  poolPrice: number | null
  revertPrice: boolean
  tickLower: number | null
  tickUpper: number | null
  minPrice: string | null
  maxPrice: string | null
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

const PriceInput = ({
  type,
  chainId,
  poolType,
  pool,
  poolPrice,
  revertPrice,
  tickLower,
  tickUpper,
  minPrice,
  maxPrice,
  onTrackEvent,
  onTickLowerChange,
  onTickUpperChange,
}: PriceInputProps) => {
  const theme = useTheme()
  const [localValue, setLocalValue] = useState('')

  const normalizedPool = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(pool)
    return success ? data : null
  }, [pool])

  const isMinTick = normalizedPool && tickLower === normalizedPool.minTick
  const isMaxTick = normalizedPool && tickUpper === normalizedPool.maxTick

  const editsLowerTick =
    (type === PriceInputType.MinPrice && !revertPrice) || (type === PriceInputType.MaxPrice && revertPrice)
  const activeTick = editsLowerTick ? tickLower : tickUpper
  const oppositeTick = editsLowerTick ? tickUpper : tickLower
  const minAllowedTick = normalizedPool
    ? editsLowerTick
      ? normalizedPool.minTick
      : tickLower !== null
      ? tickLower + normalizedPool.tickSpacing
      : normalizedPool.minTick
    : null
  const maxAllowedTick = normalizedPool
    ? editsLowerTick
      ? tickUpper !== null
        ? tickUpper - normalizedPool.tickSpacing
        : normalizedPool.maxTick
      : normalizedPool.maxTick
    : null

  const rangeAtZeroBoundary = !revertPrice ? isMinTick : isMaxTick
  const rangeAtInfinityBoundary = !revertPrice ? isMaxTick : isMinTick
  const isFullRange = !!(rangeAtZeroBoundary && rangeAtInfinityBoundary)
  const targetPrice = type === PriceInputType.MinPrice ? minPrice : maxPrice

  const boundaryState = useMemo<BoundaryState>(() => {
    if (type === PriceInputType.MinPrice && rangeAtZeroBoundary) return 'zero'
    if (type === PriceInputType.MaxPrice && rangeAtInfinityBoundary) return 'infinity'
    return 'normal'
  }, [rangeAtInfinityBoundary, rangeAtZeroBoundary, type])

  const currentDisplayValue = boundaryState === 'zero' ? '0' : boundaryState === 'infinity' ? '∞' : targetPrice || ''
  const isZeroBoundary = boundaryState === 'zero'
  const isInfiniteValue = boundaryState === 'infinity'

  const applyTick = (nextTick: number) => {
    if (!normalizedPool || minAllowedTick === null || maxAllowedTick === null) return
    if (minAllowedTick > maxAllowedTick) return

    const clampedTick = clamp(nextTick, minAllowedTick, maxAllowedTick)
    if (editsLowerTick) {
      if (oppositeTick !== null && clampedTick >= oppositeTick) return
      onTickLowerChange?.(clampedTick)
      return
    }

    if (oppositeTick !== null && clampedTick <= oppositeTick) return
    onTickUpperChange?.(clampedTick)
  }

  const increaseTickLower = () => {
    if (!normalizedPool || tickLower === null) return
    const nextTick = tickLower + normalizedPool.tickSpacing
    if (nextTick <= MAX_TICK) onTickLowerChange?.(nextTick)
  }

  const increaseTickUpper = () => {
    if (!normalizedPool || tickUpper === null) return
    const nextTick = tickUpper + normalizedPool.tickSpacing
    if (nextTick <= MAX_TICK) onTickUpperChange?.(nextTick)
  }

  const decreaseTickLower = () => {
    if (!normalizedPool || tickLower === null) return
    const nextTick = tickLower - normalizedPool.tickSpacing
    if (nextTick >= MIN_TICK) onTickLowerChange?.(nextTick)
  }

  const decreaseTickUpper = () => {
    if (!normalizedPool || tickUpper === null) return
    const nextTick = tickUpper - normalizedPool.tickSpacing
    if (nextTick >= MIN_TICK) onTickUpperChange?.(nextTick)
  }

  const wrappedCorrectPrice = (value: string) => {
    if (!normalizedPool) return

    const sanitizedValue = value.replace(/,/g, '').trim()
    if (!sanitizedValue || sanitizedValue === '∞') {
      setLocalValue(currentDisplayValue)
      return
    }

    const tick = priceToClosestTick(
      sanitizedValue,
      normalizedPool.token0.decimals,
      normalizedPool.token1.decimals,
      revertPrice,
    )

    if (tick === undefined) {
      setLocalValue(currentDisplayValue)
      return
    }

    const correctedTick =
      tick % normalizedPool.tickSpacing === 0 ? tick : nearestUsableTick(tick, normalizedPool.tickSpacing)
    applyTick(correctedTick)

    const dexNameObj = DEXES_INFO[poolType]?.name
    const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]
    onTrackEvent?.('PRICE_RANGE_ADJUSTED', {
      adjustment_type: type === PriceInputType.MinPrice ? 'min_price' : 'max_price',
      new_value: sanitizedValue,
      min_price: minPrice,
      max_price: maxPrice,
      pool_pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      pool_protocol: dexName,
      pool_fee_tier: `${pool.fee}%`,
      chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
    })
  }

  const handleDecreasePrice = () => {
    if (type === PriceInputType.MinPrice) revertPrice ? increaseTickUpper() : decreaseTickLower()
    else revertPrice ? increaseTickLower() : decreaseTickUpper()
  }

  const handleIncreasePrice = () => {
    if (type === PriceInputType.MinPrice) revertPrice ? decreaseTickUpper() : increaseTickLower()
    else revertPrice ? decreaseTickLower() : increaseTickUpper()
  }

  useEffect(() => {
    if (!normalizedPool) return
    setLocalValue(currentDisplayValue)
  }, [currentDisplayValue, normalizedPool])

  const numericValue = useMemo(() => {
    if (isInfiniteValue) return undefined

    if (!targetPrice) return undefined
    const parsedValue = Number(targetPrice.replace(/,/g, ''))
    return Number.isFinite(parsedValue) ? parsedValue : undefined
  }, [isInfiniteValue, targetPrice])

  const deltaText = useMemo(() => {
    if (isInfiniteValue) return ''
    if (isZeroBoundary) return poolPrice ? '-100%' : '--'
    if (!poolPrice || numericValue === undefined) return '--'
    return formatDelta(numericValue, poolPrice)
  }, [isInfiniteValue, isZeroBoundary, numericValue, poolPrice])

  const canDecrease = useMemo(() => {
    if (!normalizedPool || activeTick === null) return false
    if (isFullRange) return false
    if (type === PriceInputType.MinPrice) return !isZeroBoundary
    return true
  }, [activeTick, isFullRange, isZeroBoundary, normalizedPool, type])

  const canIncrease = useMemo(() => {
    if (!normalizedPool || activeTick === null) return false
    if (isFullRange) return false
    if (type === PriceInputType.MaxPrice) return !isInfiniteValue
    return true
  }, [activeTick, isFullRange, isInfiniteValue, normalizedPool, type])

  return (
    <HStack align="stretch" width="100%" minWidth={0} borderRadius={12} background={rgba(theme.buttonGray, 0.8)}>
      <HStack align="center" justify="center" borderRadius="12px 0px 0px 12px" background={theme.tabActive} p="4px 8px">
        <Text color={theme.subText} fontSize={12} fontWeight={500}>
          {type === PriceInputType.MinPrice ? 'MIN' : 'MAX'}
        </Text>
      </HStack>

      <HStack flex={1} align="center" gap={8} p="4px 8px">
        <StepButton type="button" disabled={!canDecrease} onClick={handleDecreasePrice}>
          -
        </StepButton>

        <Stack flex={1} minWidth={0} align="center">
          {!normalizedPool ? (
            <Text fontSize={14} fontWeight={500}>
              0.0
            </Text>
          ) : (
            <Input
              disabled={isFullRange}
              value={localValue}
              onChange={event => {
                const nextValue = event.target.value.replace(/,/g, '')
                if (nextValue === '' || /^\d*\.?\d*$/.test(nextValue)) {
                  setLocalValue(nextValue)
                }
              }}
              onBlur={event => wrappedCorrectPrice(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              maxLength={18}
              spellCheck={false}
            />
          )}
          <Text color={theme.subText} fontSize={12}>
            {deltaText || '\u00A0'}
          </Text>
        </Stack>

        <StepButton type="button" disabled={!canIncrease} onClick={handleIncreasePrice}>
          +
        </StepButton>
      </HStack>
    </HStack>
  )
}

export default PriceInput
