import { t } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import InfoHelper from 'components/InfoHelper'

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
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="48.5" viewBox="0 0 218 133" fill="none">
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
        <Text fontSize="14px" lineHeight="20px">
          {value}
        </Text>
        <InfoHelper
          placement="top"
          width="300px"
          size={12}
          text={t`Calculated at 08:00 AM when the price was $0.000000004234`}
        />
      </GaugeValue>
    </Wrapper>
  )
}
export default React.memo(SmallKyberScoreMeter)
