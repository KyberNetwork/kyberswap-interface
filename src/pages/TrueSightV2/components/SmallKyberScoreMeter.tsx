import React from 'react'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'

import { gaugeList } from './KyberScoreMeter'

const Wrapper = styled.div`
  position: relative;
  width: fit-content;
`
const MeterGauge = styled.path`
  transition: all 0.2s ease;
`
const GaugeValue = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: center;
  bottom: 6px;
`
function SmallKyberScoreMeter({ value }: { value?: number }) {
  const theme = useTheme()
  const activeGaugeValue = value ? (gaugeList.length * value) / 100 : 0
  return (
    <Wrapper>
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="32" viewBox="0 0 218 133" fill="none">
        {gaugeList.map(g => (
          <MeterGauge
            key={g.value}
            d={g.d}
            fill={
              (activeGaugeValue || 0) >= g.value ? theme.primary : theme.darkMode ? theme.subText : theme.background2
            }
          />
        ))}
      </svg>
      <GaugeValue>
        <RowFit gap="2px">
          <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
            {value}
          </Text>
          <Icon id="timer" size={12} />
        </RowFit>
      </GaugeValue>
    </Wrapper>
  )
}
export default React.memo(SmallKyberScoreMeter)
