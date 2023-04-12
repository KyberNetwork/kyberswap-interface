import { useCallback } from 'react'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  height: 28px;
  width: 140px;
  rect:hover {
    filter: brightness(1.2);
  }
`
export default function KyberScoreChart({ width, height }: { width?: string; height?: string }) {
  const theme = useTheme()
  const sampleData = [10, 20, 60, 40, 50, 60, 70, 40, 90, 60, 70, 80, 90]
  const calculateColor = useCallback(
    (value: number) => {
      if (value < 20) {
        return theme.red
      }
      if (value < 40) {
        return '#FFA7C3'
      }
      if (value < 60) {
        return theme.text
      }
      if (value < 80) {
        return '#8DE1C7'
      }

      return theme.primary
    },
    [theme],
  )
  return (
    <Wrapper style={{ width, height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g transform="scale(1,-1) translate(0,-100)">
          {sampleData.map((v, index) => {
            const gap = 2
            const rectWidth = (100 - (sampleData.length - 1) * gap) / sampleData.length
            const rectHeight = v
            const color = calculateColor(v)
            return (
              <rect key={index} x={index * (rectWidth + gap)} y={0} width={rectWidth} style={{ fill: color }}>
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
    </Wrapper>
  )
}
