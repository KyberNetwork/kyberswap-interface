import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, univ3PoolNormalize } from '@kyber/schema'
import { Skeleton } from '@kyber/ui'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import { formatDisplayNumber } from 'utils/numbers'

export enum PriceInputType {
  MinPrice = 'MinPrice',
  MaxPrice = 'MaxPrice',
}

const StepButton = styled.button`
  align-items: center;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  display: flex;
  flex: 0 0 auto;
  height: 24px;
  justify-content: center;
  width: 24px;

  :disabled {
    cursor: not-allowed;
    opacity: 0.8;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
`

const Input = styled.input`
  border: none;
  background: transparent;
  padding: 0;
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
  min-width: 0;
  outline: none;
  text-align: center;
  width: 100%;
`

const Delta = styled.div<{ $positive?: boolean }>`
  color: ${({ theme, $positive }) => ($positive ? theme.primary : theme.subText)};
  font-size: 12px;
  font-weight: 400;
`

const InputShell = styled(HStack)`
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  min-width: 0;
  width: 100%;
`

const TypeBadge = styled(HStack)`
  padding: 4px 8px;
  border-radius: 12px 0px 0px 12px;
  background: ${({ theme }) => theme.tabActive};
`

const TypeText = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
`

const InputValueWrap = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
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
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

export default function PriceInput({
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
}: PriceInputProps) {
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

  const isZeroBoundary = type === PriceInputType.MinPrice && (!revertPrice ? isMinTick : isMaxTick)
  const isInfinityBoundary = type === PriceInputType.MaxPrice && (!revertPrice ? isMaxTick : isMinTick)
  const currentDisplayValue = useMemo(() => {
    if (isZeroBoundary) return '0'
    if (isInfinityBoundary) return '∞'
    if (type === PriceInputType.MinPrice) return minPrice || ''
    return maxPrice || ''
  }, [isInfinityBoundary, isZeroBoundary, maxPrice, minPrice, type])

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

    if (type === PriceInputType.MinPrice && (!revertPrice ? isMinTick : isMaxTick)) {
      setLocalValue('0')
      return
    }

    if (type === PriceInputType.MaxPrice && (!revertPrice ? isMaxTick : isMinTick)) {
      setLocalValue('∞')
      return
    }

    if (type === PriceInputType.MinPrice && minPrice) {
      setLocalValue(minPrice)
    } else if (type === PriceInputType.MaxPrice && maxPrice) {
      setLocalValue(maxPrice)
    }
  }, [currentDisplayValue, isMaxTick, isMinTick, maxPrice, minPrice, normalizedPool, revertPrice, type])

  const numericValue = useMemo(() => {
    if (isInfinityBoundary) return undefined

    const targetValue = type === PriceInputType.MinPrice ? minPrice : maxPrice
    if (!targetValue) return undefined
    const parsedValue = Number(targetValue.replace(/,/g, ''))
    return Number.isFinite(parsedValue) ? parsedValue : undefined
  }, [isInfinityBoundary, maxPrice, minPrice, type])

  const deltaText = useMemo(() => {
    if (isInfinityBoundary) return ''
    if (isZeroBoundary) return poolPrice ? '-100%' : '--'
    if (!poolPrice || numericValue === undefined) return '--'
    return formatDelta(numericValue, poolPrice)
  }, [isInfinityBoundary, isZeroBoundary, numericValue, poolPrice])

  const canDecrease = useMemo(() => {
    if (!normalizedPool || activeTick === null || minAllowedTick === null) return false
    return activeTick - normalizedPool.tickSpacing >= minAllowedTick
  }, [activeTick, minAllowedTick, normalizedPool])

  const canIncrease = useMemo(() => {
    if (!normalizedPool || activeTick === null || maxAllowedTick === null) return false
    return activeTick + normalizedPool.tickSpacing <= maxAllowedTick
  }, [activeTick, maxAllowedTick, normalizedPool])

  return (
    <InputShell align="stretch">
      <TypeBadge justify="center" align="center">
        <TypeText>{type === PriceInputType.MinPrice ? 'MIN' : 'MAX'}</TypeText>
      </TypeBadge>

      <HStack alignItems="center" gap={8} p="4px 8px" flex={1}>
        <StepButton type="button" onClick={handleDecreasePrice} disabled={!canDecrease}>
          -
        </StepButton>

        <InputValueWrap align="center">
          {!normalizedPool ? (
            <Skeleton style={{ width: '120px', height: '24px' }} />
          ) : (
            <Input
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
              maxLength={79}
              spellCheck={false}
            />
          )}
          <Delta $positive={deltaText.startsWith('+')}>{deltaText || '\u00A0'}</Delta>
        </InputValueWrap>

        <StepButton type="button" onClick={handleIncreasePrice} disabled={!canIncrease}>
          +
        </StepButton>
      </HStack>
    </InputShell>
  )
}
