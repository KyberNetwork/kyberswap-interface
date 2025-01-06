import { useWidgetContext } from "@/stores/widget";
import { formatDisplayNumber } from "@kyber/utils/number";
import {
  Axis as d3Axis,
  axisBottom,
  NumberValue,
  ScaleLinear,
  select,
} from "d3";
import { useMemo } from "react";

const Axis = ({ axisGenerator }: { axisGenerator: d3Axis<NumberValue> }) => {
  const theme = useWidgetContext((s) => s.theme);

  const axisRef = (axis: SVGGElement) => {
    axis &&
      select(axis)
        .call(axisGenerator)
        .call((g) =>
          g.select(".domain").attr("color", "#064E38").attr("stroke-width", 1.5)
        )
        .call((g) => g.selectAll(".tick line").attr("color", "transparent"))
        .call((g) => g.selectAll(".tick text").attr("color", theme.subText));
  };

  return <g ref={axisRef} />;
};

export const AxisBottom = ({
  xScale,
  innerHeight,
  offset = 0,
}: {
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
  offset?: number;
}) =>
  useMemo(
    () => (
      <g className="group" transform={`translate(0, ${innerHeight + offset})`}>
        <Axis
          axisGenerator={axisBottom(xScale)
            .ticks(6)
            .tickFormat((value) =>
              formatDisplayNumber(Number(value), { significantDigits: 6 })
            )}
        />
      </g>
    ),
    [innerHeight, offset, xScale]
  );
