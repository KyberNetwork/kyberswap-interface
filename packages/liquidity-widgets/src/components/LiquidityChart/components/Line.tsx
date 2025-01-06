import { ScaleLinear } from "d3";
import { useMemo } from "react";

export const Line = ({
  value,
  xScale,
  innerHeight,
}: {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}) => {
  return useMemo(
    () => (
      <line
        x1={xScale(value)}
        y1="0"
        x2={xScale(value)}
        y2={innerHeight}
        className="opacity-50 stroke-2 stroke-white"
      />
    ),
    [value, xScale, innerHeight]
  );
};
