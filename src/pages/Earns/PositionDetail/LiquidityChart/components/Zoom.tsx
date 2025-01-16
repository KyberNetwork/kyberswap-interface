import { ScaleLinear, ZoomBehavior, ZoomTransform, select, zoom, zoomIdentity } from 'd3'
import { useEffect, useMemo, useRef } from 'react'
import { MinusCircle, PlusCircle } from 'react-feather'
import styled from 'styled-components'

import { ZoomLevels } from '../types'

const Container = styled.div<{ showResetButton: boolean }>`
  display: grid;
  gap: 8px;
  position: absolute;
  bottom: 38px;
  right: 8px;
  grid-template-columns: 2fr 1fr;
  ${({ showResetButton }) =>
    showResetButton
      ? 'grid-template-columns: repeat(3, minmax(0, 1fr))'
      : 'grid-template-columns: repeat(2, minmax(0, 1fr))'}
`

const ResetButton = styled.div`
  cursor: pointer;
  padding-top: 2px;
  padding-left: 1px;
`

const ZoomAction = styled.div`
  cursor: pointer;
  color: #f3f8f7;
`

export default function Zoom({
  xScale,
  setZoom,
  width,
  height,
  resetBrush,
  showResetButton,
  zoomLevels,
}: {
  xScale: ScaleLinear<number, number>
  setZoom: (transform: ZoomTransform) => void
  width: number
  height: number
  resetBrush: () => void
  showResetButton: boolean
  zoomLevels: ZoomLevels
}) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>()
  const svgRef = useRef<SVGElement | null>(null)

  const [zoomIn, zoomOut, zoomInitial, zoomReset] = useMemo(
    () => [
      () =>
        svgRef.current &&
        zoomBehavior.current &&
        select(svgRef.current as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 2),
      () =>
        svgRef.current &&
        zoomBehavior.current &&
        select(svgRef.current as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 0.5),
      () =>
        svgRef.current &&
        zoomBehavior.current &&
        select(svgRef.current as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
      () =>
        svgRef.current &&
        zoomBehavior.current &&
        select(svgRef.current as Element)
          .call(zoomBehavior.current.transform, zoomIdentity.translate(0, 0).scale(1))
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svgRef],
  )

  useEffect(() => {
    const zoomRefEl = document.querySelector('.zoomRef')
    if (!zoomRefEl) return
    svgRef.current = zoomRefEl as SVGElement

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => setZoom(transform))

    select(svgRef.current as Element).call(zoomBehavior.current)
  }, [height, width, setZoom, svgRef, xScale, zoomBehavior, zoomLevels, zoomLevels.max, zoomLevels.min])

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial()
  }, [zoomInitial, zoomLevels])

  return (
    <Container showResetButton={showResetButton}>
      {showResetButton && (
        <ResetButton>
          <div
            onClick={() => {
              resetBrush()
              zoomReset()
            }}
          >
            AutoRenewIcon
          </div>
        </ResetButton>
      )}
      <ZoomAction onClick={zoomOut}>
        <MinusCircle size={22} />
      </ZoomAction>
      <ZoomAction onClick={zoomIn}>
        <PlusCircle size={22} />
      </ZoomAction>
    </Container>
  )
}
