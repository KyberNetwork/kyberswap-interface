import { useEffect } from 'react';

import { UniV3Pool, UniV3Position, univ3Types } from '@kyber/schema';
import { nearestUsableTick } from '@kyber/utils/uniswapv3';

import PoolPrice from '@/components/PoolPrice';
import LiquidityChart from '@/components/RangeInput/LiquidityChart';
import PriceInput from '@/components/RangeInput/PriceInput';
import RangePreset from '@/components/RangeInput/RangePreset';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function RangeInput({ initialTick }: { initialTick?: { tickLower: number; tickUpper: number } }) {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPool } = usePoolStore(['targetPool']);
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
      const nearestTickLower = nearestUsableTick(initialTick.tickLower, (targetPool as UniV3Pool).tickSpacing);
      const nearestTickUpper = nearestUsableTick(initialTick.tickUpper, (targetPool as UniV3Pool).tickSpacing);
      setTickLower(nearestTickLower);
      setTickUpper(nearestTickUpper);
    }
  }, [
    initialTick,
    isTargetUniV3,
    setTickLower,
    setTickUpper,
    targetPool,
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
      <RangePreset initialTick={initialTick} />
      <PriceInput />
    </div>
  );
}
