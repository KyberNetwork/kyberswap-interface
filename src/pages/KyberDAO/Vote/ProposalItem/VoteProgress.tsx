import { useEffect, useRef, useState } from 'react'
import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

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
const move = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 0;
  }
`
const Progress = styled.div<{ width: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: 4px;
  width: ${({ width }) => width || 0}%;
  background-color: ${({ theme }) => theme.darkerGreen};
  z-index: 0;
  ::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-image: linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.1) 28%,
      transparent 28%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 50%,
      rgba(0, 0, 0, 0.1) 78%,
      transparent 78%,
      transparent
    );
    background-size: 25px 25px;
    animation: ${move} 1.5s linear infinite;
  }
`
export default function VoteProgress({ checked, percent = 40 }: { checked?: boolean; percent?: number }) {
  return (
    <Wrapper>
      <RowBetween style={{ zIndex: 1 }} alignItems="center">
        <RowFit gap="5px" style={{ fontSize: '12px' }}>
          {checked ? <RadioButtonChecked /> : <RadioButtonUnchecked />} Unbounced
        </RowFit>
        <Text fontSize="12px">{percent}%</Text>
      </RowBetween>
      <Progress width={percent} />
    </Wrapper>
  )
}
