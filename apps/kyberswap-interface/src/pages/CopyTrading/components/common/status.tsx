import type {
  CopyRunStatus,
  DataStatus,
  MetricStatus,
  PositionLifecycle,
  PositionQuantityState,
} from 'services/copyTrading/types/primitives'

import { Center, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type DataQualityStatus = DataStatus | MetricStatus

const dataQualityStatusPresentation: Record<DataQualityStatus, { className: string; label: string }> = {
  DATA_STATUS_CURRENT: { className: 'bg-primary-12 text-primary', label: 'Current' },
  DATA_STATUS_STALE: { className: 'bg-warning-20 text-warning', label: 'Stale' },
  DATA_STATUS_UNAVAILABLE: { className: 'bg-red-20 text-red', label: 'Unavailable' },
  DATA_STATUS_UNSPECIFIED: { className: 'bg-subText-20 text-subText', label: 'Unknown' },
  METRIC_STATUS_CURRENT: { className: 'bg-primary-12 text-primary', label: 'Current' },
  METRIC_STATUS_STALE: { className: 'bg-warning-20 text-warning', label: 'Stale' },
  METRIC_STATUS_UNAVAILABLE: { className: 'bg-red-20 text-red', label: 'Unavailable' },
  METRIC_STATUS_NOT_APPLICABLE: { className: 'bg-subText-20 text-subText', label: 'N/A' },
  METRIC_STATUS_UNSPECIFIED: { className: 'bg-subText-20 text-subText', label: 'Unknown' },
}

export const DataQualityStatusBadge = ({ status }: { status: DataQualityStatus }) => {
  const presentation = dataQualityStatusPresentation[status]

  return (
    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', presentation.className)}>
      {presentation.label}
    </span>
  )
}

const copyRunStatusLabel: Record<CopyRunStatus, string> = {
  active: 'Active',
  closing: 'Closing',
  stopped: 'Stopped',
  closed: 'Closed',
  unknown: 'Unknown',
}

export const copyRunStatusTextClassName: Record<CopyRunStatus, string> = {
  active: 'text-primary',
  closing: 'text-blue',
  stopped: 'text-red',
  closed: 'text-subText',
  unknown: 'text-subText',
}

export const CopyRunStatusBadge = ({ status }: { status: CopyRunStatus }) => (
  <span
    className={cn(
      'inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium',
      copyRunStatusTextClassName[status],
      status === 'active' && 'bg-primary-12',
      status === 'closing' && 'bg-blue/10',
      status === 'stopped' && 'bg-red-20',
      (status === 'closed' || status === 'unknown') && 'bg-subText-20',
    )}
  >
    {copyRunStatusLabel[status]}
  </span>
)

const positionLifecycleLabel: Record<PositionLifecycle, string> = {
  active: 'Open',
  closing: 'Closing',
  closed: 'Closed',
  unknown: 'Status unavailable',
}

const positionQuantityLabel: Record<PositionQuantityState, string | undefined> = {
  open_full: undefined,
  open_partial: 'Partially sold',
  closed: undefined,
  unknown: undefined,
}

export const PositionLifecycleBadge = ({
  lifecycle,
  quantityState,
}: {
  lifecycle: PositionLifecycle
  quantityState: PositionQuantityState
}) => {
  const quantityLabel =
    lifecycle === 'active' || lifecycle === 'closing' ? positionQuantityLabel[quantityState] : undefined

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
        lifecycle === 'active' && 'bg-primary-12 text-primary',
        lifecycle === 'closing' && 'bg-blue/10 text-blue',
        lifecycle === 'closed' && 'bg-subText-20 text-subText',
        lifecycle === 'unknown' && 'bg-subText-20 text-subText',
      )}
    >
      {positionLifecycleLabel[lifecycle]}
      {quantityLabel ? ' · ' + quantityLabel : ''}
    </span>
  )
}

export const OwnerWalletRequired = () => (
  <Center className="min-h-[240px] rounded-xl bg-buttonBlack-60 px-6 text-center">
    <Stack className="items-center gap-2">
      <p className="text-base font-medium text-text">Connect your wallet</p>
      <p className="text-sm text-subText">Connect a wallet to view your Copy Trading data.</p>
    </Stack>
  </Center>
)
