import { NumberValue, ScaleLinear, axisBottom, Axis as d3Axis, select } from 'd3'
import { useMemo } from 'react'

import useTheme from 'hooks/useTheme'

const Axis = ({ axisGenerator }: { axisGenerator: d3Axis<NumberValue> }) => {
  const theme = useTheme()

  const axisRef = (axis: SVGGElement) => {
    axis &&
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').attr('color', '#064E38').attr('stroke-width', 1.5))
        .call(g => g.selectAll('.tick line').attr('color', 'transparent'))
        .call(g => g.selectAll('.tick text').attr('color', theme.subText))
  }

  return <g ref={axisRef} />
}

export const AxisBottom = ({
  xScale,
  innerHeight,
  offset = 0,
}: {
  xScale: ScaleLinear<number, number>
  innerHeight: number
  offset?: number
}) =>
  useMemo(
    () => (
      <g className="group" transform={`translate(0, ${innerHeight + offset})`}>
        <Axis axisGenerator={axisBottom(xScale).ticks(6)} />
      </g>
    ),
    [innerHeight, offset, xScale],
  )
