import { ScaleLinear, area, curveStepAfter } from 'd3'
import { useMemo } from 'react'

import useTheme from 'hooks/useTheme'

import { ChartEntry } from '../types'

export const Area = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  fill,
  opacity,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  fill?: string | undefined
  opacity?: number
}) => {
  const theme = useTheme()

  return useMemo(
    () => (
      <path
        opacity={opacity || 1}
        fill={fill ?? theme.red}
        stroke={fill ?? theme.red}
        d={
          area()
            .curve(curveStepAfter)
            .x((d: unknown) => xScale(xValue(d as ChartEntry)))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(
            series.filter(d => {
              const value = xScale(xValue(d))
              return value > 0 && value <= window.innerWidth
            }) as Iterable<[number, number]>,
          ) ?? undefined
        }
      />
    ),
    [fill, opacity, series, xScale, xValue, yScale, yValue, theme.red],
  )
}
