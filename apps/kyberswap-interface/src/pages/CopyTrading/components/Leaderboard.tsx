import type { MetricStatus } from 'services/copyTrading/types/primitives'

import { Center, HStack, Stack } from 'components/Stack'
import { DataQualityStatusBadge } from 'pages/CopyTrading/components/common/status'
import { type StatIcon } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type LeaderboardSize = 'sm' | 'lg'

export type LeaderboardStat = {
  label: string
  value: string
  icon: StatIcon
  status?: MetricStatus
  valueClassName?: string
}

type LeaderboardCardProps = {
  className?: string
  item: LeaderboardStat
  size: LeaderboardSize
}

const StatLabel = ({ item }: Pick<LeaderboardCardProps, 'item'>) => (
  <HStack className="min-w-0 flex-nowrap items-center gap-1 md:gap-2">
    <span className="min-w-0 truncate" title={item.label}>
      {item.label}
    </span>
    {item.status === 'METRIC_STATUS_STALE' && <DataQualityStatusBadge status={item.status} />}
  </HStack>
)

const StatIconView = ({ icon }: Pick<LeaderboardStat, 'icon'>) => {
  const { backgroundColor } = icon

  return (
    <Center className={cn('size-8 shrink-0 rounded-full md:size-12', backgroundColor)}>
      {'Icon' in icon ? (
        <icon.Icon className={cn('size-4 md:size-6', icon.iconClassName)} />
      ) : (
        <img src={icon.iconUrl} alt="" className="size-4 md:size-6" />
      )}
    </Center>
  )
}

const LeaderboardCard = ({ className, item, size }: LeaderboardCardProps) => {
  return (
    <HStack
      className={cn(
        'h-full min-h-16 items-center gap-2 rounded-xl bg-buttonBlack px-3 py-2',
        size === 'lg' ? 'md:min-h-24 md:gap-4 md:px-5 md:py-4' : 'md:min-h-[72px] md:gap-4 md:px-6 md:py-3',
        className,
      )}
    >
      <StatIconView icon={item.icon} />
      <Stack className={cn('min-w-0 flex-1 gap-0', size === 'lg' ? 'md:gap-1' : 'md:gap-0.5')}>
        <span
          className={cn(
            'truncate text-base font-medium leading-5',
            size === 'lg' ? 'text-text md:text-2xl md:leading-8' : 'text-primary md:text-lg md:leading-6',
            item.valueClassName,
          )}
          title={item.value}
        >
          {item.value}
        </span>
        <div className="min-w-0 text-xs leading-4 text-subText md:text-sm md:leading-5">
          <StatLabel item={item} />
        </div>
      </Stack>
    </HStack>
  )
}

type LeaderboardProps = {
  className?: string
  items: readonly LeaderboardStat[]
  size?: LeaderboardSize
}

const Leaderboard = ({ items, size = 'lg', className }: LeaderboardProps) => (
  <div className={cn('grid grid-cols-2 gap-2 md:grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:gap-4', className)}>
    {items.map((item, index) => (
      <LeaderboardCard
        key={item.label}
        item={item}
        size={size}
        className={cn(items.length % 2 === 1 && index === items.length - 1 && 'max-md:col-span-2')}
      />
    ))}
  </div>
)

export default Leaderboard
