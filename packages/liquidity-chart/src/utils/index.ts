import type { ScaleLinear } from 'd3';

import { tickToPrice } from '@kyber/utils/uniswapv3';

import { PRICE_FIXED_DIGITS } from '@/constants';
import type { TickDataRaw, TickProcessed } from '@/types';

// Computes the numSurroundingTicks above or below the active tick.
export const computeSurroundingTicks = (
  token0decimals: number,
  token1decimal: number,
  activeTickProcessed: TickProcessed,
  sortedTickData: TickDataRaw[],
  pivot: number,
  ascending: boolean,
  revert: boolean,
): TickProcessed[] => {
  let previousTickProcessed: TickProcessed = {
    ...activeTickProcessed,
  };

  // Iterate outwards (either up or down depending on direction) from the active tick,
  // building active liquidity for every tick.
  let processedTicks: TickProcessed[] = [];

  for (let i = pivot + (ascending ? 1 : -1); ascending ? i < sortedTickData.length : i >= 0; ascending ? i++ : i--) {
    const tick = Number(sortedTickData[i].index);
    const currentTickProcessed: TickProcessed = {
      liquidityActive: previousTickProcessed.liquidityActive,
      tick,
      liquidityNet: BigInt(sortedTickData[i].liquidityNet),
      price: Number(tickToPrice(tick, token0decimals, token1decimal, revert)).toFixed(PRICE_FIXED_DIGITS),
    };

    // Update the active liquidity.
    // If we are iterating ascending and we found an initialized tick we immediately apply
    // it to the current processed tick we are building.
    // If we are iterating descending, we don't want to apply the net liquidity until the following tick.
    if (ascending) {
      currentTickProcessed.liquidityActive =
        previousTickProcessed.liquidityActive + BigInt(sortedTickData[i].liquidityNet);
    } else if (previousTickProcessed.liquidityNet !== 0n) {
      // We are iterating descending, so look at the previous tick and apply any net liquidity.
      currentTickProcessed.liquidityActive = previousTickProcessed.liquidityActive - previousTickProcessed.liquidityNet;
    }

    processedTicks.push(currentTickProcessed);
    previousTickProcessed = currentTickProcessed;
  }

  if (!ascending) processedTicks = processedTicks.reverse();

  return processedTicks;
};

/**
 * Returns true if every element in `a` maps to the
 * same pixel coordinate as elements in `b`
 */
export const compare = (a: [number, number], b: [number, number], xScale: ScaleLinear<number, number>): boolean => {
  // normalize pixels to 1 decimals
  const aNorm = a.map(x => xScale(x).toFixed(1));
  const bNorm = b.map(x => xScale(x).toFixed(1));
  return aNorm.every((v, i) => v === bNorm[i]);
};
