import { Trans } from '@lingui/macro'
import React, { useCallback } from 'react'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'

import { calculateValueToColor } from '../utils'
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
  const emptyColor = theme.darkMode ? theme.subText + '30' : theme.border + '60'
  const activeGaugeValue = value ? (gaugeList.length * value) / 100 : 0
  const gaugeColor = useCallback(
    (value: number) => {
      const percent = (value / gaugeList.length) * 100
      if (value > activeGaugeValue) {
        return emptyColor
      }
      return calculateValueToColor(percent, theme)
    },
    [activeGaugeValue, theme, emptyColor],
  )

  return (
    <Wrapper>
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="32" viewBox="0 0 218 133" fill="none">
        {gaugeList.map((g, index) => (
          <MeterGauge key={g.value} d={g.d} fill={emptyColor}>
            <animate
              attributeName="fill"
              from={emptyColor}
              to={gaugeColor(g.value)}
              dur="0.01s"
              begin={`${1 + index * 0.035}s`}
              fill="freeze"
            />
          </MeterGauge>
        ))}
      </svg>
      <GaugeValue>
        <SimpleTooltip
          text={
            <Trans>
              This is based on calculation at <b style={{ color: theme.text }}>08:00 AM</b> when the price of ETH was{' '}
              <b style={{ color: theme.text }}>$0.0000000001</b>
            </Trans>
          }
        >
          <RowFit gap="2px">
            <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
              {value}
            </Text>
            <Icon id="timer" size={10} />
          </RowFit>
        </SimpleTooltip>
      </GaugeValue>
    </Wrapper>
  )
}
export default React.memo(SmallKyberScoreMeter)
