import { ZoomTransform, max, scaleLinear } from 'd3'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { Bound } from 'state/mint/proamm/type'

import { Area } from './Area'
import { AxisBottom } from './AxisBottom'
import { Brush } from './Brush'
import { Line } from './Line'
import OriginalZoom, { ZoomOverlay } from './Zoom'
import { ChartEntry, LiquidityChartRangeInputProps } from './types'

const xAccessor = (d: ChartEntry) => d.price0
const yAccessor = (d: ChartEntry) => d.activeLiquidity

const Zoom = styled(OriginalZoom)<{ $interactive: boolean }>`
  ${({ $interactive }) => (!$interactive ? 'top: -46px;' : '')}
`

export function Chart({
  data: { series, current },
  ticksAtLimit,
  styles,
  dimensions: { viewBoxWidth, height },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
}: LiquidityChartRangeInputProps) {
  const id = useId()

  const viewBoxHeight = 200
  const zoomRef = useRef<SVGRectElement | null>(null)

  const [zoom, setZoom] = useState<ZoomTransform | null>(null)

  const [innerHeight, innerWidth] = useMemo(
    () => [viewBoxHeight - margins.top - margins.bottom - 10, viewBoxWidth - margins.left - margins.right],
    [viewBoxWidth, viewBoxHeight, margins],
  )

  const { xScale, yScale } = useMemo(() => {
    const minDomain = brushDomain?.[0]
      ? brushDomain[0] < current
        ? brushDomain[0]
        : current
      : current * zoomLevels.initialMin
    const maxDomain = brushDomain?.[1]
      ? brushDomain[1] > current
        ? brushDomain[1]
        : current
      : current * zoomLevels.initialMax

    const scales = {
      xScale: scaleLinear()
        .domain([minDomain, maxDomain] as number[])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)] as number[])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale)
      scales.xScale.domain(newXscale.domain())
    }

    return scales
  }, [brushDomain, current, zoomLevels.initialMin, zoomLevels.initialMax, innerWidth, series, innerHeight, zoom])

  useEffect(() => {
    // reset zoom as necessary
    setZoom(null)
  }, [zoomLevels])

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(xScale.domain() as [number, number], undefined)
    }
  }, [brushDomain, onBrushDomainChange, xScale])

  return (
    <>
      <Zoom
        $interactive={!!interactive}
        svg={zoomRef.current}
        xScale={xScale}
        setZoom={setZoom}
        width={innerWidth}
        height={
          // allow zooming inside the x-axis
          viewBoxHeight
        }
        resetBrush={() => {
          onBrushDomainChange(
            [current * zoomLevels.initialMin, current * zoomLevels.initialMax] as [number, number],
            'reset',
          )
        }}
        showResetButton={Boolean(ticksAtLimit[Bound.LOWER] || ticksAtLimit[Bound.UPPER])}
        zoomLevels={zoomLevels}
      />
      <svg
        width="100%"
        height={height || '100%'} //"233.5px"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ overflow: 'hidden' }}
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={viewBoxHeight} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="white"
                x={xScale(brushDomain[0])}
                y="0"
                width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                height={innerHeight}
              />
            </mask>
          )}
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            <Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} />

            {brushDomain && (
              // duplicate area chart with mask for selected area
              <g mask={`url(#${id}-chart-area-mask)`}>
                <Area
                  series={series}
                  xScale={xScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  fill={styles.area.selection}
                />
              </g>
            )}

            <Line value={current} xScale={xScale} innerHeight={innerHeight} />

            <AxisBottom xScale={xScale} innerHeight={innerHeight} />
          </g>

          <ZoomOverlay width={innerWidth} height={viewBoxHeight} ref={zoomRef} />

          <Brush
            id={id}
            xScale={xScale}
            interactive={interactive}
            brushLabelValue={brushLabels}
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            westHandleColor={styles.brush.handle.west}
            eastHandleColor={styles.brush.handle.east}
          />
        </g>
      </svg>
    </>
  )
}
