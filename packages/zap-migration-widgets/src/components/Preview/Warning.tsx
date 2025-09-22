import { UniV3Pool, univ3Types } from '@kyber/schema';
import { PI_LEVEL } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function Warning() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { slippage, route, tickLower, tickUpper } = useZapStore(['slippage', 'route', 'tickLower', 'tickUpper']);
  const { targetPool } = usePoolStore(['targetPool']);
  const { suggestedSlippage, zapImpact } = useZapRoute();

  const isTargetUniV3 = univ3Types.includes(targetPoolType as any);
  const isAddToOutRange =
    isTargetUniV3 &&
    tickLower !== null &&
    tickUpper !== null &&
    ((targetPool as UniV3Pool).tick < tickLower || (targetPool as UniV3Pool).tick > tickUpper);

  return (
    <div className="mt-4">
      {route && zapImpact.level !== PI_LEVEL.NORMAL && (
        <div
          className={cn(
            'rounded-md text-xs py-3 px-4 font-normal leading-[18px]',
            zapImpact.level === PI_LEVEL.HIGH ? 'text-warning bg-warning-200' : 'text-error bg-error-200',
          )}
        >
          {zapImpact.msg}
        </div>
      )}

      {slippage && (slippage > 2 * suggestedSlippage || slippage < suggestedSlippage / 2) && (
        <div className="rounded-md text-xs px-4 py-3 text-warning bg-warning-200">
          {slippage > suggestedSlippage * 2
            ? 'Your slippage is set higher than usual, which may cause unexpected losses.'
            : 'Your slippage is set lower than usual, increasing the risk of transaction failure.'}
        </div>
      )}

      {isAddToOutRange ? (
        <div className="rounded-md text-xs px-4 py-3 text-warning bg-warning-200">
          Your liquidity is outside the current market range and will not be used/earn fees until the market price
          enters your specified range.
        </div>
      ) : null}
    </div>
  );
}
