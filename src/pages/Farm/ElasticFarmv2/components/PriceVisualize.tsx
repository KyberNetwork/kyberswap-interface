import { Token } from '@kyberswap/ks-sdk-core'
import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'

import { convertTickToPrice } from '../utils'

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

const maxRangeGap = 0.1

const PriceVisualize = ({
  rangeInclude = true,
  tickRangeLower,
  tickRangeUpper,
  tickPosLower,
  tickPosUpper,
  tickCurrent,
  width,
  token0,
  token1,
}: {
  rangeInclude?: boolean
  tickRangeLower?: number
  tickRangeUpper?: number
  tickPosLower?: number
  tickPosUpper?: number
  tickCurrent?: number
  width?: string
  token0?: Token
  token1?: Token
}) => {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [wrapperWidth, setWrapperWidth] = useState(0)

  const priceRangeLower = convertTickToPrice(token0, token1, tickRangeLower)
  const priceRangeUpper = convertTickToPrice(token0, token1, tickRangeUpper)
  // const pricePosLower = convertTickToPrice(token0, token1, tickPosLower)
  // const pricePosUpper = convertTickToPrice(token0, token1, tickPosUpper)
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
  if (priceRangeLower === undefined || priceRangeUpper === undefined || priceCurrent === undefined) return null

  const lowerUpperRatio = Math.abs(+priceRangeLower - +priceCurrent) / Math.abs(+priceRangeUpper - +priceCurrent)
  let upperDotPos, lowerDotPos
  if (priceRangeLower === '0') {
    lowerDotPos = 0
  } else {
    lowerDotPos =
      lowerUpperRatio > 1
        ? wrapperWidth * maxRangeGap
        : wrapperWidth * (maxRangeGap + (0.5 - maxRangeGap) * (1 - lowerUpperRatio))
  }
  if (priceRangeUpper === '∞') {
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
        <RowBetween gap="6px">
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            {priceRangeLower}
          </Text>
          <Text color={theme.subText} as="span">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
              <path
                d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                fill="currentcolor"
              />
            </svg>
          </Text>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            {priceRangeUpper}
          </Text>
        </RowBetween>
      )}
      <MouseoverTooltip
        text={
          <RowFit gap="6px">
            <Text fontSize="12px" fontWeight={500} lineHeight="16px">
              {priceRangeLower}
            </Text>
            <Text color={theme.subText} as="span">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" display="block">
                <path
                  d="M11.3405 8.66669L11.3405 9.86002C11.3405 10.16 11.7005 10.3067 11.9071 10.0934L13.7605 8.23335C13.8871 8.10002 13.8871 7.89335 13.7605 7.76002L11.9071 5.90669C11.7005 5.69335 11.3405 5.84002 11.3405 6.14002L11.3405 7.33335L4.66047 7.33335L4.66047 6.14002C4.66047 5.84002 4.30047 5.69335 4.0938 5.90669L2.24047 7.76669C2.1138 7.90002 2.1138 8.10669 2.24047 8.24002L4.0938 10.1C4.30047 10.3134 4.66047 10.16 4.66047 9.86669L4.66047 8.66669L11.3405 8.66669Z"
                  fill="currentcolor"
                />
              </svg>
            </Text>
            <Text fontSize="12px" fontWeight={500} lineHeight="16px">
              {priceRangeUpper}
            </Text>
          </RowFit>
        }
        width="fit-content"
        placement="top"
      >
        <PriceLine>
          <Dot style={{ left: `${lowerDotPos}px` }} />
          <Dot style={{ left: `${wrapperWidth / 2}px`, backgroundColor: 'var(--background)' }} />
          <Dot style={{ left: `${upperDotPos}px` }} />
          <RangeLine style={{ left: `${lowerDotPos}px`, width: `${upperDotPos - lowerDotPos}px` }} />
        </PriceLine>
      </MouseoverTooltip>
    </Wrapper>
  )
}

export default PriceVisualize
