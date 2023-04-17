import React, { useCallback } from 'react'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'

import { gaugeList } from './KyberScoreMeter'
import SimpleTooltip from './SimpleTooltip'

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
  const gaugeColor = useCallback(
    (value: number) => {
      const percent = (value / gaugeList.length) * 100
      if (value > activeGaugeValue) {
        return theme.darkMode ? theme.subText + '30' : theme.background2
      }
      if (percent < 20) {
        return theme.red
      }
      if (percent < 40) {
        return '#FFA7C3'
      }
      if (percent < 60) {
        return theme.text
      }
      if (percent < 80) {
        return '#8DE1C7'
      }

      return theme.primary
    },
    [activeGaugeValue, theme],
  )
  return (
    <Wrapper>
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="32" viewBox="0 0 218 133" fill="none">
        {gaugeList.map(g => (
          <MeterGauge key={g.value} d={g.d} fill={gaugeColor(g.value)} />
        ))}
      </svg>
      <GaugeValue>
        <SimpleTooltip text="This is based on calculation at 08:00 AM when the price of ETH was $0.0000000001">
          <RowFit gap="2px">
            <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
              {value}
            </Text>
            <Icon id="timer" size={12} />
          </RowFit>
        </SimpleTooltip>
      </GaugeValue>
    </Wrapper>
  )
}
export default React.memo(SmallKyberScoreMeter)
