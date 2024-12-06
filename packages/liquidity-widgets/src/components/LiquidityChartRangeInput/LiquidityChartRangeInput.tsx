import { format } from "d3";
import { saturate } from "polished";
import { useCallback, useMemo } from "react";

import { Chart } from "./Chart";
import { InfoBox } from "./InfoBox";
import Loader from "./Loader";
import {
  Bound,
  ChartEntry,
  TickDataRaw,
  ZOOM_LEVELS,
  ZoomLevels,
} from "./types";
import { useZapState } from "../../hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import { Token } from "@/schema";

export function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit = {},
  price,
  priceLower,
  priceUpper,
  onBothRangeInput = () => {
    // default
  },
  onLeftRangeInput = () => {
    // default
  },
  onRightRangeInput = () => {
    // default
  },
  interactive = true,
  isLoading,
  error,
  zoomLevel,
  formattedData,
}: {
  tickCurrent?: number;
  liquidity?: bigint;
  isLoading?: boolean;
  error?: Error;
  currencyA?: Token | null;
  currencyB?: Token | null;
  feeAmount?: number;
  ticks?: TickDataRaw[];
  ticksAtLimit?: { [bound in Bound]?: boolean };
  price?: number;
  priceLower?: string;
  priceUpper?: string;
  onLeftRangeInput?: (typedValue: string) => void;
  onRightRangeInput?: (typedValue: string) => void;
  onBothRangeInput?: (leftTypedValue: string, rightTypedValue: string) => void;
  interactive?: boolean;
  zoomLevel?: ZoomLevels;
  formattedData: ChartEntry[] | undefined;
}) {
  const theme = useWidgetContext((s) => s.theme);

  // Get token color
  const tokenAColor = "#7645D9";
  const tokenBColor = "#7645D9";

  const { revertPrice } = useZapState();
  const isSorted = !revertPrice;

  const brushDomain: [number, number] | undefined = useMemo(() => {
    // TODO: handle chart
    const leftPrice = isSorted ? priceLower : priceUpper;
    const rightPrice = isSorted ? priceUpper : priceLower;

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice), parseFloat(rightPrice)]
      : undefined;
  }, [isSorted, priceLower, priceUpper]);

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      const [leftPrice, rightPrice] = brushDomain || [];

      let leftRangeValue = Number(domain[0]);
      const rightRangeValue = Number(domain[1]);

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6;
      }

      const updateLeft =
        (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] ||
          mode === "handle" ||
          mode === "reset") &&
        leftRangeValue > 0 &&
        leftRangeValue !== leftPrice;

      const updateRight =
        (!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] ||
          mode === "reset") &&
        rightRangeValue > 0 &&
        rightRangeValue < 1e35 &&
        rightRangeValue !== rightPrice;

      if (updateLeft && updateRight) {
        const parsedLeftRangeValue = parseFloat(leftRangeValue.toFixed(18));
        const parsedRightRangeValue = parseFloat(rightRangeValue.toFixed(18));
        if (
          parsedLeftRangeValue > 0 &&
          parsedRightRangeValue > 0 &&
          parsedLeftRangeValue < parsedRightRangeValue
        ) {
          onBothRangeInput?.(
            leftRangeValue.toFixed(18),
            rightRangeValue.toFixed(18)
          );
        }
      } else if (updateLeft) {
        onLeftRangeInput?.(leftRangeValue.toFixed(18));
      } else if (updateRight) {
        onRightRangeInput?.(rightRangeValue.toFixed(18));
      }
    },
    [
      isSorted,
      onBothRangeInput,
      onLeftRangeInput,
      onRightRangeInput,
      ticksAtLimit,
      brushDomain,
    ]
  );

  const brushLabelValue = useCallback(
    (d: "w" | "e", x: number) => {
      if (!price) return "";

      if (d === "w" && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER])
        return "0";
      if (d === "e" && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER])
        return "∞";

      const percent =
        (x < price ? -1 : 1) *
        ((Math.max(x, price) - Math.min(x, price)) / price) *
        100;

      return price
        ? `${format(Math.abs(percent) > 1 ? ".2~s" : ".2~f")(percent)}%`
        : "";
    },
    [isSorted, price, ticksAtLimit]
  );

  const isUninitialized =
    !currencyA || !currencyB || (formattedData === undefined && !isLoading);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: "200px",
        width: "100%",
        marginTop: "8px",
        gap: "1rem",
        justifyContent: "center",
      }}
    >
      {isUninitialized ? (
        <InfoBox
          message={"Your position will appear here."}
          icon={<div></div>}
        />
      ) : isLoading ? (
        <InfoBox icon={<Loader size="40px" stroke={theme.text} />} />
      ) : error ? (
        <InfoBox message={"Liquidity data not available."} icon={<div></div>} />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox message={"There is no liquidity data."} icon={<div></div>} />
      ) : (
        <div
          style={{
            position: "relative",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Chart
            key={`${feeAmount ?? 2500}`}
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: theme.text,
              },
              brush: {
                handle: {
                  west: saturate(0.1, tokenAColor) ?? theme.text,
                  east: saturate(0.1, tokenBColor) ?? theme.text,
                },
              },
            }}
            interactive={interactive && Boolean(formattedData?.length)}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={zoomLevel ?? ZOOM_LEVELS[feeAmount ?? 2500]}
            ticksAtLimit={ticksAtLimit}
          />
        </div>
      )}
    </div>
  );
}
