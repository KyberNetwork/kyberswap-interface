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
  z-index: 3;
  transform: translateX(-50%);
`

const RangeLine = styled.div`
  height: 2px;
  background-color: var(--text);
  position: absolute;
  :hover {
    z-index: 2;
  }
`
// From tick value to readable string value 0.1234

const rangeGap = 0.1

enum DOT_TYPE {
  RangeLower = 0,
  RangeUpper = 1,
  PositionLower = 2,
  PositionUpper = 3,
  CurrentPrice = 4,
}

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
  token0: Token
  token1: Token
}) => {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [wrapperWidth, setWrapperWidth] = useState(0)

  const tickMap = [tickRangeLower, tickRangeUpper, tickPosLower, tickPosUpper, tickCurrent]
  const priceMap = tickMap.map(v => (!!v || v === 0 ? convertTickToPrice(token0, token1, v) : undefined))

  let minValue = +(priceMap[DOT_TYPE.CurrentPrice] || 1),
    maxValue = +(priceMap[DOT_TYPE.CurrentPrice] || 1)

  Object.values(priceMap).forEach(value => {
    if (value !== undefined && value !== '∞' && value !== '0') {
      if (+value < minValue) {
        minValue = +value
      }
      if (+value > maxValue) {
        maxValue = +value
      }
    }
  })
  const fullRangeValue = maxValue - minValue
  const leftMap = priceMap.map(value => {
    if (value === undefined) return undefined
    let leftPercent
    const hasMinValue = priceMap[DOT_TYPE.CurrentPrice] ? +(priceMap[DOT_TYPE.CurrentPrice] || 0) !== minValue : false
    const hasMaxValue = priceMap[DOT_TYPE.CurrentPrice] ? +(priceMap[DOT_TYPE.CurrentPrice] || 0) !== maxValue : false

    if (value === '0') {
      leftPercent = 0
    } else if (value === '∞') {
      leftPercent = 1
    } else if (+value === minValue && hasMinValue) {
      leftPercent = rangeGap
    } else if (+value === maxValue && hasMaxValue) {
      leftPercent = 1 - rangeGap
    } else {
      leftPercent = (hasMinValue ? rangeGap : 0) + (+value - minValue) / fullRangeValue
    }

    return leftPercent * wrapperWidth
  })

  useEffect(() => {
    //Listen for window resize
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

  return (
    <Wrapper style={{ width }} ref={wrapperRef}>
      {rangeInclude && (
        <RowBetween gap="6px">
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            {priceMap[DOT_TYPE.RangeLower]}
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
            {priceMap[DOT_TYPE.RangeUpper]}
          </Text>
        </RowBetween>
      )}
      <MouseoverTooltip
        text={
          <RowFit gap="6px">
            <Text fontSize="12px" fontWeight={500} lineHeight="16px">
              {priceMap[DOT_TYPE.RangeLower]}
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
              {priceMap[DOT_TYPE.RangeUpper]}
            </Text>
          </RowFit>
        }
        width="fit-content"
        placement="top"
      >
        <PriceLine>
          {leftMap.map((value: number | undefined, index) => {
            return (
              value !== undefined && (
                <Dot
                  key={index}
                  style={{
                    left: `${value}px`,
                    backgroundColor: index === DOT_TYPE.CurrentPrice ? 'var(--background)' : undefined,
                  }}
                />
              )
            )
          })}
          {leftMap[DOT_TYPE.PositionLower] !== undefined && leftMap[DOT_TYPE.PositionUpper] !== undefined && (
            <RangeLine
              style={{
                left: `${leftMap[DOT_TYPE.PositionLower]}px`,
                width: `${(leftMap[DOT_TYPE.PositionUpper] || 0) - (leftMap[DOT_TYPE.PositionLower] || 0)}px`,
                backgroundColor: 'var(--primary)',
              }}
            />
          )}
          {leftMap[DOT_TYPE.RangeLower] !== undefined && leftMap[DOT_TYPE.RangeUpper] !== undefined && (
            <RangeLine
              style={{
                left: `${leftMap[DOT_TYPE.RangeLower]}px`,
                width: `${(leftMap[DOT_TYPE.RangeUpper] || 0) - (leftMap[DOT_TYPE.RangeLower] || 0)}px`,
              }}
            />
          )}
        </PriceLine>
      </MouseoverTooltip>
    </Wrapper>
  )
}

export default PriceVisualize
