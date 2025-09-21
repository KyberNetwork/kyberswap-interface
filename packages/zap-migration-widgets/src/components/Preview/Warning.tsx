import { PI_LEVEL } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

export default function Warning() {
  const { slippage, route } = useZapStore(['slippage', 'route']);
  const { suggestedSlippage, zapImpact } = useZapRoute();

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
    </div>
  );
}
