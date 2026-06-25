import { useMemo } from 'react';

import { MIN_TICK, tickToPrice } from '@kyber/utils/uniswapv3';

import { PRICE_FIXED_DIGITS } from '@/constants';
import { type PoolInfo, type TickProcessed } from '@/types';
import { computeSurroundingTicks } from '@/utils';

export default function usePoolActiveLiquidity({ pool, revertPrice }: { pool: PoolInfo; revertPrice: boolean }) {
  const { tickCurrent, tickSpacing, ticks, liquidity, token0, token1 } = pool;

  return useMemo(() => {
    if (tickCurrent === undefined || !tickSpacing || !ticks || !ticks.length || !token0 || !token1) return [];

    // The pivot search and the outward liquidity accumulation both assume `ticks` is ordered
    // ascending by tick index with no duplicate indices. Defensively normalise the input here
    // (never mutate the source array — it may be a frozen RTK Query / Redux value):
    //   1. de-duplicate by tick index so a repeated tick cannot double-count its liquidityNet, then
    //   2. sort with a NUMERIC comparator (`index` can be a string, so a default sort would order it
    //      lexicographically).
    // Both steps are no-ops when the API data is already clean, and prevent an imbalanced
    // accumulation — the root cause of liquidity bars rendering below the x-axis — when it is not.
    const sortedTicks = Array.from(new Map(ticks.map(t => [Number(t.index), t])).values()).sort(
      (a, b) => Number(a.index) - Number(b.index),
    );

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing;
    const finalActiveTick = tickCurrent < 0 && activeTick < MIN_TICK ? activeTick + tickSpacing : activeTick;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    let pivot = sortedTicks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1;
    if (pivot < 0) pivot = sortedTicks.length - 1;

    let activeTickProcessed: TickProcessed | undefined;

    try {
      activeTickProcessed = {
        liquidityActive: BigInt(liquidity),
        tick: finalActiveTick,
        liquidityNet: BigInt(sortedTicks[pivot].liquidityNet),
        price: Number(tickToPrice(finalActiveTick, token0.decimals, token1.decimals, revertPrice)).toFixed(
          PRICE_FIXED_DIGITS,
        ),
      };
    } catch (error) {
      console.error(error);
    }

    if (!activeTickProcessed) return [];

    const subsequentTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      sortedTicks,
      pivot,
      true,
      revertPrice,
    );
    const previousTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      sortedTicks,
      pivot,
      false,
      revertPrice,
    );
    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks);

    return ticksProcessed;
  }, [liquidity, revertPrice, tickCurrent, tickSpacing, ticks, token0, token1]);
}
