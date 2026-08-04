import { cn } from '@kyber/utils/tailwind-helpers';

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
    <p className={cn('truncate ks-ui-style', className)} style={{ maxWidth }} title={symbol}>
      {symbol}
    </p>
  );
}
