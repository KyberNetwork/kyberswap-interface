import { useMemo } from 'react';

import type { NumberValue, Axis as d3Axis } from 'd3';
import { axisBottom, select } from 'd3';

import { formatDisplayNumber } from '@kyber/utils/number';

import type { AxisBottomProps } from '@/types';

export default function AxisBottom({ xScale, innerHeight, offset = 0 }: AxisBottomProps) {
  return useMemo(
    () => (
      <g className="group" transform={`translate(0, ${innerHeight + offset})`}>
        <Axis
          axisGenerator={axisBottom(xScale)
            .ticks(6)
            .tickFormat(value => formatDisplayNumber(Number(value), { significantDigits: 8 }))}
        />
      </g>
    ),
    [innerHeight, offset, xScale],
  );
}

const Axis = ({ axisGenerator }: { axisGenerator: d3Axis<NumberValue> }) => {
  const axisRef = (axis: SVGGElement) => {
    select(axis)
      .call(axisGenerator)
      .call(g => g.select('.domain').attr('color', '#064E38').attr('stroke-width', 1.5))
      .call(g => g.selectAll('.tick line').attr('color', 'transparent'))
      .call(g => g.selectAll('.tick text').attr('color', '#979797'));
  };

  return <g ref={axisRef} />;
};
