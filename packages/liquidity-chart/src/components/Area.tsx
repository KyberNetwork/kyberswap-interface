import { useMemo } from 'react';

import { area, curveStepAfter } from 'd3';

import type { AreaProps, ChartEntry } from '@/types';

// Max pixel coordinate to prevent SVG path overflow with extreme price values
const MAX_SVG_COORD = 1e6;

export default function Area({ series, xScale, yScale, xValue, yValue, fill, opacity }: AreaProps) {
  return useMemo(
    () => (
      <path
        d={
          area()
            .curve(curveStepAfter)
            .x((d: unknown) => Math.min(Math.max(xScale(xValue(d as ChartEntry)), -MAX_SVG_COORD), MAX_SVG_COORD))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(series as Iterable<[number, number]>) ?? undefined
        }
        fill={fill}
        opacity={opacity || 1}
        stroke={fill}
      />
    ),
    [fill, opacity, series, xScale, xValue, yScale, yValue],
  );
}
