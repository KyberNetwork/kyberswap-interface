import { useEffect, useMemo, useRef } from 'react';

import type { ZoomBehavior, ZoomTransform } from 'd3';
import { select, zoom, zoomIdentity } from 'd3';

import RefreshIcon from '@/assets/svg/ic_refresh.svg';
import ZoomInIcon from '@/assets/svg/ic_zoom_in.svg';
import ZoomOutIcon from '@/assets/svg/ic_zoom_out.svg';
import type { ZoomProps } from '@/types';

export default function Zoom({
  svg,
  xScale,
  width,
  height,
  showResetButton,
  zoomLevels,
  zoomPosition = {
    right: '0',
    top: '-18px',
    left: undefined,
    bottom: undefined,
    gap: '6px',
  },
  zoomInIcon,
  zoomOutIcon,
  setZoom,
}: ZoomProps) {
  const zoomBehavior = useRef<ZoomBehavior<Element, unknown>>();

  const [zoomIn, zoomOut, zoomInitial, zoomReset] = useMemo(
    () => [
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 2),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleBy, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
      () =>
        svg &&
        zoomBehavior.current &&
        select(svg as Element)
          .call(zoomBehavior.current.transform, zoomIdentity.translate(0, 0).scale(1))
          .transition()
          .call(zoomBehavior.current.scaleTo, 0.5),
    ],
    [svg],
  );

  useEffect(() => {
    if (!svg) return;

    zoomBehavior.current = zoom()
      .scaleExtent([zoomLevels.min, zoomLevels.max])
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('zoom', ({ transform }: { transform: ZoomTransform }) => {
        setZoom(transform);
      });

    select(svg as Element).call(zoomBehavior.current);
  }, [height, width, setZoom, svg, xScale, zoomBehavior, zoomLevels]);

  useEffect(() => {
    // reset zoom to initial on zoomLevel change
    zoomInitial();
  }, [zoomInitial, zoomLevels]);

  return (
    <div className="flex items-center absolute" style={zoomPosition}>
      {showResetButton ? (
        <div className="cursor-pointer" onClick={zoomReset}>
          <RefreshIcon className="relative -top-[1px]" height={20} width={20} color="#A9A9A9" />
        </div>
      ) : null}
      <div className="cursor-pointer" onClick={zoomIn}>
        {zoomInIcon || <ZoomInIcon height={20} width={20} color="#A9A9A9" />}
      </div>
      <div className="cursor-pointer" onClick={zoomOut}>
        {zoomOutIcon || <ZoomOutIcon height={20} width={20} color="#A9A9A9" />}
      </div>
    </div>
  );
}
