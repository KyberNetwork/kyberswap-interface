import { useMemo } from "react";
import usePoolActiveLiquidity from "./usePoolActiveLiquidity";
import type { ChartEntry, PoolInfo } from "@/types";

export default function useDensityChartData({
  pool,
  revertPrice,
}: {
  pool: PoolInfo;
  revertPrice: boolean;
}) {
  const ticksProcessed = usePoolActiveLiquidity({
    pool,
    revertPrice,
  });

  return useMemo(() => {
    if (
      (!pool.tickCurrent && pool.tickCurrent !== 0) ||
      !pool.tickSpacing ||
      !pool.token0 ||
      !pool.token1
    )
      return;
    if (!ticksProcessed.length) return [];

    const newData: ChartEntry[] = [];

    for (const t of ticksProcessed) {
      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price: parseFloat(t.price),
      };

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry);
      }
    }

    return newData;
  }, [
    pool.tickCurrent,
    pool.tickSpacing,
    pool.token0,
    pool.token1,
    ticksProcessed,
  ]);
}
