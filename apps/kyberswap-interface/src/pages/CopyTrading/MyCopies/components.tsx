import type { ActivityRow, OwnerCopySummary } from 'services/copyTrading/types/copyRuns'

import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { AgentAvatar } from 'pages/CopyTrading/components/common/agentIdentity'
import { ContentPanel } from 'pages/CopyTrading/components/common/layout'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  formatCount,
  formatUsd,
  getActivityLabel,
  getSignedMetricClassName,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'
import { formatDateTime } from 'utils/time'

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
      valueClassName: getSignedMetricClassName(summary?.unrealizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: summary?.metrics.unrealizedPnlUsd?.status,
    },
    {
      label: 'Open Positions',
      value: formatCount(summary?.openPositions),
      icon: copyTradingStatIconMap.positionOpen,
      status: summary?.metrics.openPositionCount?.status,
    },
    {
      label: 'Active Copies',
      value: formatCount(summary?.activeCopies ?? fallbackActiveCopies),
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

const getActivityAgentName = (activity: ActivityRow) =>
  activity.agentDisplayName || activity.agentId.replace(/[-_]/g, ' ') || 'Unknown Agent'

const getActivityTokenSymbol = (activity: ActivityRow) =>
  activity.position?.baseToken?.symbol ||
  activity.capital?.token?.symbol ||
  activity.fee?.token?.symbol ||
  activity.execution?.token?.symbol

const getActivityValueUsd = (activity: ActivityRow) =>
  activity.position?.settlementValueUsd?.value ||
  activity.capital?.valueUsd?.value ||
  activity.fee?.valueUsd?.value ||
  activity.execution?.valueUsd?.value

const normalizeActivityCopy = (value?: string) =>
  value
    ?.trim()
    .replace(/[.!:]+$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const isSameActivityCopy = (left?: string, right?: string) =>
  !!left && !!right && normalizeActivityCopy(left) === normalizeActivityCopy(right)

export const AlertsFeed = ({ infiniteScroll, loading, rows }: AlertsFeedProps) => {
  return (
    <ContentPanel title="Alerts Feed">
      <InfiniteScroll {...infiniteScroll} className="max-h-[400px]" scrollbar="vertical">
        <Stack className="gap-5 px-6 py-5">
          {rows.map(item => {
            const agentName = getActivityAgentName(item)
            const activityLabel = getActivityLabel(item)
            const tokenSymbol = getActivityTokenSymbol(item)
            const valueUsd = getActivityValueUsd(item)
            const realizedPnlUsd = item.position?.realizedPnlUsd?.value
            const publicError = item.execution?.publicErrorMessage
            const summary = item.summary.trim()
            const showSummary = !!summary && !isSameActivityCopy(summary, activityLabel)
            const showPublicError =
              !!publicError &&
              !isSameActivityCopy(publicError, summary) &&
              !isSameActivityCopy(publicError, activityLabel)

            return (
              <HStack key={item.activityId} className="items-start gap-3.5">
                <AgentAvatar avatarUrl={item.agentAvatarUrl} chainId={item.chainId} displayName={agentName} />
                <Stack className="min-w-0 flex-1 gap-1.5">
                  <HStack className="min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium text-text">{activityLabel}</span>
                    <span className="text-xs text-subText">•</span>
                    <span className="min-w-0 truncate text-sm text-subText">{agentName}</span>
                    <span className="ml-auto shrink-0 text-xs text-subText">{formatDateTime(item.occurredAt)}</span>
                  </HStack>
                  {showSummary && <p className="break-words text-sm text-subText">{summary}</p>}
                  {showPublicError && <p className="break-words text-xs text-warning">{publicError}</p>}
                  {(tokenSymbol || valueUsd !== undefined || realizedPnlUsd !== undefined) && (
                    <HStack className="flex-wrap items-center gap-2 text-xs">
                      {tokenSymbol && (
                        <span className="rounded-full bg-background-60 px-2 py-1 text-subText">
                          Token: <span className="font-medium text-text">{tokenSymbol}</span>
                        </span>
                      )}
                      {valueUsd !== undefined && (
                        <span className="rounded-full bg-background-60 px-2 py-1 text-subText">
                          Value: <span className="font-medium text-text">{formatUsd(valueUsd)}</span>
                        </span>
                      )}
                      {realizedPnlUsd !== undefined && (
                        <span className="rounded-full bg-background-60 px-2 py-1 text-subText">
                          Realised P&amp;L:{' '}
                          <span
                            className={cn('whitespace-nowrap font-medium', getSignedMetricClassName(realizedPnlUsd))}
                          >
                            {signedUsd(realizedPnlUsd)}
                          </span>
                        </span>
                      )}
                    </HStack>
                  )}
                </Stack>
              </HStack>
            )
          })}

          {loading && !rows.length && (
            <p className="text-sm font-medium text-subText">
              <Dots>Loading</Dots>
            </p>
          )}
          {!loading && !rows.length && <p className="text-sm font-medium text-subText">No recent activity found</p>}
        </Stack>
      </InfiniteScroll>
    </ContentPanel>
  )
}
