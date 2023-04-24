import { useCallback, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import Column from 'components/Column'
import useTheme from 'hooks/useTheme'
import { calculateValueToColor } from 'pages/TrueSightV2/utils'

import SimpleTooltip from '../SimpleTooltip'

const Wrapper = styled.div`
  height: 28px;
  width: 140px;
  rect:hover {
    filter: brightness(1.2);
  }
`

export default function KyberScoreChart({ width, height }: { width?: string; height?: string }) {
  const theme = useTheme()
  const sampleData = [10, 20, 60, 40, 50, 60, 70, 40, 90, 60, 70, 80, 90, 50, 60, 70, 70, 0]

  const [{ x, y }, setXY] = useState({ x: 0, y: 0 })
  const handleMouseEnter = useCallback((e: any) => {
    console.log(e)
    setXY({ x: e.clientX, y: e.clientY })
  }, [])
  const handleMouseLeave = useCallback(() => {
    setXY({ x: 0, y: 0 })
  }, [])
  return (
    <Wrapper style={{ width, height }} onMouseLeave={handleMouseLeave}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g transform="scale(1,-1) translate(0,-100)">
          {sampleData.map((v, index) => {
            const gap = 2
            const rectWidth = (100 - (sampleData.length - 1) * gap) / sampleData.length
            const rectHeight = v === 0 ? 100 : v
            const color = calculateValueToColor(v, theme)

            return (
              <rect
                key={index}
                x={index * (rectWidth + gap)}
                y={0}
                width={rectWidth}
                style={{ fill: v === 0 ? (theme.darkMode ? theme.background + '60' : theme.text + '10') : color }}
                onMouseEnter={handleMouseEnter}
                strokeWidth={v === 0 ? '2px' : 0}
                stroke={theme.disableText}
                vectorEffect="non-scaling-stroke"
                shapeRendering="crispEdges"
              >
                <animate
                  attributeName="height"
                  from="0"
                  to={rectHeight}
                  dur="0.5s"
                  begin={`${1 + index * 0.05}s`}
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
          <Column style={{ color: theme.subText, fontSize: '12px', lineHeight: '16px' }}>
            <Text>24/04/2023 08:00 AM</Text>
            <Text>
              KyberScore: <span style={{ color: theme.primary }}>88 (Bullish)</span>
            </Text>
            <Text>
              Token Price: <span style={{ color: theme.text }}>$0.000000423</span>
            </Text>
          </Column>
        }
      />
    </Wrapper>
  )
}
