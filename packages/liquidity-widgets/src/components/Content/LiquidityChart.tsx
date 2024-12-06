import { useZapState } from "../../hooks/useZapInState";
import { LiquidityChartRangeInput } from "../LiquidityChartRangeInput";
import { useDensityChartData } from "../LiquidityChartRangeInput/hooks";
import { useWidgetContext } from "@/stores/widget";
import {
  MAX_TICK,
  MIN_TICK,
  nearestUsableTick,
  tickToPrice,
} from "@kyber/utils/uniswapv3";

export default function LiquidityChart() {
  const { pool, position, positionId } = useWidgetContext((s) => s);
  const { priceLower, priceUpper, revertPrice, tickLower, tickUpper } =
    useZapState();

  const {
    isLoading: isChartDataLoading,
    // error: chartDataError,
    formattedData,
  } = useDensityChartData();

  const price =
    pool !== "loading" &&
    tickToPrice(
      pool.tick,
      pool.token0.decimals,
      pool.token1.decimals,
      revertPrice
    );

  const token0 = pool === "loading" ? null : pool.token0;
  const token1 = pool === "loading" ? null : pool.token1;

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      key={token0?.address}
      currencyA={revertPrice ? token1 : token0}
      currencyB={revertPrice ? token0 : token1 ?? undefined}
      feeAmount={pool === "loading" ? 2500 : pool.fee * 10_000}
      ticksAtLimit={{
        LOWER:
          pool !== "loading" &&
          nearestUsableTick(MIN_TICK, pool.tickSpacing) === tickLower,
        UPPER:
          pool !== "loading" &&
          nearestUsableTick(MAX_TICK, pool.tickSpacing) === tickUpper,
      }}
      price={price ? parseFloat(price) : undefined}
      priceLower={priceLower || undefined}
      priceUpper={priceUpper || undefined}
      onBothRangeInput={(l, r) => {
        if (pool === "loading" || positionId !== undefined) return;
        // TODO: Implement this function
        console.log(l, r);

        //const tickLower = tryParseTick(
        //  poolType,
        //  revertPrice ? token1 : token0,
        //  revertPrice ? token0 : token1,
        //  pool.fee,
        //  l
        //);
        //const tickUpper = tryParseTick(
        //  poolType,
        //  revertPrice ? pool?.token1 : pool?.token0,
        //  revertPrice ? pool?.token0 : pool?.token1,
        //
        //  pool.fee,
        //  r
        //);
        //
        //if (tickUpper)
        //  setTick(
        //    Type.PriceUpper,
        //    nearestUsableTick(poolType, tickUpper, pool.tickSpacing)
        //  );
        //if (tickLower)
        //  setTick(
        //    Type.PriceLower,
        //    nearestUsableTick(poolType, tickLower, pool.tickSpacing)
        //  );
      }}
      onLeftRangeInput={(value) => {
        if (pool === "loading" || positionId !== undefined) return;
        // TODO: Implement this function
        console.log(value);

        //const tick = tryParseTick(
        //  poolType,
        //  revertPrice ? pool.token1 : pool.token0,
        //  revertPrice ? pool.token0 : pool.token1,
        //  pool?.fee,
        //  value
        //);
        //if (tick)
        //  setTick(
        //    Type.PriceLower,
        //    nearestUsableTick(poolType, tick, pool.tickSpacing)
        //  );
      }}
      onRightRangeInput={(value) => {
        if (pool === "loading" || positionId !== undefined) return;
        // TODO: Implement this function
        console.log(value);
        //const tick = tryParseTick(
        //  poolType,
        //  revertPrice ? pool.token1 : pool.token0,
        //  revertPrice ? pool.token0 : pool.token1,
        //  pool?.fee,
        //  value
        //);
        //if (tick)
        //  setTick(
        //    Type.PriceUpper,
        //    nearestUsableTick(poolType, tick, pool.tickSpacing)
        //  );
      }}
      formattedData={formattedData}
      isLoading={isChartDataLoading}
      error={undefined}
      interactive={!position}
    />
  );
}
