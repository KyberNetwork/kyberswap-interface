import { PI_LEVEL } from '@kyber/utils';
import { cn } from '@kyber/utils/tailwind-helpers';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

export default function ZapImpactWarning() {
  const { route } = useZapStore(['route']);
  const { zapImpact } = useZapRoute();

  return (
    route &&
    zapImpact.level !== PI_LEVEL.NORMAL && (
      <div
        className={cn(
          'rounded-md text-xs py-3 px-4 font-normal leading-[18px]',
          zapImpact.level === PI_LEVEL.HIGH ? 'text-warning bg-warning-200' : 'text-error bg-error-200',
        )}
      >
        {zapImpact.msg}
      </div>
    )
  );
}
