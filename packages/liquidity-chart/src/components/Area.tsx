import { useMemo } from 'react';

import { area, curveStepAfter } from 'd3';

import type { AreaProps, ChartEntry } from '@/types';

export default function Area({ series, xScale, yScale, xValue, yValue, fill, opacity }: AreaProps) {
  return useMemo(
    () => (
      <path
        d={
          area()
            .curve(curveStepAfter)
            .x((d: unknown) => xScale(xValue(d as ChartEntry)))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(
            series.filter(d => {
              const value = xScale(xValue(d));
              return value > 0 && value <= window.innerWidth;
            }) as Iterable<[number, number]>,
          ) ?? undefined
        }
        fill={fill}
        opacity={opacity || 1}
        stroke={fill}
      />
    ),
    [fill, opacity, series, xScale, xValue, yScale, yValue],
  );
}
