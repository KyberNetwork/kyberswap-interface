import { formatNumberBySignificantDigits } from '@kyber/utils/dist/number'
import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'
import PriceSlider from '@kyberswap/price-slider'
import '@kyberswap/price-slider/style.css'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { calculateExpectedAmounts } from 'pages/Earns/components/SmartExit/Metrics/calculateExpectedAmounts'
import { PriceCustomInput, PriceInputIcon } from 'pages/Earns/components/SmartExit/styles'
import { defaultPriceCondition } from 'pages/Earns/components/SmartExit/utils'
import { getPriceCondition } from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { Metric, PAIR_CATEGORY, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber, toString } from 'utils/numbers'

export default function PriceInput({
  metric,
  setMetric,
  position,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  position: ParsedPosition
}) {
  const theme = useTheme()
  const priceCondition = useMemo(() => getPriceCondition(metric) || defaultPriceCondition, [metric])

  const [tick, setTick] = useState<number>()
  const [inputPrice, setInputPrice] = useState(priceCondition?.lte ?? priceCondition?.gte ?? '')
  const [comparator, setComparator] = useState<'lte' | 'gte'>(priceCondition?.lte ? 'lte' : 'gte')

  // Track change source to prevent circular updates
  const changeSourceRef = useRef<'input' | 'slider' | null>(null)
  const lastSideRef = useRef<'below' | 'above' | null>(null)
  const debounceTickFromInputRef = useRef<NodeJS.Timeout | null>(null)

  const currentTick = useMemo(
    () =>
      nearestUsableTick(
        priceToClosestTick(toString(position.priceRange.current), position.token0.decimals, position.token1.decimals) ||
          0,
        position.pool.tickSpacing,
      ),
    [position.pool.tickSpacing, position.priceRange, position.token0.decimals, position.token1.decimals],
  )

  const priceToTick = useCallback(
    (price: string) => {
      if (!price) return undefined
      return nearestUsableTick(
        priceToClosestTick(price, position.token0.decimals, position.token1.decimals) || 0,
        position.pool.tickSpacing,
      )
    },
    [position.pool.tickSpacing, position.token0.decimals, position.token1.decimals],
  )

  // Sync comparator/input when condition changes externally (not via slider)
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition) {
      const nextComparator = priceCondition.lte ? 'lte' : 'gte'
      setComparator(nextComparator)
      const nextPrice = priceCondition.lte || priceCondition.gte || ''
      setInputPrice(nextPrice)
    }
  }, [priceCondition])

  const updateComparatorOnCross = useCallback(
    (t: number | undefined, priceString: string): 'gte' | 'lte' => {
      if (t === undefined) return comparator

      const side: 'below' | 'above' = t >= currentTick ? 'above' : 'below'
      const hasCrossed = lastSideRef.current !== null && lastSideRef.current !== side
      lastSideRef.current = side

      if (hasCrossed) {
        const next = side === 'above' ? 'gte' : 'lte'
        setComparator(next)
        setMetric({
          metric: Metric.PoolPrice,
          condition: { gte: next === 'gte' ? priceString : '', lte: next === 'lte' ? priceString : '' },
        })
        return next
      }

      return comparator
    },
    [comparator, currentTick, setMetric],
  )

  // Keep side reference in sync with latest tick (without forcing comparator change)
  useEffect(() => {
    if (tick !== undefined) {
      lastSideRef.current = tick >= currentTick ? 'above' : 'below'
    }
  }, [tick, currentTick])

  // Debounce input price updates
  useEffect(() => {
    if (changeSourceRef.current === 'slider' || metric.metric !== Metric.PoolPrice) return
    const timer = setTimeout(() => {
      // Detect crossing on debounced input value
      const typedTick = priceToTick(inputPrice)
      let nextComparator = comparator
      if (typedTick !== undefined) {
        const side: 'below' | 'above' = typedTick >= currentTick ? 'above' : 'below'
        const hasCrossed = lastSideRef.current !== null && lastSideRef.current !== side
        if (hasCrossed) {
          nextComparator = side === 'above' ? 'gte' : 'lte'
        }
        lastSideRef.current = side
      }

      if (nextComparator !== comparator) {
        setComparator(nextComparator)
      }

      if (
        (nextComparator === 'gte' && inputPrice !== priceCondition?.gte) ||
        (nextComparator === 'lte' && inputPrice !== priceCondition?.lte)
      ) {
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextComparator === 'gte' ? inputPrice : '',
            lte: nextComparator === 'lte' ? inputPrice : '',
          },
        })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputPrice, comparator])

  // Debounce tick updates from input typing to avoid jitter on the slider
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (debounceTickFromInputRef.current) {
      clearTimeout(debounceTickFromInputRef.current)
    }
    debounceTickFromInputRef.current = setTimeout(() => {
      const t = priceToTick(inputPrice)
      if (t !== undefined && t !== tick) {
        setTick(t)
        lastSideRef.current = t >= currentTick ? 'above' : 'below'
      }
      debounceTickFromInputRef.current = null
    }, 200)

    return () => {
      if (debounceTickFromInputRef.current) {
        clearTimeout(debounceTickFromInputRef.current)
        debounceTickFromInputRef.current = null
      }
    }
  }, [currentTick, inputPrice, priceToTick, tick])

  // Wrapper to set tick from slider (updates price)
  const setPriceTick = useCallback(
    (tick: number | undefined) => {
      changeSourceRef.current = 'slider'
      setTick(tick)
      if (tick !== undefined) {
        const price = toString(
          formatNumberBySignificantDigits(
            tickToPrice(tick, position.token0.decimals, position.token1.decimals, false),
            6,
          ),
        )
        const nextComparator = updateComparatorOnCross(tick, price)
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextComparator === 'gte' ? price : '',
            lte: nextComparator === 'lte' ? price : '',
          },
        })
        setInputPrice(price)
      }
      // Reset source after React batch update
      setTimeout(() => {
        changeSourceRef.current = null
      }, 0)
    },
    [position.token0.decimals, position.token1.decimals, setMetric, updateComparatorOnCross],
  )

  // Sync tick from price input (only when source is input, not slider)
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition) {
      const priceTick = priceToTick(priceCondition.gte ?? priceCondition.lte ?? '')
      if (priceTick !== undefined && priceTick !== tick) {
        setTick(priceTick)
        // Update side reference but don't auto-switch comparator unless crossing
        lastSideRef.current = priceTick >= currentTick ? 'above' : 'below'
        // Keep comparator from condition if provided; else keep current
        const conditionComparator = priceCondition.lte ? 'lte' : priceCondition.gte ? 'gte' : comparator
        if (conditionComparator !== comparator) {
          setComparator(conditionComparator)
        }
      }
    }
  }, [comparator, currentTick, priceCondition, priceToTick, tick])

  const wrappedCorrectPrice = (value: string) => {
    const tick = priceToClosestTick(value, position.token0.decimals, position.token1.decimals, false)
    if (tick !== undefined) {
      const correctedTick =
        tick % position.pool.tickSpacing === 0 ? tick : nearestUsableTick(tick, position.pool.tickSpacing)
      const correctedPrice = tickToPrice(correctedTick, position.token0.decimals, position.token1.decimals, false)
      const formatted = toString(formatNumberBySignificantDigits(correctedPrice, 6))
      const nextComparator = updateComparatorOnCross(correctedTick, formatted)
      setInputPrice(formatted)
      setMetric({
        metric: Metric.PoolPrice,
        condition: { gte: nextComparator === 'gte' ? formatted : '', lte: nextComparator === 'lte' ? formatted : '' },
      })
      setTick(correctedTick)
    }
  }

  const handleComparatorChange = useCallback(
    (next: 'gte' | 'lte') => {
      setComparator(next)

      // Calculate default price with gap based on pair category
      const pairCategory = position.pool.category
      const gap =
        pairCategory === PAIR_CATEGORY.STABLE ? 0.0001 : pairCategory === PAIR_CATEGORY.CORRELATED ? 0.001 : 0.1
      const defaultPrice = position.priceRange.current * (1 + (next === 'gte' ? gap : -gap))
      const newTick = priceToClosestTick(toString(defaultPrice), position.token0.decimals, position.token1.decimals)

      if (newTick !== undefined) {
        const nearestTick = nearestUsableTick(newTick, position.pool.tickSpacing)
        const correctedPrice = toString(
          formatNumberBySignificantDigits(
            tickToPrice(nearestTick, position.token0.decimals, position.token1.decimals, false),
            6,
          ),
        )

        setInputPrice(correctedPrice)
        setTick(nearestTick)
        lastSideRef.current = nearestTick >= currentTick ? 'above' : 'below'

        setMetric({
          metric: Metric.PoolPrice,
          condition: { gte: next === 'gte' ? correctedPrice : '', lte: next === 'lte' ? correctedPrice : '' },
        })
      } else {
        // Fallback to current input price if tick calculation fails
        setMetric({
          metric: Metric.PoolPrice,
          condition: { gte: next === 'gte' ? inputPrice : '', lte: next === 'lte' ? inputPrice : '' },
        })
      }
    },
    [currentTick, inputPrice, position, setMetric],
  )

  const expectedAmounts = useMemo(
    () =>
      calculateExpectedAmounts(
        {
          currentPrice: toString(position.priceRange.current),
          minPrice: position.priceRange.min,
          maxPrice: position.priceRange.max,
          token0Amount: position.token0.totalProvide + position.token0.unclaimedAmount,
          token1Amount: position.token1.totalProvide + position.token1.unclaimedAmount,
        },
        priceCondition,
      ),
    [
      position.priceRange,
      position.token0.totalProvide,
      position.token0.unclaimedAmount,
      position.token1.totalProvide,
      position.token1.unclaimedAmount,
      priceCondition,
    ],
  )

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>
          <Trans>
            Exit when {position.token0.symbol}/{position.token1.symbol}
          </Trans>
        </Text>
        <Flex
          sx={{
            display: 'inline-flex',
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${theme.border}`,
          }}
        >
          <PriceInputIcon onClick={() => handleComparatorChange('gte')} $active={comparator === 'gte'}>
            ≥
          </PriceInputIcon>
          <PriceInputIcon onClick={() => handleComparatorChange('lte')} $active={comparator === 'lte'}>
            ≤
          </PriceInputIcon>
        </Flex>
        <PriceCustomInput
          placeholder={`${position.token0.symbol}/${position.token1.symbol}`}
          value={inputPrice}
          onChange={e => {
            const value = e.target.value
            // Only allow numbers and decimal point
            if (/^\d*\.?\d*$/.test(value)) {
              setInputPrice(value)
              const typedTick = priceToTick(value)
              if (typedTick !== undefined) {
                updateComparatorOnCross(typedTick, value) // change comparator immediately on cross
              }
            }
          }}
          onBlur={e => wrappedCorrectPrice(e.target.value)}
        />
      </Flex>

      <Box>
        <PriceSlider
          pool={{
            tickSpacing: position.pool.tickSpacing,
            token0Decimals: position.token0.decimals,
            token1Decimals: position.token1.decimals,
            currentTick,
          }}
          tick={tick}
          setTick={setPriceTick}
          comparator={comparator}
          mode="range-to-infinite"
          showStepButtons
        />
      </Box>

      <Flex alignItems="center" justifyContent="space-between" sx={{ gap: '8px' }} flexWrap="wrap">
        <Text color={theme.subText} fontSize={12}>
          <Trans>Est. Balance</Trans>
        </Text>
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          {expectedAmounts ? (
            <Text fontSize={14}>
              {formatDisplayNumber(expectedAmounts.amount0, { significantDigits: 4 })} {position.token0.symbol}
            </Text>
          ) : (
            <PositionSkeleton width={60} height={14} />
          )}
          <Box width={'1px'} height={'12px'} bg={theme.border} />
          {expectedAmounts ? (
            <Text fontSize={14}>
              {formatDisplayNumber(expectedAmounts.amount1, { significantDigits: 4 })} {position.token1.symbol}
            </Text>
          ) : (
            <PositionSkeleton width={60} height={14} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
