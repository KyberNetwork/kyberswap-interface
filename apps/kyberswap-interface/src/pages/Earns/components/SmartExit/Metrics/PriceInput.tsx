import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'
import PriceSlider from '@kyberswap/price-slider'
import '@kyberswap/price-slider/style.css'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { HighlightWrapper } from 'pages/Earns/components/SmartExit/GuidedHighlight'
import { calculateExpectedAmounts } from 'pages/Earns/components/SmartExit/Metrics/calculateExpectedAmounts'
import { PriceCustomInput, PriceInputIcon } from 'pages/Earns/components/SmartExit/styles'
import { defaultPriceCondition } from 'pages/Earns/components/SmartExit/utils'
import { getPriceCondition } from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { Metric, PAIR_CATEGORY, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber, toString } from 'utils/numbers'

type Comparator = 'gte' | 'lte'

const flipComparator = (c: Comparator): Comparator => (c === 'gte' ? 'lte' : 'gte')

const toSignificantDigitString = (n: number | string, digits: number): string => {
  const num = typeof n === 'number' ? n : parseFloat(n)
  if (!isFinite(num) || num === 0) return '0'
  return toString(Number(num.toPrecision(digits)))
}

export default function PriceInput({
  metric,
  setMetric,
  position,
  isHighlighted = false,
  revertPrice = false,
}: {
  metric: SelectedMetric
  setMetric: (value: SelectedMetric) => void
  position: ParsedPosition
  isHighlighted?: boolean
  revertPrice?: boolean
}) {
  const theme = useTheme()
  const priceCondition = useMemo(() => getPriceCondition(metric) || defaultPriceCondition, [metric])

  // Stored condition (priceCondition) is always in forward (token0/token1) domain
  // so the backend payload and Confirmation view stay consistent regardless of display inversion.
  // The local `inputPrice` and `comparator` state are in DISPLAY domain and mirror what the user sees.

  const toDisplayPrice = useCallback(
    (forward: string | number | undefined): string => {
      if (forward === undefined || forward === null || forward === '') return ''
      const n = typeof forward === 'number' ? forward : parseFloat(forward)
      if (!isFinite(n) || n <= 0) return ''
      if (!revertPrice) return typeof forward === 'string' ? forward : toString(forward)
      return toSignificantDigitString(1 / n, 6)
    },
    [revertPrice],
  )

  const toForwardPrice = useCallback(
    (display: string): string => {
      if (!display) return ''
      const n = parseFloat(display)
      if (!isFinite(n) || n <= 0) return ''
      return revertPrice ? toSignificantDigitString(1 / n, 6) : display
    },
    [revertPrice],
  )

  const toDisplayComparator = useCallback(
    (stored: Comparator): Comparator => (revertPrice ? flipComparator(stored) : stored),
    [revertPrice],
  )

  const toStoredComparator = useCallback(
    (display: Comparator): Comparator => (revertPrice ? flipComparator(display) : display),
    [revertPrice],
  )

  const [tick, setTick] = useState<number>()
  const [inputPrice, setInputPrice] = useState<string>(() =>
    toDisplayPrice(priceCondition?.lte || priceCondition?.gte || ''),
  )
  const [comparator, setComparator] = useState<Comparator>(() =>
    toDisplayComparator(priceCondition?.lte ? 'lte' : 'gte'),
  )

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

  // Forward price string → nearest usable tick
  const forwardPriceToTick = useCallback(
    (forwardPrice: string) => {
      if (!forwardPrice) return undefined
      const priceNum = parseFloat(forwardPrice)
      if (!priceNum || priceNum <= 0 || !isFinite(priceNum)) return undefined
      return nearestUsableTick(
        priceToClosestTick(forwardPrice, position.token0.decimals, position.token1.decimals) || 0,
        position.pool.tickSpacing,
      )
    },
    [position.pool.tickSpacing, position.token0.decimals, position.token1.decimals],
  )

  // Display price string → nearest usable tick (converts through forward domain)
  const displayPriceToTick = useCallback(
    (displayPrice: string) => forwardPriceToTick(toForwardPrice(displayPrice)),
    [forwardPriceToTick, toForwardPrice],
  )

  // Sync display state when condition changes externally (not via slider)
  // Also re-syncs when revertPrice toggles: toDisplayPrice/toDisplayComparator change,
  // so this effect re-runs and reformats the shown value/comparator.
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition) {
      const storedComparator: Comparator = priceCondition.lte ? 'lte' : 'gte'
      setComparator(toDisplayComparator(storedComparator))
      const storedPrice = priceCondition.lte || priceCondition.gte || ''
      setInputPrice(toDisplayPrice(storedPrice))
    }
  }, [priceCondition, toDisplayComparator, toDisplayPrice])

  // Detects a crossing of `currentTick` and flips the stored/display comparators accordingly.
  // Returns the STORED (forward) comparator after any flip.
  const updateComparatorOnCross = useCallback(
    (t: number | undefined, forwardPriceString: string): Comparator => {
      const storedNow = toStoredComparator(comparator)
      if (t === undefined) return storedNow

      const side: 'below' | 'above' = t >= currentTick ? 'above' : 'below'
      const hasCrossed = lastSideRef.current !== null && lastSideRef.current !== side
      lastSideRef.current = side

      if (hasCrossed) {
        const nextStored: Comparator = side === 'above' ? 'gte' : 'lte'
        setComparator(toDisplayComparator(nextStored))
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextStored === 'gte' ? forwardPriceString : '',
            lte: nextStored === 'lte' ? forwardPriceString : '',
          },
        })
        return nextStored
      }

      return storedNow
    },
    [comparator, currentTick, setMetric, toDisplayComparator, toStoredComparator],
  )

  // Keep side reference in sync with latest tick (without forcing comparator change)
  useEffect(() => {
    if (tick !== undefined) {
      lastSideRef.current = tick >= currentTick ? 'above' : 'below'
    }
  }, [tick, currentTick])

  // Debounce input price updates
  // Latest-effect ref pattern: the timer body reads from this ref so it always sees fresh
  // closures (important when revertPrice toggles mid-debounce), while the effect deps stay
  // narrow — unstable parent identities like setMetric can't reset the debounce timer.
  const commitInputRef = useRef<() => void>(() => {})
  commitInputRef.current = () => {
    const forwardInput = toForwardPrice(inputPrice)
    const typedTick = forwardPriceToTick(forwardInput)
    let storedComparator: Comparator = toStoredComparator(comparator)
    if (typedTick !== undefined) {
      const side: 'below' | 'above' = typedTick >= currentTick ? 'above' : 'below'
      const hasCrossed = lastSideRef.current !== null && lastSideRef.current !== side
      if (hasCrossed) {
        storedComparator = side === 'above' ? 'gte' : 'lte'
      }
      lastSideRef.current = side
    }

    const nextDisplayComparator = toDisplayComparator(storedComparator)
    if (nextDisplayComparator !== comparator) {
      setComparator(nextDisplayComparator)
    }

    if (
      (storedComparator === 'gte' && forwardInput !== priceCondition?.gte) ||
      (storedComparator === 'lte' && forwardInput !== priceCondition?.lte)
    ) {
      setMetric({
        metric: Metric.PoolPrice,
        condition: {
          gte: storedComparator === 'gte' ? forwardInput : '',
          lte: storedComparator === 'lte' ? forwardInput : '',
        },
      })
    }
  }

  useEffect(() => {
    if (changeSourceRef.current === 'slider' || metric.metric !== Metric.PoolPrice) return
    const timer = setTimeout(() => {
      commitInputRef.current()
    }, 300)
    return () => clearTimeout(timer)
  }, [inputPrice, comparator, metric.metric])

  // Debounce tick updates from input typing to avoid jitter on the slider
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (debounceTickFromInputRef.current) {
      clearTimeout(debounceTickFromInputRef.current)
    }
    debounceTickFromInputRef.current = setTimeout(() => {
      const t = displayPriceToTick(inputPrice)
      if (t === undefined) {
        setTick(undefined)
      } else if (t !== tick) {
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
  }, [currentTick, inputPrice, displayPriceToTick, tick])

  // Wrapper to set tick from slider (updates price)
  const setPriceTick = useCallback(
    (t: number | undefined) => {
      changeSourceRef.current = 'slider'
      setTick(t)
      if (t !== undefined) {
        const forwardPrice = toSignificantDigitString(
          tickToPrice(t, position.token0.decimals, position.token1.decimals, false),
          6,
        )
        const nextStored = updateComparatorOnCross(t, forwardPrice)
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextStored === 'gte' ? forwardPrice : '',
            lte: nextStored === 'lte' ? forwardPrice : '',
          },
        })
        setInputPrice(toDisplayPrice(forwardPrice))
      }
      // Reset source after React batch update
      setTimeout(() => {
        changeSourceRef.current = null
      }, 0)
    },
    [position.token0.decimals, position.token1.decimals, setMetric, toDisplayPrice, updateComparatorOnCross],
  )

  // Sync tick from price condition (only when source is input, not slider)
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition) {
      const forwardPrice = priceCondition.gte || priceCondition.lte || ''
      const priceTick = forwardPriceToTick(forwardPrice)
      if (priceTick === undefined) {
        setTick(undefined)
      } else if (priceTick !== tick) {
        setTick(priceTick)
        // Update side reference but don't auto-switch comparator unless crossing
        lastSideRef.current = priceTick >= currentTick ? 'above' : 'below'
        const storedComparator: Comparator = priceCondition.lte
          ? 'lte'
          : priceCondition.gte
          ? 'gte'
          : toStoredComparator(comparator)
        const nextDisplayComparator = toDisplayComparator(storedComparator)
        if (nextDisplayComparator !== comparator) {
          setComparator(nextDisplayComparator)
        }
      }
    }
  }, [comparator, currentTick, priceCondition, forwardPriceToTick, tick, toDisplayComparator, toStoredComparator])

  const wrappedCorrectPrice = useCallback(
    (value: string) => {
      const forwardValue = toForwardPrice(value)
      const correctedTick = priceToClosestTick(forwardValue, position.token0.decimals, position.token1.decimals, false)
      if (correctedTick !== undefined) {
        const nearestTick =
          correctedTick % position.pool.tickSpacing === 0
            ? correctedTick
            : nearestUsableTick(correctedTick, position.pool.tickSpacing)
        const correctedForwardPrice = tickToPrice(
          nearestTick,
          position.token0.decimals,
          position.token1.decimals,
          false,
        )
        const formattedForward = toSignificantDigitString(correctedForwardPrice, 6)
        const nextStored = updateComparatorOnCross(nearestTick, formattedForward)
        setInputPrice(toDisplayPrice(formattedForward))
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextStored === 'gte' ? formattedForward : '',
            lte: nextStored === 'lte' ? formattedForward : '',
          },
        })
        setTick(nearestTick)
      }
    },
    [
      position.token0.decimals,
      position.token1.decimals,
      position.pool.tickSpacing,
      setMetric,
      toDisplayPrice,
      toForwardPrice,
      updateComparatorOnCross,
    ],
  )

  const handleComparatorChange = useCallback(
    (nextDisplay: Comparator) => {
      setComparator(nextDisplay)
      const nextStored = toStoredComparator(nextDisplay)

      // Calculate default price with gap based on pair category (in forward domain)
      const pairCategory = position.pool.category
      const gap =
        pairCategory === PAIR_CATEGORY.STABLE ? 0.0001 : pairCategory === PAIR_CATEGORY.CORRELATED ? 0.001 : 0.1
      const defaultForwardPrice = position.priceRange.current * (1 + (nextStored === 'gte' ? gap : -gap))
      const newTick = priceToClosestTick(
        toString(defaultForwardPrice),
        position.token0.decimals,
        position.token1.decimals,
      )

      if (newTick !== undefined) {
        const nearestTick = nearestUsableTick(newTick, position.pool.tickSpacing)
        const correctedForwardPrice = toSignificantDigitString(
          tickToPrice(nearestTick, position.token0.decimals, position.token1.decimals, false),
          6,
        )

        setInputPrice(toDisplayPrice(correctedForwardPrice))
        setTick(nearestTick)
        lastSideRef.current = nearestTick >= currentTick ? 'above' : 'below'

        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextStored === 'gte' ? correctedForwardPrice : '',
            lte: nextStored === 'lte' ? correctedForwardPrice : '',
          },
        })
      } else {
        // Fallback to current input price if tick calculation fails
        const fallbackForward = toForwardPrice(inputPrice)
        setMetric({
          metric: Metric.PoolPrice,
          condition: {
            gte: nextStored === 'gte' ? fallbackForward : '',
            lte: nextStored === 'lte' ? fallbackForward : '',
          },
        })
      }
    },
    [currentTick, inputPrice, position, setMetric, toDisplayPrice, toForwardPrice, toStoredComparator],
  )

  const expectedAmounts = useMemo(
    () =>
      calculateExpectedAmounts(
        {
          currentPrice: toString(position.priceRange.current),
          minPrice: position.priceRange.min,
          maxPrice: position.priceRange.max,
          token0Amount: position.token0.currentAmount + position.token0.unclaimedAmount,
          token1Amount: position.token1.currentAmount + position.token1.unclaimedAmount,
        },
        priceCondition,
      ),
    [
      position.priceRange,
      position.token0.currentAmount,
      position.token0.unclaimedAmount,
      position.token1.currentAmount,
      position.token1.unclaimedAmount,
      priceCondition,
    ],
  )

  const baseSymbol = revertPrice ? position.token1.symbol : position.token0.symbol
  const quoteSymbol = revertPrice ? position.token0.symbol : position.token1.symbol

  return (
    <>
      <Flex alignItems="center" sx={{ gap: '4px' }}>
        <Text>
          <Trans>
            Exit when {baseSymbol}/{quoteSymbol}
          </Trans>
        </Text>
        <HighlightWrapper isHighlighted={isHighlighted}>
          <Flex alignItems="center" sx={{ gap: '4px' }}>
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
              placeholder={`${baseSymbol}/${quoteSymbol}`}
              value={inputPrice}
              onChange={e => {
                const value = e.target.value
                // Only allow numbers and decimal point
                if (/^\d*\.?\d*$/.test(value)) {
                  setInputPrice(value)
                  const typedTick = displayPriceToTick(value)
                  if (typedTick !== undefined) {
                    updateComparatorOnCross(typedTick, toForwardPrice(value)) // change comparator immediately on cross
                  }
                }
              }}
              onBlur={e => wrappedCorrectPrice(e.target.value)}
            />
          </Flex>
        </HighlightWrapper>
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
          comparator={toStoredComparator(comparator)}
          mode="range-to-infinite"
          showStepButtons
          invertPrice={revertPrice}
        />
      </Box>

      <Flex alignItems="center" justifyContent="space-between" sx={{ gap: '8px' }} flexWrap="wrap">
        <Text color={theme.subText} fontSize={12}>
          <Trans>Est. Balance</Trans>
        </Text>
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          {expectedAmounts ? (
            <Text fontSize={14} color={theme.primary}>
              {formatDisplayNumber(expectedAmounts.amount0, { significantDigits: 4 })}{' '}
              <Text as="span" color={theme.text}>
                {position.token0.symbol}
              </Text>
            </Text>
          ) : (
            <PositionSkeleton width={60} height={14} />
          )}
          <Box width={'1px'} height={'12px'} bg={theme.border} />
          {expectedAmounts ? (
            <Text fontSize={14} color={theme.primary}>
              {formatDisplayNumber(expectedAmounts.amount1, { significantDigits: 4 })}{' '}
              <Text as="span" color={theme.text}>
                {position.token1.symbol}
              </Text>
            </Text>
          ) : (
            <PositionSkeleton width={60} height={14} />
          )}
        </Flex>
      </Flex>
    </>
  )
}
