import { MouseoverTooltip, Skeleton } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

export default function EstimatedRow({
  loading,
  label,
  labelTooltip,
  value,
  valueTooltip,
  hasRoute,
  className,
}: {
  loading: boolean;
  label: string | React.ReactNode;
  labelTooltip?: string | React.ReactNode;
  value: React.ReactNode;
  valueTooltip?: string;
  hasRoute: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-between items-center', className)}>
      <MouseoverTooltip text={labelTooltip} width="220px">
        {typeof label === 'string' ? (
          <div className="text-subText w-fit border-b border-dotted border-subText text-xs">{label}</div>
        ) : (
          label
        )}
      </MouseoverTooltip>

      {loading ? (
        <Skeleton className="w-14 h-5" />
      ) : hasRoute ? (
        <MouseoverTooltip text={valueTooltip}>{value}</MouseoverTooltip>
      ) : (
        '--'
      )}
    </div>
  );
}
