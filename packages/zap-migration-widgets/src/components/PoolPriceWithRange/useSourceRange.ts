import { useMemo } from 'react';

import { UniV3Pool, UniV3Position, univ3Types } from '@kyber/schema';
import { MAX_TICK, MIN_TICK, nearestUsableTick, tickToPrice } from '@kyber/utils/uniswapv3';

import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

// only use this hook in reposition
export default function useSourceRange() {
  const { sourcePoolType } = useWidgetStore(['sourcePoolType']);
  const { sourcePool, revertPrice } = usePoolStore(['sourcePool', 'revertPrice']);
  const { sourcePosition } = usePositionStore(['sourcePosition']);

  const { token0 = null, token1 = null } = sourcePool || {};

  const isUniV3 = univ3Types.includes(sourcePoolType as any);
  const tickLower = !isUniV3 || !sourcePosition ? null : (sourcePosition as UniV3Position).tickLower;
  const tickUpper = !isUniV3 || !sourcePosition ? null : (sourcePosition as UniV3Position).tickUpper;

  const minPrice = useMemo(() => {
    if (!token0 || !token1 || !isUniV3 || tickLower === null || tickUpper === null) return null;

    return tickToPrice(!revertPrice ? tickLower : tickUpper, token0.decimals, token1.decimals, revertPrice);
  }, [isUniV3, revertPrice, tickLower, tickUpper, token0, token1]);

  const maxPrice = useMemo(() => {
    if (!token0 || !token1 || !isUniV3 || tickLower === null || tickUpper === null) return null;

    return tickToPrice(!revertPrice ? tickUpper : tickLower, token0.decimals, token1.decimals, revertPrice);
  }, [isUniV3, revertPrice, tickLower, tickUpper, token0, token1]);

  const isMinTick =
    !!sourcePool && isUniV3 && tickLower === nearestUsableTick(MIN_TICK, (sourcePool as UniV3Pool).tickSpacing);
  const isMaxTick =
    !!sourcePool && isUniV3 && tickUpper === nearestUsableTick(MAX_TICK, (sourcePool as UniV3Pool).tickSpacing);

  return {
    minPrice,
    maxPrice,
    isMinTick,
    isMaxTick,
  };
}
