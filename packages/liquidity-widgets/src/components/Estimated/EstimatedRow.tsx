import { MouseoverTooltip, Skeleton } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

export default function EstimatedRow({
  initializing,
  label,
  labelTooltip,
  value,
  valueTooltip,
  hasRoute,
  className,
}: {
  initializing: boolean;
  label: string | React.ReactNode;
  labelTooltip?: string | React.ReactNode;
  value: React.ReactNode;
  valueTooltip?: string;
  hasRoute: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-between items-start mt-3 text-xs', className)}>
      <MouseoverTooltip text={labelTooltip} width="220px">
        {typeof label === 'string' ? (
          <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">{label}</div>
        ) : (
          label
        )}
      </MouseoverTooltip>

      {initializing ? (
        <Skeleton className="w-14 h-4" />
      ) : hasRoute ? (
        <MouseoverTooltip text={valueTooltip}>{value}</MouseoverTooltip>
      ) : (
        '--'
      )}
    </div>
  );
}
