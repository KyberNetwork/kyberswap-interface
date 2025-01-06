import { useMemo } from "react";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { computeSurroundingTicks } from "./utils";
import { ChartEntry, TickProcessed, PRICE_FIXED_DIGITS } from "./types";

export const useDensityChartData = () => {
  const ticksProcessed = usePoolActiveLiquidity();

  const chartData = useMemo(() => {
    if (!ticksProcessed.length) {
      return undefined;
    }

    const newData: ChartEntry[] = [];

    for (let i = 0; i < ticksProcessed.length; i++) {
      const t = ticksProcessed[i];

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      };

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry);
      }
    }

    return newData;
  }, [ticksProcessed]);

  return chartData;
};

export const usePoolActiveLiquidity = () => {
  const { pool } = useWidgetContext((s) => s);
  const { revertPrice } = useZapState();

  const tickCurrent =
    pool === "loading" || !("tick" in pool) ? undefined : pool.tick;
  const tickSpacing =
    pool === "loading" || !("tickSpacing" in pool)
      ? undefined
      : pool.tickSpacing;

  return useMemo(() => {
    if (
      pool === "loading" ||
      (!tickCurrent && tickCurrent !== 0) ||
      !tickSpacing
    )
      return [];

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing;
    const ticks = !("ticks" in pool) ? [] : pool.ticks;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot =
      ticks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1;

    if (pivot < 0) {
      // consider setting a local error
      // TickData pivot not found
      return [];
    }

    const poolLiquidity = "liquidity" in pool ? pool.liquidity : 0;
    const activeTickProcessed: TickProcessed = {
      liquidityActive: BigInt(poolLiquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot].index) === activeTick
          ? BigInt(ticks[pivot].liquidityNet)
          : 0n,
      price0: Number(
        tickToPrice(
          activeTick,
          pool.token0.decimals,
          pool.token1.decimals,
          revertPrice
        )
      ).toFixed(PRICE_FIXED_DIGITS),
    };

    const subsequentTicks = computeSurroundingTicks(
      pool[revertPrice ? "token1" : "token0"].decimals,
      pool[revertPrice ? "token0" : "token1"].decimals,
      activeTickProcessed,
      ticks,
      pivot,
      true
    );
    const previousTicks = computeSurroundingTicks(
      pool[revertPrice ? "token1" : "token0"].decimals,
      pool[revertPrice ? "token0" : "token1"].decimals,
      activeTickProcessed,
      ticks,
      pivot,
      false
    );
    const ticksProcessed = previousTicks
      .concat(activeTickProcessed)
      .concat(subsequentTicks);

    return ticksProcessed;
  }, [pool, revertPrice, tickCurrent, tickSpacing]);
};
