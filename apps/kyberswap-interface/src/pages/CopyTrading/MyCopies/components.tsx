import dayjs from 'dayjs'
import type { ActivityRow, OwnerCopySummary } from 'services/copyTrading/types'

import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { SidePanelCard } from 'pages/CopyTrading/components/AgentSidebarCards'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
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
    },
    {
      label: 'Unrealised P&L',
      value: signedUsd(summary?.unrealizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Open Positions',
      value: String(summary?.openPositions || 0),
      icon: copyTradingStatIconMap.positionOpen,
    },
    {
      label: 'Active Copies',
      value: String(summary?.activeCopies || fallbackActiveCopies || 0),
      icon: copyTradingStatIconMap.agents,
    },
  ]

  return <Leaderboard items={stats} />
}

type AlertsFeedProps = {
  loading?: boolean
  rows: ActivityRow[]
}

const getActivityDotColor = (activity: ActivityRow) => {
  if (activity.activityType === 'trade_skipped' || activity.activityType === 'execution_failed') return 'bg-warning'
  if (activity.activityType === 'position_closed') {
    return /(?:p&l|profit)[^\d-]*-/i.test(activity.summary) ? 'bg-red' : 'bg-primary'
  }
  if (activity.activityType === 'copy_stopped') return 'bg-red'
  if (activity.activityType === 'position_opened' || activity.activityType === 'copy_started') return 'bg-blue'
  return 'bg-subText'
}

export const AlertsFeed = ({ loading, rows }: AlertsFeedProps) => {
  return (
    <SidePanelCard
      bodyClassName="gap-5 px-6 py-5"
      title={
        <HStack className="items-center gap-2">
          <span className="text-sm font-medium uppercase text-subText">Alerts Feed</span>
          <span className="rounded bg-primary-12 px-2 py-0.5 text-xs font-medium text-primary">LIVE</span>
        </HStack>
      }
    >
      {rows.map(item => (
        <HStack key={item.activityId} className="items-start gap-3.5">
          <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', getActivityDotColor(item))} />
          <Stack className="min-w-0 gap-1">
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
      {!loading && !rows.length && <span className="text-sm font-medium text-subText">No recent activity found</span>}
    </SidePanelCard>
  )
}
