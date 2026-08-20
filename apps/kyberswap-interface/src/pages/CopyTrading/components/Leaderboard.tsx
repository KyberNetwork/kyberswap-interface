import { type CSSProperties } from 'react'
import type { MetricStatus } from 'services/copyTrading/types/primitives'

import { Center, HStack, Stack } from 'components/Stack'
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

const getMinCardWidth = (size: LeaderboardSize) => (size === 'sm' ? 250 : 260)

type LeaderboardCardProps = {
  item: LeaderboardStat
}

const StatLabel = ({ item }: LeaderboardCardProps) => (
  <HStack className="min-w-0 flex-nowrap items-center gap-2">
    <span className="min-w-0 truncate" title={item.label}>
      {item.label}
    </span>
    {item.status === 'METRIC_STATUS_STALE' && (
      <span className="rounded bg-warning-20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-warning">Stale</span>
    )}
  </HStack>
)

const StatIconView = ({ icon }: Pick<LeaderboardStat, 'icon'>) => {
  const { backgroundColor } = icon

  return (
    <Center className={cn('size-12 shrink-0 rounded-full', backgroundColor)}>
      {'Icon' in icon ? (
        <icon.Icon className={cn('size-6', icon.iconClassName)} />
      ) : (
        <img src={icon.iconUrl} alt="" className="size-6" />
      )}
    </Center>
  )
}

const LargeLeaderboardCard = ({ item }: LeaderboardCardProps) => {
  return (
    <HStack className="h-full min-h-24 items-center gap-4 rounded-xl bg-buttonBlack px-5 py-4">
      <StatIconView icon={item.icon} />
      <Stack className="min-w-0 flex-1 gap-1">
        <span
          className={cn('truncate text-2xl font-medium leading-8 text-text', item.valueClassName)}
          title={item.value}
        >
          {item.value}
        </span>
        <div className="min-w-0 text-sm leading-5 text-subText">
          <StatLabel item={item} />
        </div>
      </Stack>
    </HStack>
  )
}

const SmallLeaderboardCard = ({ item }: LeaderboardCardProps) => {
  return (
    <HStack className="h-full min-h-[72px] items-center gap-4 rounded-xl bg-buttonBlack px-6 py-3 max-sm:px-4">
      <StatIconView icon={item.icon} />
      <Stack className="min-w-0 flex-1 gap-0.5">
        <span
          className={cn('truncate text-lg font-medium leading-6 text-primary', item.valueClassName)}
          title={item.value}
        >
          {item.value}
        </span>
        <div className="min-w-0 text-sm leading-5 text-subText">
          <StatLabel item={item} />
        </div>
      </Stack>
    </HStack>
  )
}

type LeaderboardCardSelectorProps = {
  item: LeaderboardStat
  size: LeaderboardSize
}

const LeaderboardCard = ({ item, size }: LeaderboardCardSelectorProps) =>
  size === 'sm' ? <SmallLeaderboardCard item={item} /> : <LargeLeaderboardCard item={item} />

type LeaderboardProps = {
  className?: string
  items: readonly LeaderboardStat[]
  size?: LeaderboardSize
}

const Leaderboard = ({ items, size = 'lg', className }: LeaderboardProps) => {
  const minCardWidth = getMinCardWidth(size)
  const itemCount = Math.max(items.length, 1)
  const totalGap = (itemCount - 1) * 16
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fill, minmax(max(min(100%, ${minCardWidth}px), calc((100% - ${totalGap}px) / ${itemCount})), 1fr))`,
  }

  return (
    <div className={cn('grid gap-4', className)} style={gridStyle}>
      {items.map(item => (
        <LeaderboardCard key={item.label} item={item} size={size} />
      ))}
    </div>
  )
}

export default Leaderboard
