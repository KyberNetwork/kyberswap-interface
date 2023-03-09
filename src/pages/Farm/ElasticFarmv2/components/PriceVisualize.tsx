import React, { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'

const Wrapper = styled.div`
  width: 150px;
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

const maxRangeGap = 0.1

const PriceVisualize = ({
  rangeInclude = true,
  priceLower,
  priceUpper,
  priceCurrent,
  width,
}: {
  rangeInclude?: boolean
  priceLower?: string
  priceUpper?: string
  priceCurrent?: string
  width?: string
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [wrapperWidth, setWrapperWidth] = useState(0)

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

export default React.memo(PriceVisualize)
