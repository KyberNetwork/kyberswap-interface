import { ScaleLinear } from "d3";
import { useMemo } from "react";
import { useWidgetContext } from "@/stores/widget";

export const Line = ({
  value,
  xScale,
  innerHeight,
}: {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}) => {
  const theme = useWidgetContext((s) => s.theme);
  return useMemo(
    () => (
      <line
        x1={xScale(value)}
        y1="0"
        x2={xScale(value)}
        y2={innerHeight}
        style={{
          opacity: 0.5,
          strokeWidth: 2,
          stroke: theme.accent,
        }}
      />
    ),
    [value, xScale, innerHeight, theme.accent]
  );
};
