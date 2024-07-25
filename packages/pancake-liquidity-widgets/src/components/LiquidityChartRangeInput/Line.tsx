import { ScaleLinear } from "d3";
import { useMemo } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";

export const Line = ({
  value,
  xScale,
  innerHeight,
}: {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}) => {
  const { theme } = useWidgetInfo();
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
          stroke: theme.secondary,
        }}
      />
    ),
    [value, xScale, innerHeight, theme.secondary]
  );
};
