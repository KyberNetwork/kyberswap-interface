import { UniV3Pool, univ3Types } from '@kyber/schema';

import usePriceRange from '@/components/RangeInput/usePriceRange';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function Warning() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { tickLower, tickUpper } = useZapStore(['tickLower', 'tickUpper']);
  const { targetPool } = usePoolStore(['targetPool']);
  const { isMinTick, isMaxTick } = usePriceRange();

  const isTargetUniV3 = univ3Types.includes(targetPoolType as any);
  const isAddToOutRange =
    isTargetUniV3 &&
    tickLower !== null &&
    tickUpper !== null &&
    ((targetPool as UniV3Pool).tick < tickLower || (targetPool as UniV3Pool).tick > tickUpper);

  const isFullRange = isMinTick && isMaxTick;

  return (
    <div className="flex flex-col gap-2">
      {isAddToOutRange ? (
        <div className="rounded-md text-xs px-4 py-3 text-warning bg-warning-200">
          Your liquidity is outside the current market range and will not be used/earn fees until the market price
          enters your specified range.
        </div>
      ) : null}

      {isFullRange ? (
        <div className="rounded-md text-xs px-4 py-3 text-warning bg-warning-200">
          Your liquidity is active across the full price range. However, this may result in a lower APR than estimated
          due to less concentration of liquidity.
        </div>
      ) : null}
    </div>
  );
}
