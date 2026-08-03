import dayjs from 'dayjs'
import type { ActivityRow, OwnerCopySummary } from 'services/copyTrading/types'

import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { ContentPanel } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, getActivityLabel, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type OpenCopiesSummaryProps = {
  fallbackActiveCopies?: number
  summary?: OwnerCopySummary
}

export const OpenCopiesSummary = ({ fallbackActiveCopies, summary }: OpenCopiesSummaryProps) => {
  const stats: LeaderboardStat[] = [
    {
      label: 'Total Allocated',
      value: formatUsd(summary?.totalAllocatedUsd),
      icon: copyTradingStatIconMap.volume,
      status: summary?.metrics.totalAllocatedUsd?.status,
    },
    {
      label: 'Unrealised P&L',
      value: signedUsd(summary?.unrealizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: summary?.metrics.unrealizedPnlUsd?.status,
    },
    {
      label: 'Open Positions',
      value: summary?.openPositions || '—',
      icon: copyTradingStatIconMap.positionOpen,
      status: summary?.metrics.openPositionCount?.status,
    },
    {
      label: 'Active Copies',
      value: summary?.activeCopies ?? (fallbackActiveCopies === undefined ? '—' : String(fallbackActiveCopies)),
      icon: copyTradingStatIconMap.agents,
      status: summary?.metrics.activeCopyRuns?.status,
    },
  ]

  return <Leaderboard items={stats} />
}

type AlertsFeedProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: ActivityRow[]
}

const getActivityDotColor = (activity: ActivityRow) => {
  if (
    activity.activityType === 'aligned_trade_skipped' ||
    activity.activityType === 'exit_skipped' ||
    activity.activityType === 'exit_failed' ||
    activity.activityType === 'execution_failed'
  )
    return 'bg-warning'
  if (
    activity.activityType === 'position_closed' ||
    activity.activityType === 'exit_succeeded' ||
    activity.activityType === 'position_reduced'
  ) {
    const realizedPnl = activity.position?.realizedPnlUsd?.value
    return realizedPnl !== undefined && Number(realizedPnl) < 0 ? 'bg-red' : 'bg-primary'
  }
  if (activity.activityType === 'copy_stopped') return 'bg-red'
  if (activity.activityType === 'position_opened' || activity.activityType === 'copy_started') return 'bg-blue'
  return 'bg-subText'
}

export const AlertsFeed = ({ infiniteScroll, loading, rows }: AlertsFeedProps) => {
  return (
    <ContentPanel bodyClassName="px-6 py-5" title="Alerts Feed">
      <InfiniteScroll {...infiniteScroll} className="max-h-[360px] pr-2">
        <Stack className="gap-5">
          {rows.map(item => (
            <HStack key={item.activityId} className="items-start gap-3.5">
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', getActivityDotColor(item))} />
              <Stack className="min-w-0 gap-1">
                <span className="text-xs font-medium text-subText">{getActivityLabel(item)}</span>
                <span className="break-words text-sm text-text">{item.summary}</span>
                <span className="text-sm text-subText" title={`${formatDate(item.occurredAt)} UTC`}>
                  {dayjs(item.occurredAt).fromNow()}
                </span>
              </Stack>
            </HStack>
          ))}

          {loading && !rows.length && (
            <span className="text-sm font-medium text-subText">
              <Dots>Loading</Dots>
            </span>
          )}
          {!loading && !rows.length && (
            <span className="text-sm font-medium text-subText">No recent activity found</span>
          )}
        </Stack>
      </InfiniteScroll>
    </ContentPanel>
  )
}
