import { formatNumberBySignificantDigits } from '@kyber/utils/dist/number'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'
import PriceRangeSlider from '@kyberswap/price-range-slider'
import '@kyberswap/price-range-slider/style.css'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Minus, Plus } from 'react-feather'
import { Flex, Text } from 'rebass'

import { DropdownIcon } from 'components/SwapForm/SlippageSetting'
import useTheme from 'hooks/useTheme'
import { CustomPriceInput, PriceInputIcon, PriceInputWrapper } from 'pages/Earns/components/SmartExit/styles'
import { Metric, ParsedPosition, PriceCondition, SelectedMetric } from 'pages/Earns/types'

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
  const priceCondition = metric.condition as PriceCondition

  const [priceSliderExpanded, setPriceSliderExpanded] = useState(false)
  const [lowerTick, setLowerTickState] = useState<number>()
  const [upperTick, setUpperTickState] = useState<number>()

  // Local input state for debouncing
  const [inputMinPrice, setInputMinPrice] = useState(priceCondition?.gte ?? '')
  const [inputMaxPrice, setInputMaxPrice] = useState(priceCondition?.lte ?? '')

  // Track change source to prevent circular updates
  const changeSourceRef = useRef<'input' | 'slider' | null>(null)

  // Sync local input with external price changes (from slider)
  useEffect(() => {
    if (changeSourceRef.current === 'slider' && priceCondition?.gte) {
      setInputMinPrice(priceCondition.gte)
    }
  }, [priceCondition?.gte])

  useEffect(() => {
    if (changeSourceRef.current === 'slider' && priceCondition?.lte) {
      setInputMaxPrice(priceCondition.lte)
    }
  }, [priceCondition?.lte])

  // Debounce input price updates
  useEffect(() => {
    if (changeSourceRef.current === 'slider' || metric.metric !== Metric.PoolPrice) return
    const timer = setTimeout(() => {
      if (inputMinPrice !== priceCondition?.gte) {
        setMetric({ ...metric, condition: { ...priceCondition, gte: inputMinPrice } })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMinPrice])

  useEffect(() => {
    if (changeSourceRef.current === 'slider' || metric.metric !== Metric.PoolPrice) return
    const timer = setTimeout(() => {
      if (inputMaxPrice !== priceCondition?.lte) {
        setMetric({ ...metric, condition: { ...priceCondition, lte: inputMaxPrice } })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMaxPrice])

  const currentTick = useMemo(
    () =>
      nearestUsableTick(
        priceToClosestTick(
          position.priceRange.current.toString(),
          position.token0.decimals,
          position.token1.decimals,
        ) || 0,
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

  // Wrapper to set tick from slider (updates price)
  const setLowerTick = useCallback(
    (tick: number | undefined) => {
      changeSourceRef.current = 'slider'
      setLowerTickState(tick)
      if (tick !== undefined) {
        const price = formatNumberBySignificantDigits(
          tickToPrice(tick, position.token0.decimals, position.token1.decimals, false),
          6,
        )
        setMetric({ ...metric, condition: { ...priceCondition, gte: price.toString() } })
      }
      // Reset source after React batch update
      setTimeout(() => {
        changeSourceRef.current = null
      }, 0)
    },
    [metric, priceCondition, position.token0.decimals, position.token1.decimals, setMetric],
  )

  const setUpperTick = useCallback(
    (tick: number | undefined) => {
      changeSourceRef.current = 'slider'
      setUpperTickState(tick)
      if (tick !== undefined) {
        const price = formatNumberBySignificantDigits(
          tickToPrice(tick, position.token0.decimals, position.token1.decimals, false),
          6,
        )
        setMetric({ ...metric, condition: { ...priceCondition, lte: price.toString() } })
      }
      setTimeout(() => {
        changeSourceRef.current = null
      }, 0)
    },
    [metric, priceCondition, position.token0.decimals, position.token1.decimals, setMetric],
  )

  // Sync tick from price input (only when source is input, not slider)
  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition?.gte) {
      const tick = priceToTick(priceCondition.gte)
      if (tick !== undefined && tick !== lowerTick) {
        setLowerTickState(tick)
      }
    }
  }, [priceCondition?.gte, priceToTick, lowerTick])

  useEffect(() => {
    if (changeSourceRef.current === 'slider') return
    if (priceCondition?.lte) {
      const tick = priceToTick(priceCondition.lte)
      if (tick !== undefined && tick !== upperTick) {
        setUpperTickState(tick)
      }
    }
  }, [priceCondition?.lte, priceToTick, upperTick])

  const onDecreaseMinPrice = useCallback(() => {
    if (lowerTick === undefined) return
    const newLowerTick = lowerTick - position.pool.tickSpacing
    if (newLowerTick < MIN_TICK) return
    const price = formatNumberBySignificantDigits(
      tickToPrice(newLowerTick, position.token0.decimals, position.token1.decimals, false),
      6,
    )
    setMetric({ ...metric, condition: { ...priceCondition, gte: price.toString() } })
    setInputMinPrice(price.toString())
  }, [
    lowerTick,
    metric,
    position.pool.tickSpacing,
    position.token0.decimals,
    position.token1.decimals,
    priceCondition,
    setMetric,
  ])

  const onIncreaseMinPrice = useCallback(() => {
    if (lowerTick === undefined) return
    const newLowerTick = lowerTick + position.pool.tickSpacing
    if (newLowerTick > MAX_TICK) return
    const price = formatNumberBySignificantDigits(
      tickToPrice(newLowerTick, position.token0.decimals, position.token1.decimals, false),
      6,
    )
    setMetric({ ...metric, condition: { ...priceCondition, gte: price.toString() } })
    setInputMinPrice(price.toString())
  }, [
    lowerTick,
    metric,
    position.pool.tickSpacing,
    position.token0.decimals,
    position.token1.decimals,
    priceCondition,
    setMetric,
  ])

  const onDecreaseMaxPrice = useCallback(() => {
    if (upperTick === undefined) return
    const newUpperTick = upperTick - position.pool.tickSpacing
    if (newUpperTick < MIN_TICK) return
    const price = formatNumberBySignificantDigits(
      tickToPrice(newUpperTick, position.token0.decimals, position.token1.decimals, false),
      6,
    )
    setMetric({ ...metric, condition: { ...priceCondition, lte: price.toString() } })
    setInputMaxPrice(price.toString())
  }, [
    upperTick,
    metric,
    position.pool.tickSpacing,
    position.token0.decimals,
    position.token1.decimals,
    priceCondition,
    setMetric,
  ])

  const onIncreaseMaxPrice = useCallback(() => {
    if (upperTick === undefined) return
    const newUpperTick = upperTick + position.pool.tickSpacing
    if (newUpperTick > MAX_TICK) return
    const price = formatNumberBySignificantDigits(
      tickToPrice(newUpperTick, position.token0.decimals, position.token1.decimals, false),
      6,
    )
    setMetric({ ...metric, condition: { ...priceCondition, lte: price.toString() } })
    setInputMaxPrice(price.toString())
  }, [
    upperTick,
    metric,
    position.pool.tickSpacing,
    position.token0.decimals,
    position.token1.decimals,
    priceCondition,
    setMetric,
  ])

  const wrappedCorrectPrice = (value: string, type: 'lower' | 'upper') => {
    const tick = priceToClosestTick(value, position.token0.decimals, position.token1.decimals, false)
    if (tick !== undefined) {
      const correctedTick =
        tick % position.pool.tickSpacing === 0 ? tick : nearestUsableTick(tick, position.pool.tickSpacing)
      const correctedPrice = tickToPrice(correctedTick, position.token0.decimals, position.token1.decimals, false)
      if (type === 'lower') {
        setInputMinPrice(formatNumberBySignificantDigits(correctedPrice, 6).toString())
      } else {
        setInputMaxPrice(formatNumberBySignificantDigits(correctedPrice, 6).toString())
      }
    }
  }

  return (
    <>
      <Text>
        <Trans>Exit when the pool price is between</Trans>
      </Text>
      <Flex sx={{ gap: '0.75rem' }} alignItems={'center'} mt="8px" mb="8px">
        <PriceInputWrapper>
          <PriceInputIcon onClick={onDecreaseMinPrice}>
            <Minus color={theme.subText} size={16} />
          </PriceInputIcon>
          <CustomPriceInput
            placeholder="Min price"
            value={inputMinPrice}
            onChange={e => {
              const value = e.target.value
              // Only allow numbers and decimal point
              if (/^\d*\.?\d*$/.test(value)) {
                setInputMinPrice(value)
              }
            }}
            onBlur={e => wrappedCorrectPrice(e.target.value, 'lower')}
          />
          <PriceInputIcon>
            <Plus color={theme.subText} size={16} onClick={onIncreaseMinPrice} />
          </PriceInputIcon>
        </PriceInputWrapper>

        <PriceInputWrapper>
          <PriceInputIcon onClick={onDecreaseMaxPrice}>
            <Minus color={theme.subText} size={16} />
          </PriceInputIcon>
          <CustomPriceInput
            placeholder="Max price"
            value={inputMaxPrice}
            onChange={e => {
              const value = e.target.value
              // Only allow numbers and decimal point
              if (/^\d*\.?\d*$/.test(value)) {
                setInputMaxPrice(value)
              }
            }}
            onBlur={e => wrappedCorrectPrice(e.target.value, 'upper')}
          />
          <PriceInputIcon onClick={onIncreaseMaxPrice}>
            <Plus color={theme.subText} size={16} />
          </PriceInputIcon>
        </PriceInputWrapper>
      </Flex>

      <Flex
        justifyContent="center"
        onClick={() => setPriceSliderExpanded(e => !e)}
        marginTop={2}
        style={{ cursor: 'default', position: 'relative', userSelect: 'none' }}
      >
        <Text color={theme.text} fontSize={14}>
          {position.token1.symbol} <Trans>per</Trans> {position.token0.symbol}
        </Text>
        <DropdownIcon data-flip={priceSliderExpanded} size={16} style={{ position: 'absolute', right: 0, top: 0 }}>
          <ChevronDown />
        </DropdownIcon>
      </Flex>

      <Flex
        sx={{
          transition: 'all 200ms ease-in-out',
          paddingTop: priceSliderExpanded ? '8px' : '0px',
          height: priceSliderExpanded ? 'max-content' : '0px',
          overflow: 'hidden',
        }}
      >
        <PriceRangeSlider
          pool={{
            tickSpacing: position.pool.tickSpacing,
            token0Decimals: position.token0.decimals,
            token1Decimals: position.token1.decimals,
            currentTick,
          }}
          lowerTick={lowerTick}
          upperTick={upperTick}
          setLowerTick={setLowerTick}
          setUpperTick={setUpperTick}
        />
      </Flex>
    </>
  )
}
