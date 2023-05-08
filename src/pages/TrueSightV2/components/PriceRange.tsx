import { CSSProperties, useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import DropdownIcon from 'components/Icons/DropdownIcon'
import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

import { formatTokenPrice } from '../utils'

const Wrapper = styled.div`
  position: relative;
  margin: 12px 0;
`
const RowCenter = styled(RowBetween)`
  font-size: 12px;
  x & > * {
    flex: 1;
  }
`

const RangeBarWrapper = styled.div`
  height: 8px;
  width: 100%;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  margin: 6px 0;
  ${({ theme }) => `background-color: ${theme.darkMode ? theme.subText : theme.background2};`}
`
const RangeBar = styled.div<{ $width: number }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  transition: all 0.5s ease;
  ${({ theme }) => `background-color: ${theme.red};`}
  ${({ $width }) => css`
    width: ${$width}px;
  `}
`
const ArrowPointer = styled.div<{ $left: number }>`
  border: 4px solid transparent;
  position: absolute;
  top: 50%;
  transform: translate(-50%, 0) rotate(180deg);
  transition: all 0.5s ease;
  svg {
    display: inline-block;
  }

  ${({ $left }) => css`
    left: ${$left}px;
  `}
`

export default function PriceRange({
  title,
  high,
  low,
  current,
  style,
}: {
  title: string
  high: number
  low: number
  current: number
  style?: CSSProperties
}) {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (low === 0 || high === 0) return
    const ratio = Math.min((current - low) / (high - low), 1)
    setWidth(ratio * (wrapperRef.current?.clientWidth || 0))
  }, [high, low, current])

  return (
    <Wrapper style={style}>
      <RowCenter>
        <Text>{low ? `$${formatTokenPrice(low)}` : '--'}</Text>
        <Text color={theme.text}>{title}</Text>
        <Text>{high ? `$${formatTokenPrice(high)}` : '--'}</Text>
      </RowCenter>
      <RangeBarWrapper ref={wrapperRef}>
        <RangeBar $width={width} />
      </RangeBarWrapper>
      <ArrowPointer $left={width}>
        <DropdownIcon />
      </ArrowPointer>
    </Wrapper>
  )
}
