import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { SafePalCampaignWeekStats, useGetSafePalCampaignWeeklyStatsQuery } from 'services/campaignSafepal'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import Skeleton from 'components/Skeleton'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import SafePalClaimModal from 'pages/Campaign/components/SafePalClaimModal'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { safepalClaimWeeks } from 'pages/Campaign/timelines'
import {
  findActiveCampaignWeek,
  findCampaignWeekByValue,
  getCampaignRangeBounds,
  getCampaignWeekNumber,
  isCampaignWeekEnded,
  isSafePalCampaignWinner,
} from 'pages/Campaign/utils/safepalUtils'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const TABLE_GRID_CLASS = 'grid grid-cols-[1.6fr_1fr_1fr_120px] gap-4'

const StatusBadge = ({ isWinner, children }: { isWinner: boolean; children: React.ReactNode }) => (
  <div
    className={cn(
      'min-w-[120px] rounded-full px-3 py-2 text-center text-sm font-medium',
      isWinner ? 'bg-primary-15 text-primary' : 'bg-subText-20 text-subText',
    )}
  >
    {children}
  </div>
)

const formatClaimDeadline = (timestamp: number) =>
  dayjs(timestamp * 1000)
    .utc()
    .format('DD/MM/YYYY HH:mm') + ' UTC'

const formatCountValue = (value?: number) => {
  return value !== undefined ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'
}

const formatWeekLabel = (item: SafePalCampaignWeekStats) => {
  const start = dayjs(item.cycle_start)
  const end = dayjs(item.cycle_end)
  const week = item.cycle

  if (!start.isValid() || !end.isValid()) return t`Week ${week}`
  return `Week ${week} ${start.format('MMM DD')} - ${end.format('MMM DD')}`
}

// Mirrors the loaded dashboard: the stats header + the weekly table (desktop grid / mobile cards).
const SafePalDashboardSkeleton = ({ rows = 5, upToSmall }: { rows?: number; upToSmall: boolean }) => (
  <>
    <div className={cn('mb-5 flex gap-4', upToSmall ? 'flex-col items-start' : 'flex-row items-center')}>
      <div className={cn('flex flex-1 flex-wrap gap-6', upToSmall ? 'items-start' : 'items-center')}>
        <div className="min-w-[140px]">
          <Skeleton width={72} height={14} />
          <div className="mt-2">
            <Skeleton width={88} height={22} />
          </div>
        </div>
        <div className="w-px self-stretch bg-border max-sm:hidden" />
        <div className="min-w-[260px] flex-1">
          <Skeleton width={upToSmall ? 200 : 320} height={18} />
          <div className="mt-1.5">
            <Skeleton width={180} height={14} />
          </div>
        </div>
      </div>
    </div>

    <Divider />

    {!upToSmall && (
      <>
        <div className={cn(TABLE_GRID_CLASS, 'py-4')}>
          <Skeleton width={40} height={14} />
          <div className="flex justify-end">
            <Skeleton width={120} height={14} />
          </div>
          <div className="flex justify-end">
            <Skeleton width={50} height={14} />
          </div>
          <div className="flex justify-center">
            <Skeleton width={60} height={14} />
          </div>
        </div>
        <Divider />
      </>
    )}

    {upToSmall
      ? Array.from({ length: rows }, (_, i) => (
          <div key={i} className="border-b border-border py-4">
            <Skeleton width={180} height={20} />
            <div className="mt-4 flex items-center justify-between">
              <Skeleton width={140} height={14} />
              <Skeleton width={50} height={14} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Skeleton width={60} height={14} />
              <Skeleton width={48} height={14} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Skeleton width={56} height={14} />
              <Skeleton width={88} height={24} borderRadius={999} />
            </div>
          </div>
        ))
      : Array.from({ length: rows }, (_, i) => (
          <div key={i} className={cn(TABLE_GRID_CLASS, 'items-center py-3')}>
            <Skeleton width={200} height={16} />
            <div className="flex justify-end">
              <Skeleton width={48} height={16} />
            </div>
            <div className="flex justify-end">
              <Skeleton width={48} height={16} />
            </div>
            <div className="flex justify-center">
              <Skeleton width={88} height={24} borderRadius={999} />
            </div>
          </div>
        ))}
  </>
)

