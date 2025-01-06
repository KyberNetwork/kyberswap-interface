import { BrushBehavior, D3BrushEvent, ScaleLinear, brushX, select } from 'd3'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

import { usePreviousValue } from '../hooks'
import { OffScreenHandle, brushHandlePath } from './svg'

const StyledG = styled.g`
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
  animation-duration: 300ms;
`

// flips the handles draggers when close to the container edges
const FLIP_HANDLE_THRESHOLD_PX = 20

// margin to prevent tick snapping from putting the brush off screen
const BRUSH_EXTENT_MARGIN_PX = 2

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
const compare = (a: [number, number], b: [number, number], xScale: ScaleLinear<number, number>): boolean => {
  // normalize pixels to 1 decimals
  const aNorm = a.map(x => xScale(x).toFixed(1))
  const bNorm = b.map(x => xScale(x).toFixed(1))
  return aNorm.every((v, i) => v === bNorm[i])
}

export const Brush = ({
  id,
  xScale,
  interactive,
  brushLabelValue,
  brushExtent,
  setBrushExtent,
  innerWidth,
  innerHeight,
}: {
  id: string
  xScale: ScaleLinear<number, number>
  interactive: boolean
  brushLabelValue: (d: 'w' | 'e', x: number) => string
  brushExtent: [number, number]
  setBrushExtent: (extent: [number, number], mode: string | undefined) => void
  innerWidth: number
  innerHeight: number
}) => {
  const theme = useTheme()
  const brushRef = useRef<SVGGElement | null>(null)
  const brushBehavior = useRef<BrushBehavior<SVGGElement> | null>(null)

  // only used to drag the handles on brush for performance
  const [localBrushExtent, setLocalBrushExtent] = useState<[number, number] | null>(brushExtent)
  const [showLabels, setShowLabels] = useState(false)
  const [hovering, setHovering] = useState(false)

  const previousBrushExtent = usePreviousValue(brushExtent)

  const brushed = useCallback(
    (event: D3BrushEvent<unknown>) => {
      const { type, selection, mode } = event

      if (!selection) {
        setLocalBrushExtent(null)
        return
      }

      const scaled = (selection as [number, number]).map(xScale.invert) as [number, number]

      // avoid infinite render loop by checking for change
      if (type === 'end' && !compare(brushExtent, scaled, xScale)) {
        setBrushExtent(scaled, mode)
      }

      setLocalBrushExtent(scaled)
    },
    [xScale, brushExtent, setBrushExtent],
  )

  // keep local and external brush extent in sync
  // i.e. snap to ticks on bruhs end
  useEffect(() => {
    setLocalBrushExtent(brushExtent)
  }, [brushExtent])

  // initialize the brush
  useEffect(() => {
    if (!brushRef.current) return

    brushBehavior.current = brushX<SVGGElement>()
      .extent([
        [Math.max(0 + BRUSH_EXTENT_MARGIN_PX, xScale(0)), 0],
        [innerWidth - BRUSH_EXTENT_MARGIN_PX, innerHeight],
      ])
      .handleSize(30)
      .filter(() => interactive)
      .on('brush end', brushed)

    brushBehavior.current(select(brushRef.current))

    if (previousBrushExtent && compare(brushExtent, previousBrushExtent, xScale)) {
      select(brushRef.current)
        .transition()
        .call(brushBehavior.current.move as any, brushExtent.map(xScale))
    }

    // brush linear gradient
    select(brushRef.current)
      .selectAll('.selection')
      .attr('stroke', 'none')
      .attr('fill-opacity', '0.1')
      .attr('fill', `url(#${id}-gradient-selection)`)
      .attr('cursor', 'default')

    select(brushRef.current).selectAll('.overlay').attr('cursor', 'default')
    select(brushRef.current).selectAll('.handle').attr('cursor', 'default')
  }, [brushExtent, brushed, id, innerHeight, innerWidth, interactive, previousBrushExtent, xScale])

  // respond to xScale changes only
  useEffect(() => {
    if (!brushRef.current || !brushBehavior.current) return

    brushBehavior.current.move(select(brushRef.current) as any, brushExtent.map(xScale) as any)
  }, [brushExtent, xScale])

  // show labels when local brush changes
  useEffect(() => {
    setShowLabels(true)
    const timeout = setTimeout(() => setShowLabels(false), 1500)
    return () => clearTimeout(timeout)
  }, [localBrushExtent])

  // variables to help render the SVGs
  const flipWestHandle = localBrushExtent && xScale(localBrushExtent[0]) > FLIP_HANDLE_THRESHOLD_PX
  const flipEastHandle = localBrushExtent && xScale(localBrushExtent[1]) > innerWidth - FLIP_HANDLE_THRESHOLD_PX

  const showWestArrow = localBrushExtent && (xScale(localBrushExtent[0]) < 0 || xScale(localBrushExtent[1]) < 0)
  const showEastArrow =
    localBrushExtent && (xScale(localBrushExtent[0]) > innerWidth || xScale(localBrushExtent[1]) > innerWidth)

  const westHandleInView =
    localBrushExtent && xScale(localBrushExtent[0]) >= 0 && xScale(localBrushExtent[0]) <= innerWidth
  const eastHandleInView =
    localBrushExtent && xScale(localBrushExtent[1]) >= 0 && xScale(localBrushExtent[1]) <= innerWidth

  return useMemo(
    () => (
      <>
        <g
          ref={brushRef}
          clipPath={`url(#${id}-brush-clip)`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        />

        {localBrushExtent && (
          <>
            {westHandleInView ? (
              <g
                transform={`translate(${Math.max(0, xScale(localBrushExtent[0]))}, 0), scale(${
                  flipWestHandle ? '-1' : '1'
                }, 1)`}
              >
                <g>
                  <path
                    d={brushHandlePath(innerHeight)}
                    strokeWidth={2}
                    pointerEvents={'none'}
                    stroke={theme.primary}
                    fill={'transparent'}
                  />
                </g>

                <StyledG
                  transform={`translate(50,0), scale(${flipWestHandle ? '1' : '-1'}, 1)`}
                  opacity={showLabels || hovering ? 1 : 0}
                >
                  <rect y="0" x="-30" height="30" width="60" rx="8" fill={'transparent'} />

                  <text
                    transform="scale(-1, 1)"
                    y="15"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize="13px"
                    fill={theme.subText}
                  >
                    {brushLabelValue('w', localBrushExtent[0])}
                  </text>
                </StyledG>
              </g>
            ) : null}

            {eastHandleInView ? (
              <g transform={`translate(${xScale(localBrushExtent[1])}, 0), scale(${flipEastHandle ? '-1' : '1'}, 1)`}>
                <g>
                  <path
                    d={brushHandlePath(innerHeight)}
                    strokeWidth={2}
                    pointerEvents={'none'}
                    stroke={'#7289DA'}
                    fill={'transparent'}
                  />
                </g>

                <StyledG
                  transform={`translate(50,0), scale(${flipEastHandle ? '-1' : '1'}, 1)`}
                  opacity={showLabels || hovering ? 1 : 0}
                >
                  <rect y="0" x="-30" height="30" width="60" rx="8" fill={'transparent'} />

                  <text y="15" dominantBaseline="middle" fontSize="13px" textAnchor="middle" fill={theme.subText}>
                    {brushLabelValue('e', localBrushExtent[1])}
                  </text>
                </StyledG>
              </g>
            ) : null}

            {showWestArrow && <OffScreenHandle size={4} color={theme.primary} />}

            {showEastArrow && (
              <g transform={`translate(${innerWidth}, 0) scale(-1, 1)`}>
                <OffScreenHandle size={4} color={'#7289DA'} />
              </g>
            )}
          </>
        )}
      </>
    ),
    [
      id,
      innerWidth,
      innerHeight,
      localBrushExtent,
      westHandleInView,
      xScale,
      flipWestHandle,
      theme.primary,
      theme.subText,
      showLabels,
      hovering,
      brushLabelValue,
      eastHandleInView,
      flipEastHandle,
      showWestArrow,
      showEastArrow,
    ],
  )
}
