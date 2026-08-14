import { type CSSProperties } from 'react'
import type { MetricStatus } from 'services/copyTrading/types'

import { Center, HStack, Stack } from 'components/Stack'
import { type StatIcon } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type LeaderboardSize = 'sm' | 'lg'

export type LeaderboardStat = {
  label: string
  value: string
  icon: StatIcon
  status?: MetricStatus
}

const getMinCardWidth = (size: LeaderboardSize, itemCount: number) => {
  if (size === 'lg') return itemCount > 3 ? 210 : 240

  return itemCount > 4 ? 180 : 190
}

type LeaderboardCardProps = {
  item: LeaderboardStat
}

const StatLabel = ({ item }: LeaderboardCardProps) => (
  <HStack className="flex-wrap items-center gap-2">
    <span className="break-words">{item.label}</span>
    {item.status === 'METRIC_STATUS_STALE' && (
      <span className="rounded bg-warning-20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-warning">Stale</span>
    )}
  </HStack>
)

const LargeLeaderboardCard = ({ item }: LeaderboardCardProps) => {
  const { iconUrl, backgroundColor } = item.icon

  return (
    <HStack className="min-h-24 items-center gap-4 rounded-xl bg-buttonBlack px-5 py-4">
      <Center className={cn('size-12 shrink-0 rounded-full', backgroundColor)}>
        <img src={iconUrl} alt="" className="size-6" />
      </Center>
      <Stack className="min-w-0 gap-1">
        <span className="break-words text-2xl font-medium leading-8 text-text">{item.value}</span>
        <div className="text-sm leading-5 text-subText">
          <StatLabel item={item} />
        </div>
      </Stack>
    </HStack>
  )
}

const SmallLeaderboardCard = ({ item }: LeaderboardCardProps) => {
  const { iconUrl, backgroundColor } = item.icon

  return (
    <HStack className="min-h-[72px] items-center gap-4 rounded-xl bg-buttonBlack px-6 py-3 max-sm:px-4">
      <Center className={cn('size-12 shrink-0 rounded-full', backgroundColor)}>
        <img src={iconUrl} alt="" className="size-6" />
      </Center>
      <Stack className="min-w-0 gap-0.5">
        <span className="break-words text-lg font-medium leading-6 text-primary">{item.value}</span>
        <div className="text-sm leading-5 text-subText">
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
  const minCardWidth = getMinCardWidth(size, items.length)
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCardWidth}px), 1fr))`,
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
