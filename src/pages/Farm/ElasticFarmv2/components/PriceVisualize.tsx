import { Token } from '@kyberswap/ks-sdk-core'
import { TickMath, tickToPrice } from '@kyberswap/ks-sdk-elastic'
import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'

const Wrapper = styled.div`
  width: 150px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`
const PriceLine = styled.div`
  height: 2px;
  width: 100%;
  border-radius: 2px;
  background-color: var(--border);
  position: relative;
`
const Dot = styled.div`
  height: 8px;
  width: 8px;
  border-radius: 4px;
  border: 1px solid white;
  background-color: white;
  position: absolute;
  top: -3px;
  z-index: 2;
  transform: translateX(-50%);
`

const RangeLine = styled.div`
  height: 2px;
  background-color: var(--text);
  position: absolute;
`
// From tick value to readable string value 0.1234
function convertTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: string): string | undefined {
  if (!baseToken || !quoteToken) {
    return undefined
  }
  if (+(tick || 0) <= TickMath.MIN_TICK) {
    return '0'
  }
  if (+(tick || 0) >= TickMath.MAX_TICK) {
    return '∞'
  }
  return tickToPrice(baseToken, quoteToken, +(tick || 0))?.toSignificant(4)
}

const maxRangeGap = 0.1

const PriceVisualize = ({
  rangeInclude = true,
  tickLower,
  tickUpper,
  tickCurrent,
  width,
  token0,
  token1,
}: {
  rangeInclude?: boolean
  tickLower?: string
  tickUpper?: string
  tickCurrent?: string
  width?: string
  token0?: Token
  token1?: Token
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [wrapperWidth, setWrapperWidth] = useState(0)

  const priceLower = convertTickToPrice(token0, token1, tickLower)
  const priceUpper = convertTickToPrice(token0, token1, tickUpper)
  const priceCurrent = convertTickToPrice(token0, token1, tickCurrent)

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      setWrapperWidth(entries[0].contentRect.width)
    })
    let ref: HTMLDivElement
    if (wrapperRef.current) {
      ref = wrapperRef.current
      observer.observe(wrapperRef.current)
    }

    return () => {
      ref && observer.unobserve(ref)
    }
  }, [])
  if (priceLower === undefined || priceUpper === undefined || priceCurrent === undefined) return null

  const lowerUpperRatio = Math.abs(+priceLower - +priceCurrent) / Math.abs(+priceUpper - +priceCurrent)
  let upperDotPos, lowerDotPos
  if (priceLower === '0') {
    lowerDotPos = 0
  } else {
    lowerDotPos =
      lowerUpperRatio > 1
        ? wrapperWidth * maxRangeGap
        : wrapperWidth * (maxRangeGap + (0.5 - maxRangeGap) * (1 - lowerUpperRatio))
  }
  if (priceUpper === '∞') {
    upperDotPos = wrapperWidth
  } else {
    upperDotPos =
      lowerUpperRatio < 1
        ? wrapperWidth * (1 - maxRangeGap)
        : wrapperWidth * (0.5 + (0.5 - maxRangeGap) / lowerUpperRatio)
  }

  return (
    <Wrapper style={{ width }} ref={wrapperRef}>
      {rangeInclude && (
        <RowBetween>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            {priceLower}
          </Text>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            -
          </Text>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            {priceUpper}
          </Text>
        </RowBetween>
      )}
      <PriceLine>
        <Dot style={{ left: `${lowerDotPos}px` }} />
        <Dot style={{ left: `${wrapperWidth / 2}px`, backgroundColor: 'var(--background)' }} />
        <Dot style={{ left: `${upperDotPos}px` }} />
        <RangeLine style={{ left: `${lowerDotPos}px`, width: `${upperDotPos - lowerDotPos}px` }} />
      </PriceLine>
    </Wrapper>
  )
}

export default PriceVisualize
