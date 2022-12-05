import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'

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
  ${({ theme }) => `background-color: ${theme.subText};`}
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
  width: 0px;
  height: 0px;
  border: 4px solid transparent;
  position: absolute;
  bottom: -3px;
  transform: translate(-50%, 0);
  transition: all 0.5s ease;

  ${({ theme }) => css`
    border-bottom: 4px solid ${theme.subText} !important;
  `}
  ${({ $left }) => css`
    left: ${$left}px;
  `}
`

export default function PriceRange({
  title,
  high,
  low,
  current,
}: {
  title: string
  high: number
  low: number
  current: number
}) {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const ratio = (current - low) / (high - low)
    setWidth(ratio * (wrapperRef.current?.clientWidth || 0))
  }, [high, low, current])
  return (
    <Wrapper>
      <RowCenter>
        <Text>{`$${low}` || '--'}</Text>
        <Text color={theme.text}>{title}</Text>
        <Text>{`$${high}` || '--'}</Text>
      </RowCenter>
      <RangeBarWrapper ref={wrapperRef}>
        <RangeBar $width={width} />
      </RangeBarWrapper>
      <ArrowPointer $left={width} />
    </Wrapper>
  )
}
