import { useWidgetContext } from "@/stores/widget";
import { useDensityChartData } from "./hooks";
import { useZapState } from "@/hooks/useZapInState";
import { nearestUsableTick, priceToClosestTick } from "@kyber/utils/uniswapv3";
import LiquidityChartRangeInput from "./LiquidityChartRangeInput";

export default function LiquidityChart() {
  const chartData = useDensityChartData();

  const { position, pool, positionId } = useWidgetContext((s) => s);
  const { tickLower, tickUpper, revertPrice, setTickLower, setTickUpper } =
    useZapState();

  const price =
    pool !== "loading" &&
    pool.token0.price &&
    pool.token1.price &&
    (revertPrice
      ? pool.token1.price / pool.token0.price
      : pool.token0.price / pool.token1.price);

  const fee = pool === "loading" ? undefined : pool.fee * 10_000;
  const tickSpacing =
    pool === "loading" || !("tickSpacing" in pool)
      ? undefined
      : pool.tickSpacing;
  const isUninitialized = pool === "loading" || !chartData?.length;

  if (!tickSpacing) return null;

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      isUninitialized={isUninitialized}
      feeAmount={fee}
      ticksAtLimit={{
        LOWER:
          pool !== "loading" && "minTick" in pool && pool.minTick === tickLower,
        UPPER:
          pool !== "loading" && "maxTick" in pool && pool.maxTick === tickUpper,
      }}
      price={price ? parseFloat(price.toFixed(18)) : undefined}
      onBothRangeInput={(l, r) => {
        if (pool === "loading" || positionId) return;
        const tickLowerFromPrice = priceToClosestTick(
          l,
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice
        );
        const tickUpperFromPrice = priceToClosestTick(
          r,
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice
        );
        if (!tickLowerFromPrice || !tickUpperFromPrice) return;
        const tickLower = nearestUsableTick(
          Number(tickLowerFromPrice),
          tickSpacing
        );
        const tickUpper = nearestUsableTick(
          Number(tickUpperFromPrice),
          tickSpacing
        );

        if (tickUpper)
          revertPrice ? setTickLower(tickUpper) : setTickUpper(tickUpper);
        if (tickLower)
          revertPrice ? setTickUpper(tickLower) : setTickLower(tickLower);
      }}
      onLeftRangeInput={(value) => {
        if (pool === "loading" || positionId) return;
        const tickFromPrice = priceToClosestTick(
          value,
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice
        );
        if (!tickFromPrice) return;
        const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
        if (tick) revertPrice ? setTickUpper(tick) : setTickLower(tick);
      }}
      onRightRangeInput={(value) => {
        if (pool === "loading" || positionId) return;
        const tickFromPrice = priceToClosestTick(
          value,
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice
        );
        if (!tickFromPrice) return;
        const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
        if (tick) revertPrice ? setTickLower(tick) : setTickUpper(tick);
      }}
      formattedData={chartData}
      isLoading={false}
      error={undefined}
      interactive={position === "loading"}
    />
  );
}
