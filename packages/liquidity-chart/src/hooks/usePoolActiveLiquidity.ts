import { useMemo } from 'react';

import { MIN_TICK, tickToPrice } from '@kyber/utils/uniswapv3';

import { PRICE_FIXED_DIGITS } from '@/constants';
import { type PoolInfo, type TickProcessed } from '@/types';
import { computeSurroundingTicks } from '@/utils';

export default function usePoolActiveLiquidity({ pool, revertPrice }: { pool: PoolInfo; revertPrice: boolean }) {
  const { tickCurrent, tickSpacing, ticks, liquidity, token0, token1 } = pool;

  return useMemo(() => {
    if ((!tickCurrent && tickCurrent !== 0) || !tickSpacing || !ticks || !ticks.length || !token0 || !token1) return [];

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing;
    const finalActiveTick = tickCurrent < 0 && activeTick < MIN_TICK ? activeTick + tickSpacing : activeTick;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    let pivot = ticks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1;
    pivot = pivot <= -1 ? ticks.length - 1 : pivot === 0 ? 0 : pivot - 1;

    let activeTickProcessed: TickProcessed | undefined;

    try {
      activeTickProcessed = {
        liquidityActive: BigInt(liquidity),
        tick: finalActiveTick,
        liquidityNet: Number(ticks[pivot].index) === finalActiveTick ? BigInt(ticks[pivot].liquidityNet) : 0n,
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
      ticks,
      pivot,
      true,
      revertPrice,
    );
    const previousTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      ticks,
      pivot,
      false,
      revertPrice,
    );
    const ticksProcessed = previousTicks.concat(activeTickProcessed).concat(subsequentTicks);

    return ticksProcessed;
  }, [liquidity, revertPrice, tickCurrent, tickSpacing, ticks, token0, token1]);
}
