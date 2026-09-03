import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { type StatIcon } from 'pages/CopyTrading/constants'
import { cn } from 'utils/cn'

type LeaderboardSize = 'sm' | 'lg'

export type LeaderboardStat = {
  label: string
  value: string
  icon: StatIcon
  mobileSpan?: 1 | 2
  valueClassName?: string
}

type LeaderboardCardProps = {
  className?: string
  item: LeaderboardStat
  loading?: boolean
  size: LeaderboardSize
}

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

const StatValueSkeleton = ({ size }: Pick<LeaderboardCardProps, 'size'>) => (
  <div>
    <div className="md:hidden">
      <TextSkeleton size="base" width={80} />
    </div>
    <div className="hidden md:block">
      <TextSkeleton size={size === 'lg' ? '2xl' : 'lg'} width={size === 'lg' ? 112 : 80} />
    </div>
  </div>
)

const LeaderboardCard = ({ className, item, loading, size }: LeaderboardCardProps) => {
  return (
    <HStack
      className={cn(
        'h-full min-h-16 items-center gap-2 rounded-xl bg-buttonBlack px-3 py-2',
        size === 'lg'
          ? 'md:min-h-24 md:gap-4 md:px-5 md:py-4'
          : 'md:min-h-[72px] md:gap-3 md:px-4 md:py-3 xl:gap-4 xl:px-6',
        className,
      )}
    >
      <StatIconView icon={item.icon} />
      <Stack className={cn('min-w-0 flex-1 gap-0', size === 'lg' ? 'md:gap-1' : 'md:gap-0.5')}>
        {loading ? (
          <StatValueSkeleton size={size} />
        ) : (
          <span
            className={cn(
              'truncate text-base font-medium',
              size === 'lg' ? 'text-text md:text-2xl' : 'text-primary md:text-lg',
              item.valueClassName,
            )}
            title={item.value}
          >
            {item.value}
          </span>
        )}
        <div className="min-w-0 text-sm text-subText">
          <span className="block whitespace-normal md:truncate" title={item.label}>
            {item.label}
          </span>
        </div>
      </Stack>
    </HStack>
  )
}

type LeaderboardProps = {
  className?: string
  items: readonly LeaderboardStat[]
  loading?: boolean
  size?: LeaderboardSize
}

const Leaderboard = ({ items, loading, size = 'lg', className }: LeaderboardProps) => {
  const hasExplicitMobileSpan = items.some(item => item.mobileSpan !== undefined)

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 md:gap-4',
        size === 'lg'
          ? 'md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]'
          : 'md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]',
        className,
      )}
    >
      {items.map((item, index) => (
        <LeaderboardCard
          key={item.label}
          item={item}
          loading={loading}
          size={size}
          className={cn(
            item.mobileSpan === 2 && 'max-md:col-span-2',
            !hasExplicitMobileSpan && items.length % 2 === 1 && index === items.length - 1 && 'max-md:col-span-2',
          )}
        />
      ))}
    </div>
  )
}

export default Leaderboard
