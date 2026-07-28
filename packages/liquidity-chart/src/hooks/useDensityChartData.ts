import { useMemo } from 'react';

import type { ChartEntry, PoolInfo } from '@/types';

import usePoolActiveLiquidity from './usePoolActiveLiquidity';

export default function useDensityChartData({ pool, revertPrice }: { pool: PoolInfo; revertPrice: boolean }) {
  const ticksProcessed = usePoolActiveLiquidity({
    pool,
    revertPrice,
  });

  return useMemo(() => {
    if ((!pool.tickCurrent && pool.tickCurrent !== 0) || !pool.tickSpacing || !pool.token0 || !pool.token1) return;
    if (!ticksProcessed.length) return [];

    const newData: ChartEntry[] = [];

    for (const t of ticksProcessed) {
      const chartEntry = {
        // Active liquidity is accumulated outward from the active tick by summing each tick's
        // liquidityNet. When the API returns an incomplete/imbalanced tick window (or a `liquidity`
        // value out of sync with the ticks), the running sum can overshoot below zero at the edges.
        // Negative liquidity is physically meaningless and would render as bars below the x-axis
        // baseline, so clamp it to 0 for display.
        activeLiquidity: Math.max(0, parseFloat(t.liquidityActive.toString())),
        price: parseFloat(t.price),
      };

      newData.push(chartEntry);
    }

    return newData;
  }, [pool.tickCurrent, pool.tickSpacing, pool.token0, pool.token1, ticksProcessed]);
}
