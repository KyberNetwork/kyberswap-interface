import { useMemo } from "react";
import type { LineProps } from "@/types";

export default function Line({ value, xScale, innerHeight }: LineProps) {
  return useMemo(
    () => (
      <line
        className="opacity-50 stroke-2 stroke-white"
        x1={xScale(value)}
        x2={xScale(value)}
        y1="0"
        y2={innerHeight}
      />
    ),
    [value, xScale, innerHeight]
  );
}
