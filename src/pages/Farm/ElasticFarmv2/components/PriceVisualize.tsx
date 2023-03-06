import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween } from 'components/Row'

const Wrapper = styled.div`
  width: min(150px, 100%);
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
  width: 70px;
  position: absolute;
  left: 40px;
`
const PriceVisualize = ({ rangeInclude = true }: { rangeInclude?: boolean }) => {
  return (
    <Wrapper>
      {rangeInclude && (
        <RowBetween>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            0.0001788
          </Text>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            -
          </Text>
          <Text fontSize="12px" fontWeight={500} lineHeight="16px">
            0.0008523
          </Text>
        </RowBetween>
      )}
      <PriceLine>
        <Dot style={{ left: '40px' }} />
        <Dot style={{ left: '70px', backgroundColor: 'var(--background)' }} />
        <Dot style={{ left: '110px' }} />
        <RangeLine />
      </PriceLine>
    </Wrapper>
  )
}

export default React.memo(PriceVisualize)
