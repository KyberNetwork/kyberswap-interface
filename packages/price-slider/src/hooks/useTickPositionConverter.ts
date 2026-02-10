import { useCallback } from 'react';

import { nearestUsableTick } from '@kyber/utils/dist/uniswapv3';

import type { ViewRange } from '@/types';

/**
 * Hook for converting between tick and position
 * When invertPrice = true, the entire visual is flipped:
 * - Lower tick (higher inverted price) appears on the RIGHT
 * - Upper tick (lower inverted price) appears on the LEFT
 * - Axis shows inverted prices from low (left) to high (right)
 */
export const useTickPositionConverter = (viewRange: ViewRange | null, tickSpacing: number, invertPrice?: boolean) => {
  const getPositionFromTick = useCallback(
    (tick: number): number => {
      if (!viewRange) return 50;
      const { min, max } = viewRange;
      const normalPosition = ((tick - min) / (max - min)) * 100;
      // When invertPrice, flip the position so higher inverted price is on the right
      return invertPrice ? 100 - normalPosition : normalPosition;
    },
    [viewRange, invertPrice],
  );

  const getTickFromPosition = useCallback(
    (position: number): number => {
      if (!viewRange) return 0;
      const { min, max } = viewRange;
      // When invertPrice, flip the position first
      const actualPosition = invertPrice ? 100 - position : position;
      const tick = min + (actualPosition / 100) * (max - min);
      return nearestUsableTick(Math.round(tick), tickSpacing);
    },
    [viewRange, tickSpacing, invertPrice],
  );

  return { getPositionFromTick, getTickFromPosition };
};
