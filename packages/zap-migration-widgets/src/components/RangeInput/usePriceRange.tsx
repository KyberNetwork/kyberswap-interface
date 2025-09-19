import { useMemo } from 'react';

import { UniV3Pool, univ3Types } from '@kyber/schema';
import { MAX_TICK, MIN_TICK, nearestUsableTick, tickToPrice } from '@kyber/utils/uniswapv3';

import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function usePriceRange() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPool, revertPrice } = usePoolStore(['targetPool', 'revertPrice']);
  const { tickLower, tickUpper } = useZapStore(['tickLower', 'tickUpper']);

  const { token0 = null, token1 = null } = targetPool || {};

  const minPrice = useMemo(() => {
    if (!token0 || !token1 || tickLower === null || tickUpper === null) return null;
    return tickToPrice(!revertPrice ? tickLower : tickUpper, token0.decimals, token1.decimals, revertPrice);
  }, [token0, token1, tickLower, tickUpper, revertPrice]);

  const maxPrice = useMemo(() => {
    if (!token0 || !token1 || tickUpper === null || tickLower === null) return null;
    return tickToPrice(!revertPrice ? tickUpper : tickLower, token0.decimals, token1.decimals, revertPrice);
  }, [token0, token1, tickUpper, tickLower, revertPrice]);

  const isTargetUniV3 = univ3Types.includes(targetPoolType as any);
  const isMinTick =
    !!targetPool && isTargetUniV3 && tickLower === nearestUsableTick(MIN_TICK, (targetPool as UniV3Pool).tickSpacing);
  const isMaxTick =
    !!targetPool && isTargetUniV3 && tickUpper === nearestUsableTick(MAX_TICK, (targetPool as UniV3Pool).tickSpacing);

  return { minPrice, maxPrice, isMinTick, isMaxTick };
}
