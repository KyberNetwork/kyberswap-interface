import { CopyTradingProfileStat, CopyTradingStat } from 'services/copyTrading'

import { Center, HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

import { profileStatIcons, statIcons } from '../constants'

export const StatCard = ({ item }: { item: CopyTradingStat }) => (
  <HStack className="min-h-24 items-center gap-5 rounded-xl bg-buttonBlack px-6 py-5">
    <Center className={cn('size-12 shrink-0 rounded-full text-sm font-semibold', item.color)}>
      {statIcons[item.icon]}
    </Center>
    <Stack className="gap-1.5">
      <span className="text-2xl font-semibold leading-none text-text">{item.value}</span>
      <span className="text-sm text-subText">{item.label}</span>
    </Stack>
  </HStack>
)

export const ProfileStatCard = ({ item }: { item: CopyTradingProfileStat }) => (
  <HStack className="h-20 items-center gap-5 rounded-xl bg-buttonBlack px-6">
    <Center className="size-11 rounded-full bg-primary-12 text-primary">{profileStatIcons[item.icon]}</Center>
    <Stack className="gap-1">
      <span className="text-lg font-semibold leading-none text-primary">{item.value}</span>
      <span className="text-sm text-subText">{item.label}</span>
    </Stack>
  </HStack>
)