export default function SafePalDashboard() {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useWeb3React()
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)

  const { weeks } = campaignConfig[CampaignType.SafePal]
  const dashboardRange = useMemo(() => getCampaignRangeBounds(weeks), [weeks])

  const { data, isLoading } = useGetSafePalCampaignWeeklyStatsQuery(
    { address: account || ZERO_ADDRESS, ...dashboardRange },
    { skip: !account, pollingInterval: 30_000 },
  )

  const weekItems = useMemo(() => {
    const items = data?.items || []
    return [...items].sort((a, b) => b.cycle - a.cycle)
  }, [data?.items])

  const winnerWeeks = useMemo(
    () =>
      weekItems.filter(item => {
        const weekRange = findCampaignWeekByValue(weeks, item.cycle)
        return isCampaignWeekEnded(weekRange) && isSafePalCampaignWinner(item)
      }),
    [weekItems, weeks],
  )
  const totalWinWeeks = winnerWeeks.length

  const currentClaimWeek = findActiveCampaignWeek(safepalClaimWeeks)
  const currentClaimWeekNumber = getCampaignWeekNumber(weeks, currentClaimWeek?.value)

  const isCurrentClaimWeekWinner = useMemo(() => {
    const claimWeekItem = weekItems.find(item => item.cycle === currentClaimWeek?.value)
    return isSafePalCampaignWinner(claimWeekItem)
  }, [currentClaimWeek, weekItems])

  return (
    <div className="mt-5 rounded-[20px] bg-background p-6">
      {!account ? (
        <div className="text-center text-subText">
          <Trans>Please connect wallet to view your Dashboard</Trans>
        </div>
      ) : isLoading ? (
        <SafePalDashboardSkeleton upToSmall={upToSmall} />
      ) : (
        <>
          <div
            className={cn(
              'mb-5 flex justify-start gap-4',
              upToSmall ? 'flex-col items-start' : 'flex-row items-center',
            )}
          >
            <div className={cn('flex flex-1 flex-wrap gap-6', upToSmall ? 'items-start' : 'items-center')}>
              <div className="min-w-[140px]">
                <div className="text-subText">
                  <Trans>Total Wins</Trans>
                </div>
                <div className="mt-2 text-lg font-medium text-text">
                  {totalWinWeeks} <Trans>Weeks</Trans>
                </div>
              </div>

              {currentClaimWeek && (
                <>
                  <div className="w-px self-stretch bg-border max-sm:hidden" />

                  <div className="min-w-[260px] flex-1">
                    <div className={cn('text-text', upToSmall ? 'text-[15px]' : 'text-base')}>
                      {isCurrentClaimWeekWinner ? (
                        <Trans>
                          You&apos;ve won 🎁 SafePal X1 Hardware Wallet in Week {currentClaimWeekNumber} SafePal
                          Campaign.
                        </Trans>
                      ) : (
                        <Trans>Trade to enter Top 667 and become a Winner in the SafePal Campaign.</Trans>
                      )}
                    </div>
                    <div className="mt-1.5 text-sm italic text-subText">
                      {isCurrentClaimWeekWinner ? (
                        <Trans>Claim deadline: {formatClaimDeadline(currentClaimWeek.end)}</Trans>
                      ) : (
                        <Trans>Top 667 each week are marked as Winner.</Trans>
                      )}
                    </div>
                  </div>
                  {isCurrentClaimWeekWinner && (
                    <ButtonPrimary
                      width="fit-content"
                      padding="8px 16px"
                      altDisabledStyle
                      onClick={() => setIsClaimModalOpen(true)}
                    >
                      <Trans>Claim Now</Trans>
                    </ButtonPrimary>
                  )}
                  {isCurrentClaimWeekWinner && (
                    <SafePalClaimModal
                      isOpen={isClaimModalOpen}
                      onDismiss={() => setIsClaimModalOpen(false)}
                      claimWeek={currentClaimWeek}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          <Divider />

          {!upToSmall && (
            <>
              <div className={cn(TABLE_GRID_CLASS, 'py-4 text-xs font-medium text-subText')}>
                <span>
                  <Trans>WEEK</Trans>
                </span>
                <span className="text-right">
                  <Trans>ELIGIBLE TRANSACTIONS</Trans>
                </span>
                <span className="text-right">
                  <Trans>POINTS</Trans>
                </span>
                <span className="text-center">
                  <Trans>STATUS</Trans>
                </span>
              </div>
              <Divider />
            </>
          )}

          {!weekItems.length ? (
            <div className="mt-6 text-center text-subText">
              <Trans>No data found</Trans>
            </div>
          ) : upToSmall ? (
            weekItems.map(item => {
              const hasStatus = isCampaignWeekEnded(findCampaignWeekByValue(weeks, item.cycle))
              const winner = isSafePalCampaignWinner(item)

              return (
                <div key={item.cycle} className="border-b border-border py-4">
                  <div className="text-lg font-medium text-text">{formatWeekLabel(item)}</div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-subText">
                      <Trans>ELIGIBLE TRANSACTIONS</Trans>
                    </span>
                    <span>{formatCountValue(item.cycle_eligible_tx)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-subText">
                      <Trans>POINTS</Trans>
                    </span>
                    <span>{item.total_points}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-subText">
                      <Trans>STATUS</Trans>
                    </span>
                    {hasStatus ? (
                      <StatusBadge isWinner={winner}>{winner ? t`Winner` : t`Not a winner`}</StatusBadge>
                    ) : (
                      <span className="text-subText">--</span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            weekItems.map(item => {
              const hasStatus = isCampaignWeekEnded(findCampaignWeekByValue(weeks, item.cycle))
              const winner = isSafePalCampaignWinner(item)

              return (
                <div key={item.cycle} className={cn(TABLE_GRID_CLASS, 'items-center text-base font-normal text-text')}>
                  <span className="text-subText">{formatWeekLabel(item)}</span>
                  <span className="text-right">{formatCountValue(item.cycle_eligible_tx)}</span>
                  <span className="text-right">{item.total_points}</span>
                  <div className="flex justify-center">
                    {hasStatus ? (
                      <StatusBadge isWinner={winner}>{winner ? t`Winner` : t`Not a winner`}</StatusBadge>
                    ) : (
                      '--'
                    )}
                  </div>
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}
