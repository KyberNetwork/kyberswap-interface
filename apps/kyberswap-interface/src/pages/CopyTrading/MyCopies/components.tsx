import type { ActivityRow, OwnerCopySummary } from 'services/copyTrading/types'

import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
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

export const AlertsFeed = ({ loading, rows }: AlertsFeedProps) => (
  <Stack className="gap-5 rounded-xl bg-buttonBlack p-6">
    <HStack className="items-center gap-2">
      <span className="text-sm font-medium uppercase text-subText">Alerts Feed</span>
      <span className="rounded bg-primary-12 px-2 py-0.5 text-xs font-medium text-primary">LIVE</span>
    </HStack>

    {rows.map((item, index) => (
      <HStack key={item.activityId} className="items-start gap-3.5">
        <span className={cn('mt-1 size-2 shrink-0 rounded-full', index === 0 ? 'bg-blue' : 'bg-primary')} />
        <Stack className="min-w-0 gap-1">
          <span className="break-words text-sm text-text">{item.summary}</span>
          <span className="text-sm text-subText">{formatDate(item.occurredAt)}</span>
        </Stack>
      </HStack>
    ))}

    {loading && !rows.length && (
      <span className="text-sm font-medium text-subText">
        <Dots>Loading</Dots>
      </span>
    )}
    {!loading && !rows.length && <span className="text-sm font-medium text-subText">No recent activity found</span>}
  </Stack>
)
