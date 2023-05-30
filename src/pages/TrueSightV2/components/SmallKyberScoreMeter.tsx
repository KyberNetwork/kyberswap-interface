import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React from 'react'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'

import Column from 'components/Column'
import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'

import { IKyberScoreChart } from '../types'
import { calculateValueToColor, formatTokenPrice } from '../utils'
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
function SmallKyberScoreMeter({ data }: { data?: IKyberScoreChart }) {
  const value = data?.kyber_score
  const theme = useTheme()
  const emptyColor = theme.darkMode ? theme.subText + '30' : theme.border + '60'
  const activeGaugeValue = value ? (gaugeList.length * value) / 100 : 0
  const activeGaugeColor = calculateValueToColor(value || 0, theme)

  return (
    <Wrapper>
      <svg xmlns="http://www.w3.org/2000/svg" width="52" height="32" viewBox="0 0 218 133" fill="none">
        {gaugeList.map((g, index) => (
          <MeterGauge key={`${value}${g.value}`} d={g.d} fill={emptyColor}>
            <animate
              attributeName="fill"
              from={emptyColor}
              to={!value || g.value >= activeGaugeValue ? emptyColor : activeGaugeColor}
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
            data ? (
              <Column style={{ whiteSpace: 'pre-wrap' }}>
                <Text>
                  Calculated at {data.created_at ? dayjs(data.created_at * 1000).format('DD/MM/YYYY HH:mm A') : '--'}
                </Text>
                <Text>
                  KyberScore:{' '}
                  <span style={{ color: calculateValueToColor(data.kyber_score || 0, theme) }}>
                    {data.kyber_score || '--'} ({data.tag || t`Not Applicable`})
                  </span>
                </Text>
                <Text>
                  Token Price: <span style={{ color: theme.text }}>{formatTokenPrice(data.price || 0)}</span>
                </Text>
              </Column>
            ) : (
              <Text fontStyle="italic">
                <Trans>KyberScore is not applicable for stablecoins</Trans>
              </Text>
            )
          }
        >
          <RowFit gap="2px">
            <Text fontSize="12px" lineHeight="16px" color={calculateValueToColor(value || 0, theme)}>
              {value?.toFixed(0)}
            </Text>
            <Icon id="timer" size={10} />
          </RowFit>
        </SimpleTooltip>
      </GaugeValue>
    </Wrapper>
  )
}
export default React.memo(SmallKyberScoreMeter)
