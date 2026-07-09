import { type CSSProperties } from 'react'

import { Center, HStack, Stack } from 'components/Stack'
import { type StatIcon } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type LeaderboardSize = 'sm' | 'lg'

export type LeaderboardStat = {
  label: string
  value: string
  icon: StatIcon
}

const getMinCardWidth = (size: LeaderboardSize, itemCount: number) => {
  if (size === 'lg') return itemCount > 3 ? 240 : 280

  return itemCount > 4 ? 180 : 190
}

type LeaderboardCardProps = {
  item: LeaderboardStat
}

const LargeLeaderboardCard = ({ item }: LeaderboardCardProps) => {
  const { iconUrl, backgroundColor } = item.icon

  return (
    <HStack className="min-h-[122px] items-center gap-6 rounded-xl bg-buttonBlack px-7 py-6">
      <Center className={cn('size-16 shrink-0 rounded-full', backgroundColor)}>
        <img src={iconUrl} alt="" className="size-9" />
      </Center>
      <Stack className="min-w-0 gap-1">
        <span className="break-words text-[28px] font-medium leading-9 text-text">{item.value}</span>
        <span className="break-words text-base leading-5 text-subText">{item.label}</span>
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
        <span className="break-words text-sm leading-5 text-subText">{item.label}</span>
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
  items: readonly LeaderboardStat[]
  size?: LeaderboardSize
  className?: string
}

const Leaderboard = ({ items, size = 'lg', className }: LeaderboardProps) => {
  const minCardWidth = getMinCardWidth(size, items.length)
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCardWidth}px), 1fr))`,
  }

  return (
    <div className={cn('grid', size === 'sm' ? 'gap-4' : 'gap-6', className)} style={gridStyle}>
      {items.map(item => (
        <LeaderboardCard key={item.label} item={item} size={size} />
      ))}
    </div>
  )
}

export default Leaderboard
