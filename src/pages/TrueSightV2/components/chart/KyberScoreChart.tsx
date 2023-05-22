import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import useTheme from 'hooks/useTheme'
import { IKyberScoreChart } from 'pages/TrueSightV2/types'
import { calculateValueToColor, formatTokenPrice } from 'pages/TrueSightV2/utils'

import SimpleTooltip from '../SimpleTooltip'

const Wrapper = styled.div`
  height: 28px;
  width: 140px;
  rect:hover {
    filter: brightness(1.2);
  }
`

export default function KyberScoreChart({
  width,
  height,
  data,
  index,
  noAnimation,
}: {
  width?: string
  height?: string
  data?: Array<IKyberScoreChart>
  index: number
  noAnimation?: boolean
}) {
  const theme = useTheme()

  const [{ x, y }, setXY] = useState({ x: 0, y: 0 })
  const [hoveringItem, setHoveringItem] = useState<IKyberScoreChart | undefined>()

  const handleMouseLeave = useCallback(() => {
    setXY({ x: 0, y: 0 })
    setHoveringItem(undefined)
  }, [])

  const filledData = useMemo(() => {
    if (!data) return []
    if (data.length === 19) {
      return data.slice(1, 19)
    }
    const datatemp = []
    const startTimestamp = Math.floor(Date.now() / 14400000) * 14400
    for (let i = 0; i < 18; i++) {
      const timestamp = startTimestamp - i * 14400
      const index = data.findIndex(item => item.created_at === timestamp)
      if (index >= 0) {
        datatemp.push(data[index])
      } else {
        datatemp.push(null)
      }
    }
    return datatemp.reverse()
  }, [data])

  const handleMouseEnter = useCallback(
    (e: any, index: number) => {
      setXY({ x: e.clientX, y: e.clientY })
      setHoveringItem(filledData[index] || undefined)
    },
    [filledData],
  )

  return (
    <Wrapper style={{ width, height }} onMouseLeave={handleMouseLeave}>
      <svg width="100%" height="100%" viewBox="0 0 100 22" preserveAspectRatio="none">
        <defs>
          <clipPath id={'cut-off-outline' + index}>
            {filledData?.map((item, index) => {
              const gap = 2
              const rectWidth = (100 - (filledData.length - 1) * gap) / filledData.length
              return <rect key={index} x={index * (rectWidth + gap)} y={0} width={rectWidth} height={21}></rect>
            })}
          </clipPath>
        </defs>
        <g transform="scale(1,-1) translate(0,-21)" clipPath="url(#cut-off-outline)">
          {filledData?.map((item, index) => {
            const v = item?.kyber_score || 0
            const gap = 2
            const rectWidth = (100 - (filledData.length - 1) * gap) / filledData.length
            const rectHeight = !v ? 21 : Math.max((v * 21) / 100, 0.8)
            const color = calculateValueToColor(v || 0, theme)

            // if (!item) return <rect key={index} x={index * (rectWidth + gap)} y={0} />
            return (
              <rect
                key={v + index}
                x={index * (rectWidth + gap)}
                y={0}
                width={rectWidth}
                style={{ fill: !v ? (theme.darkMode ? theme.background + '60' : theme.text + '10') : color }}
                onMouseEnter={e => handleMouseEnter(e, index)}
                strokeWidth={!v ? '2px' : 0}
                stroke={theme.disableText}
                vectorEffect="non-scaling-stroke"
              >
                <animate
                  attributeName="height"
                  from={noAnimation ? rectHeight : '0'}
                  to={rectHeight}
                  dur={noAnimation ? '0s' : '0.5s'}
                  begin={noAnimation ? '0s' : `${1 + index * 0.05}s`}
                  fill="freeze"
                  keySplines="0 0.33 0.3 1"
                />
              </rect>
            )
          })}
        </g>
      </svg>
      <SimpleTooltip
        x={x}
        y={y}
        text={
          <Column style={{ color: theme.subText, fontSize: '12px', lineHeight: '16px' }} gap="2px">
            <Text>
              Calculated at{' '}
              {hoveringItem?.created_at && dayjs(hoveringItem?.created_at * 1000).format('DD/MM/YYYY hh:mm A')}
            </Text>
            <Text style={{ whiteSpace: 'nowrap' }}>
              <Trans>KyberScore</Trans>:{' '}
              <span
                style={{ color: hoveringItem ? calculateValueToColor(hoveringItem.kyber_score, theme) : theme.text }}
              >
                {hoveringItem ? `${hoveringItem.kyber_score} (${hoveringItem.tag})` : '--'}
              </span>
            </Text>
            <Text>
              <Trans>Token Price</Trans>:{' '}
              <span style={{ color: theme.text }}>${hoveringItem ? formatTokenPrice(hoveringItem?.price) : '--'}</span>
            </Text>
          </Column>
        }
        maxWidth="250px"
      />
    </Wrapper>
  )
}
