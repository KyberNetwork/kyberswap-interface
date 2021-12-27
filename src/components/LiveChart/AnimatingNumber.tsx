import React from 'react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Text, Flex } from 'rebass'
import useTheme from 'hooks/useTheme'

export function usePrevious(value: number) {
  const ref = useRef<number>(value)

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

function formatForDisplay(number = 0) {
  return Math.max(number, 0)
    .toPrecision(6)
    .split('')
    .reverse()
}

function DecimalColumn() {
  return (
    <div>
      <span>.</span>
    </div>
  )
}

const TicketView = styled(motion.div)`
  height: 100%;
  display: flex;
  flex-direction: row-reverse;
  overflow: hidden;
  font-size: 32px;
  position: relative;
  color: ${({ theme }) => theme.subText};
  letter-spacing: -1px;
  margin-right: 5px;
`

const NumberPlaceHolder = styled.span`
  visibility: hidden;
`

const Container = styled.div`
  position: relative;
  height: 38px;
`

const TickerDigit = styled.div`
  height: 10%;
  text-align: center;
`

const TickerColumn = styled(motion.div)`
  position: absolute;
  height: 1000%;
  bottom: 0;

  &.increase {
    animation: pulseGreen 500ms cubic-bezier(0.4, 0, 0.6, 1) 1;
  }
  &.decrease {
    animation: pulseRed 500ms cubic-bezier(0.4, 0, 0.6, 1) 1;
  }
`

function NumberColumn({ digit, delta }: { digit: number; delta: string }) {
  const [position, setPosition] = useState(0)
  const [animationClass, setAnimationClass] = useState<string | null>(null)
  const previousDigit = usePrevious(digit)
  const columnContainer = useRef<HTMLDivElement>()

  const setColumnToNumber = (number: number) => {
    if (columnContainer.current) {
      setPosition(columnContainer.current?.clientHeight * number ?? 0)
    }
  }

  useEffect(() => setAnimationClass(previousDigit !== digit ? delta : ''), [digit, delta])

  useEffect(() => setColumnToNumber(digit), [digit])

  return (
    <Container ref={columnContainer as any}>
      <TickerColumn
        animate={{ y: position }}
        className={`${animationClass}`}
        onAnimationComplete={() => setAnimationClass('')}
      >
        {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(num => (
          <TickerDigit key={num}>
            <span>{num}</span>
          </TickerDigit>
        ))}
      </TickerColumn>
      <NumberPlaceHolder>0</NumberPlaceHolder>
    </Container>
  )
}

export default function AnimatingNumber({ value, symbol }: { value: number; symbol: string | undefined }) {
  const numArray = formatForDisplay(value)
  const previousNumber = usePrevious(value)
  const theme = useTheme()
  let delta = ''
  if (value > previousNumber) delta = 'increase'
  if (value < previousNumber) delta = 'decrease'

  return (
    <Flex>
      <TicketView layout>
        {numArray.map((number, index) =>
          number === '.' ? (
            <DecimalColumn key={index} />
          ) : (
            <NumberColumn key={index} digit={parseInt(number)} delta={delta} />
          )
        )}
      </TicketView>
      {symbol && (
        <Text fontSize={32} color={theme.subText}>
          {symbol}
        </Text>
      )}
    </Flex>
  )
}
