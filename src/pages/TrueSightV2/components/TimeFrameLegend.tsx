import React, { useLayoutEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { KyberAITimeframe } from '../types'

const TimeFrameWrapper = styled.div`
  height: 28px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  position: relative;
  background-color: ${({ theme }) => (theme.darkMode ? theme.buttonBlack : theme.subText + '80')};
  border: 2px solid ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => (theme.darkMode ? theme.subText : theme.textReverse)};
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 10px;
    justify-content: center;
    background-color: ${({ theme }) => (theme.darkMode ? theme.background : theme.subText + '80')};
  `}
`
const Element = styled.div<{ active?: boolean; count?: number }>`
  padding: 6px 12px;
  width: calc(100% / ${({ count }) => count || 1});
  z-index: 2;
  display: flex;
  justify-content: center;
  text-transform: uppercase;
  ${({ active, theme }) => active && `color: ${theme.text};`}
  :hover {
    filter: brightness(1.2);
  }
`

const ActiveElement = styled.div<{ left?: number; width?: number }>`
  width: 25%;
  height: 24px;
  border-radius: 20px;
  position: absolute;
  left: 0;
  background-color: ${({ theme }) => theme.tableHeader};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 1;
  transition: all 0.2s ease;
  :hover {
    filter: brightness(1.2);
  }

  ${({ left, width }) => css`
    transform: translateX(${left ?? 0}px);
    width: ${width || 40}px;
  `}
`

const TimeFrameLegend = ({
  selected,
  timeframes,
  onSelect,
}: {
  selected?: string
  timeframes: KyberAITimeframe[]
  onSelect: (timeframe: KyberAITimeframe) => void
}) => {
  const refs = useRef<any>({})
  const [left, setLeft] = useState(0)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (selected && refs.current?.[selected]) {
      setLeft(refs.current[selected].offsetLeft)
      setWidth(refs.current[selected].offsetWidth)
    }
  }, [selected])
  if (timeframes?.length < 1) return null
  return (
    <TimeFrameWrapper className="time-frame-legend">
      {timeframes.map((t: KyberAITimeframe, index: number) => {
        return (
          <Element
            key={index}
            ref={el => {
              refs.current[t] = el
            }}
            onClick={() => onSelect?.(t)}
            active={selected === t}
            count={timeframes.length}
          >
            {t}
          </Element>
        )
      })}
      <ActiveElement left={left} width={width} />
    </TimeFrameWrapper>
  )
}

export default React.memo(TimeFrameLegend)
