import { cn } from '@kyber/utils/tailwind-helpers';

import { MouseoverTooltip } from '@/components/Tooltip';

export default function TokenSymbol({
  symbol,
  maxWidth = 140,
  className,
}: {
  symbol: string;
  maxWidth?: number;
  className?: string;
}) {
  return (
    <MouseoverTooltip className="ks-ui-style" text={symbol} placement="top" width="fit-content">
      <p className={cn('truncate', className)} style={{ maxWidth }}>
        {symbol}
      </p>
    </MouseoverTooltip>
  );
}
