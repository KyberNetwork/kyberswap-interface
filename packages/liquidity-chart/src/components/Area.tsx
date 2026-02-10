import { useMemo } from 'react';

import { area, curveStepAfter } from 'd3';

import type { AreaProps, ChartEntry } from '@/types';

export default function Area({ series, xScale, yScale, xValue, yValue, fill, opacity }: AreaProps) {
  const filteredSeries = useMemo(() => {
    const innerWidth = xScale.range()[1];
    let firstInView = -1;
    let lastInView = -1;

    for (let i = 0; i < series.length; i++) {
      const value = xScale(xValue(series[i]));
      if (value >= 0 && value <= innerWidth) {
        if (firstInView === -1) firstInView = i;
        lastInView = i;
      }
    }

    if (firstInView === -1) return [];

    // Include one extra point on each side so curveStepAfter draws
    // steps that extend into the viewport from off-screen points.
    const start = Math.max(0, firstInView - 1);
    const end = Math.min(series.length - 1, lastInView + 1);

    return series.slice(start, end + 1);
  }, [series, xScale, xValue]);

  return useMemo(
    () => (
      <path
        d={
          area()
            .curve(curveStepAfter)
            .x((d: unknown) => xScale(xValue(d as ChartEntry)))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(filteredSeries as Iterable<[number, number]>) ?? undefined
        }
        fill={fill}
        opacity={opacity || 1}
        stroke={fill}
      />
    ),
    [fill, filteredSeries, opacity, xScale, xValue, yScale, yValue],
  );
}
