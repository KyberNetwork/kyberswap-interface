import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { CopyRunStatus, PositionLifecycle, PositionQuantityState } from 'services/copyTrading/types/primitives'

import { Center, HStack, Stack } from 'components/Stack'
import { formatUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const MetricStatusBadge = ({ children }: { children: string }) => (
  <span className="inline-flex whitespace-nowrap rounded-full bg-warning-20 px-2 py-0.5 text-[10px] font-medium text-warning">
    {children}
  </span>
)

export const CapitalInCardValue = ({ run }: { run: CopyRunListItem }) => (
  <HStack className="items-center justify-end gap-1.5">
    <span>{formatUsd(run.capitalInUsd)}</span>
    {run.capitalInProjectionStatus === 'syncing' && <MetricStatusBadge>Syncing</MetricStatusBadge>}
  </HStack>
)

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
