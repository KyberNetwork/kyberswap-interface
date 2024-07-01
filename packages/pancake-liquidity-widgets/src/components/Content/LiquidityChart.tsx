import { nearestUsableTick } from "@pancakeswap/v3-sdk";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { Type, useZapState } from "../../hooks/useZapInState";
import { tryParseTick } from "../../utils/pancakev3";
import { LiquidityChartRangeInput } from "../LiquidityChartRangeInput";
import { useDensityChartData } from "../LiquidityChartRangeInput/hooks";

export default function LiquidityChart() {
  const { pool, position } = useWidgetInfo();
  const { priceLower, priceUpper, revertPrice, tickLower, tickUpper, setTick } =
    useZapState();

  const {
    isLoading: isChartDataLoading,
    // error: chartDataError,
    formattedData,
  } = useDensityChartData();

  const price =
    pool &&
    (revertPrice ? pool.priceOf(pool.token1) : pool.priceOf(pool.token0));

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      key={pool?.token0?.address}
      currencyA={revertPrice ? pool?.token1 : pool?.token0}
      currencyB={revertPrice ? pool?.token0 : pool?.token1 ?? undefined}
      feeAmount={pool?.fee}
      ticksAtLimit={{
        LOWER: pool?.minTick === tickLower,
        UPPER: pool?.maxTick === tickUpper,
      }}
      price={price ? parseFloat(price.toSignificant(8)) : undefined}
      priceLower={priceLower || undefined}
      priceUpper={priceUpper || undefined}
      onBothRangeInput={(l, r) => {
        if (!pool || position) return
        const tickLower = tryParseTick(
          revertPrice ? pool?.token1 : pool?.token0,
          revertPrice ? pool?.token0 : pool?.token1,
          pool.fee,
          l
        );
        const tickUpper = tryParseTick(
          revertPrice ? pool?.token1 : pool?.token0,
          revertPrice ? pool?.token0 : pool?.token1,

          pool.fee,
          r
        );

        if (tickUpper)
          setTick(
            Type.PriceUpper,
            nearestUsableTick(tickUpper, pool.tickSpacing)
          );
        if (tickLower)
          setTick(
            Type.PriceLower,
            nearestUsableTick(tickLower, pool.tickSpacing)
          );
      }}
      onLeftRangeInput={(value) => {
        if (!pool || position) return
        const tick = tryParseTick(
          revertPrice ? pool.token1 : pool.token0,
          revertPrice ? pool.token0 : pool.token1,
          pool?.fee,
          value
        );
        if (tick)
          setTick(Type.PriceLower, nearestUsableTick(tick, pool.tickSpacing));
      }}
      onRightRangeInput={(value) => {
        if (!pool || position) return
        const tick = tryParseTick(
          revertPrice ? pool.token1 : pool.token0,
          revertPrice ? pool.token0 : pool.token1,
          pool?.fee,
          value
        );
        if (tick)
          setTick(Type.PriceUpper, nearestUsableTick(tick, pool.tickSpacing));
      }}
      formattedData={formattedData}
      isLoading={isChartDataLoading}
      error={undefined}
      interactive={!position}
    />
  );
}
