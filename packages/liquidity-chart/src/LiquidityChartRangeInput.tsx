import { useCallback, useMemo } from "react";
import { format } from "d3";
import type { LiquidityChartRangeInputProps } from "./types";
import { Bound } from "@/types";
import { DEFAULT_DIMENSIONS, DEFAULT_MARGINS, ZOOM_LEVELS } from "@/constants";
import Chart from "@/components/Chart";
import InfoBox from "@/components/InfoBox";
import useDensityChartData from "@/hooks/useDensityChartData";
import "./styles.css";
import { getFeeRange } from "./utils";

export default function LiquidityChartRangeInput({
  id,
  price,
  pool,
  ticksAtLimit,
  revertPrice,
  dimensions,
  margins,
  zoomPosition,
  zoomInIcon,
  zoomOutIcon,
  onBrushDomainChange,
}: LiquidityChartRangeInputProps) {
  const chartData = useDensityChartData({ pool, revertPrice });

  const { current: currentPrice, lower: priceLower, upper: priceUpper } = price;
  const feeRange = getFeeRange(pool.fee || 0);

  const brushDomain: [number, number] | undefined = useMemo(() => {
    if (!priceLower || !priceUpper) return;

    const leftPrice = !revertPrice ? priceLower : priceUpper;
    const rightPrice = !revertPrice ? priceUpper : priceLower;

    return leftPrice && rightPrice
      ? [
          parseFloat(leftPrice.toString().replace(/,/g, "")),
          parseFloat(rightPrice.toString().replace(/,/g, "")),
        ]
      : undefined;
  }, [priceLower, priceUpper, revertPrice]);

  const brushLabel = useCallback(
    (d: "w" | "e", x: number) => {
      if (!currentPrice) return "";

      if (d === "w" && ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER])
        return "0";
      if (d === "e" && ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER])
        return "∞";

      const percent =
        (x < currentPrice ? -1 : 1) *
        ((Math.max(x, currentPrice) - Math.min(x, currentPrice)) /
          currentPrice) *
        100;

      return currentPrice
        ? `${format(Math.abs(percent) > 1 ? ".2~s" : ".2~f")(percent)}%`
        : "";
    },
    [currentPrice, ticksAtLimit, revertPrice]
  );

  const defaultZoomLevels = useMemo(() => {
    if (onBrushDomainChange) return ZOOM_LEVELS[feeRange];
    if (!priceLower || !priceUpper || !currentPrice) return;

    const leftPrice = parseFloat(
      (!revertPrice ? priceLower : priceUpper).toString().replace(/,/g, "")
    );
    const rightPrice = parseFloat(
      (!revertPrice ? priceUpper : priceLower).toString().replace(/,/g, "")
    );
    const priceToCalculate =
      ticksAtLimit[Bound.UPPER] ||
      Math.abs(currentPrice - leftPrice) > Math.abs(currentPrice - rightPrice)
        ? leftPrice
        : rightPrice;

    const ratio = Math.abs(
      (7 * (currentPrice - priceToCalculate)) / (5 * currentPrice)
    );

    return {
      initialMin: 1 - ratio,
      initialMax: 1 + ratio,
      min: 0.00001,
      max: 20,
    };
  }, [
    onBrushDomainChange,
    priceLower,
    priceUpper,
    currentPrice,
    revertPrice,
    ticksAtLimit,
    feeRange,
  ]);

  return (
    <div className="ks-lc-style" style={{ width: "100%" }}>
      <div className="flex items-center min-h-52 w-full gap-4 justify-center">
        {!chartData || !defaultZoomLevels ? (
          <InfoBox message="Your position will appear here." />
        ) : chartData.length === 0 || !currentPrice ? (
          <InfoBox message="There is no liquidity data." />
        ) : (
          <div className="relative flex justify-center items-center w-full">
            <Chart
              brushDomain={brushDomain}
              brushLabels={brushLabel}
              data={{ series: chartData, current: currentPrice }}
              dimensions={{ ...DEFAULT_DIMENSIONS, ...(dimensions || {}) }}
              id={id}
              margins={{ ...DEFAULT_MARGINS, ...(margins || {}) }}
              onBrushDomainChange={onBrushDomainChange}
              zoomInIcon={zoomInIcon}
              zoomLevels={defaultZoomLevels}
              zoomOutIcon={zoomOutIcon}
              zoomPosition={zoomPosition}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { Bound };
