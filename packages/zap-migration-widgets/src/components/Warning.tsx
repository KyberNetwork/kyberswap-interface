import { PI_LEVEL } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

export default function Warning() {
  const { route } = useZapStore(['route']);
  const { zapImpact, initUsd, refund, suggestedSlippage } = useZapRoute();

  const isHighRemainingAmount = initUsd ? refund.value / initUsd >= suggestedSlippage : false;

  return (
    <>
      {route && isHighRemainingAmount && (
        <div className="rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] text-warning bg-warning-200">
          {((refund.value * 100) / initUsd).toFixed(2)}% remains unused and will be returned to your wallet. Refresh or
          change your amount to get updated routes.
        </div>
      )}

      {route && zapImpact.level !== PI_LEVEL.NORMAL && (
        <div
          className={cn(
            'rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px]',
            zapImpact.level === PI_LEVEL.HIGH ? 'text-warning bg-warning-200' : 'text-error bg-error-200',
          )}
        >
          {zapImpact.msg}
        </div>
      )}
    </>
  );
}
