import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'
import UniswapPriceSlider from '@kyberswap/price-slider'
import '@kyberswap/price-slider/style.css'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'

import { CustomInput } from 'pages/Earns/components/SmartExit/styles'
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
  const priceCondition = metric.condition as PriceCondition

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
        const price = tickToPrice(tick, position.token0.decimals, position.token1.decimals, false)
        setMetric({ ...metric, condition: { ...priceCondition, gte: price } })
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
        const price = tickToPrice(tick, position.token0.decimals, position.token1.decimals, false)
        setMetric({ ...metric, condition: { ...priceCondition, lte: price } })
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

  return (
    <>
      <Text>
        <Trans>Exit when the pool price is between</Trans>
      </Text>
      <Flex sx={{ gap: '0.5rem' }} alignItems={'center'} mt="8px" mb="8px">
        <CustomInput
          placeholder="Min price"
          value={inputMinPrice}
          onChange={e => {
            const value = e.target.value
            // Only allow numbers and decimal point
            if (/^\d*\.?\d*$/.test(value)) {
              setInputMinPrice(value)
            }
          }}
        />
        -
        <CustomInput
          placeholder="Max price"
          value={inputMaxPrice}
          onChange={e => {
            const value = e.target.value
            // Only allow numbers and decimal point
            if (/^\d*\.?\d*$/.test(value)) {
              setInputMaxPrice(value)
            }
          }}
        />
        <Text width="max-content">
          {position.token0.symbol}/{position.token1.symbol}
        </Text>
      </Flex>
      <UniswapPriceSlider
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
    </>
  )
}
