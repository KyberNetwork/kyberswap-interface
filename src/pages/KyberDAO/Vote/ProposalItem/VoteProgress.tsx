import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import RadioButtonChecked from 'components/Icons/RadioButtonChecked'
import RadioButtonUnchecked from 'components/Icons/RadioButtonUnchecked'
import { RowBetween, RowFit } from 'components/Row'

const Wrapper = styled.div`
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  height: 36px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  ${({ theme }) => css`
    background-color: ${theme.buttonBlack};
  `};
`

const Progress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 4px;
  width: ${({ width }) => width || 0}px;
  background-color: ${({ theme }) => theme.primary};
  z-index: 0;
`
export default function VoteProgress({ checked, percent = 40 }: { checked?: boolean; percent?: number }) {
  const [progressWidth, setProgressWidth] = useState(40)
  const wrapperRef = useRef<any>()
  const wrapperWidth = wrapperRef.current?.getBoundingClientRect().width || 0

  useEffect(() => {
    setProgressWidth((percent * wrapperWidth) / 100)
  }, [wrapperWidth, percent])

  return (
    <Wrapper ref={wrapperRef as any}>
      <RowBetween style={{ zIndex: 1 }} alignItems="center">
        <RowFit gap="5px" style={{ fontSize: '12px' }}>
          {checked ? <RadioButtonChecked /> : <RadioButtonUnchecked />} Unbounced
        </RowFit>
        <Text fontSize="12px">{percent}%</Text>
      </RowBetween>
      <Progress width={progressWidth} />
    </Wrapper>
  )
}
