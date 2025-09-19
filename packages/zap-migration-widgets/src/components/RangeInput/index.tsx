import { useEffect } from 'react';

import { POOL_CATEGORY, UniV3Pool, UniV3Position, univ3Types } from '@kyber/schema';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import PoolPrice from '@/components/PoolPrice';
import LiquidityChart from '@/components/RangeInput/LiquidityChart';
import PriceInput from '@/components/RangeInput/PriceInput';
import { DEFAULT_PRICE_RANGE } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function RangeInput({ initialTick }: { initialTick?: { tickLower: number; tickUpper: number } }) {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPool, targetPoolPrice } = usePoolStore(['targetPool', 'targetPoolPrice']);
  const { targetPosition, targetPositionId } = usePositionStore(['targetPosition', 'targetPositionId']);
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapStore([
    'tickLower',
    'tickUpper',
    'setTickLower',
    'setTickUpper',
  ]);

  const isTargetUniV3 = !!targetPool && univ3Types.includes(targetPoolType as any);

  useEffect(() => {
    if (!isTargetUniV3 || (tickLower !== null && tickUpper !== null)) return;

    if (targetPositionId && !targetPosition) return;

    if (targetPosition) {
      setTickLower((targetPosition as UniV3Position).tickLower);
      setTickUpper((targetPosition as UniV3Position).tickUpper);
    } else if (initialTick) {
      setTickLower(initialTick.tickLower);
      setTickUpper(initialTick.tickUpper);
    } else {
      if (!targetPoolPrice || !targetPool) return;
      const defaultRange =
        DEFAULT_PRICE_RANGE[targetPool.category as keyof typeof DEFAULT_PRICE_RANGE] ||
        DEFAULT_PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR];

      const left = +targetPoolPrice * (1 - defaultRange);
      const right = +targetPoolPrice * (1 + defaultRange);

      const { token0, token1 } = targetPool;
      const lower = priceToClosestTick(toString(left), token0.decimals, token1.decimals, false);
      const upper = priceToClosestTick(toString(right), token0.decimals, token1.decimals, false);

      if (lower === undefined || upper === undefined) return;

      setTickLower(nearestUsableTick(lower, (targetPool as UniV3Pool).tickSpacing));
      setTickUpper(nearestUsableTick(upper, (targetPool as UniV3Pool).tickSpacing));
    }
  }, [
    initialTick,
    isTargetUniV3,
    setTickLower,
    setTickUpper,
    targetPool,
    targetPoolPrice,
    targetPosition,
    targetPositionId,
    tickLower,
    tickUpper,
  ]);

  if (targetPositionId) return null;
  return (
    <div className="border border-stroke rounded-md px-4 py-3 flex flex-col">
      <PoolPrice />
      <LiquidityChart />
      <PriceInput />
    </div>
  );
}
