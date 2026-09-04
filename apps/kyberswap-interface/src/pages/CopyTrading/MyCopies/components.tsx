import { AlertTriangle } from 'react-feather'
import { Link } from 'react-router-dom'
import type { ActivityRow, OwnerCopySummary } from 'services/copyTrading/types/copyRuns'

import Dots from 'components/Dots'
import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { formatAlertFeedTime, getAlertFeedItemViewModel } from 'pages/CopyTrading/MyCopies/alertFeed'
import InfiniteScroll, { type InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { ContentPanel, ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import {
  type ActivityTone,
  formatCount,
  formatUsd,
  getActivityLabel,
  getActivityToneClassName,
  getSignedMetricClassName,
  signedUsd,
} from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

type OpenCopiesSummaryProps = {
  loading?: boolean
  summary?: OwnerCopySummary
}

export const OpenCopiesSummary = ({ loading, summary }: OpenCopiesSummaryProps) => {
  const stats: LeaderboardStat[] = [
    {
      label: 'Total Allocated',
      value: formatUsd(summary?.totalAllocatedUsd),
      icon: copyTradingStatIconMap.volume,
    },
    {
      label: 'Unrealised P&L',
      value: signedUsd(summary?.unrealizedPnlUsd),
      valueClassName: getSignedMetricClassName(summary?.unrealizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Open Positions',
      value: formatCount(summary?.openPositions),
      icon: copyTradingStatIconMap.positionOpen,
    },
    {
      label: 'Active Copies',
      value: formatCount(summary?.activeCopies),
      icon: copyTradingStatIconMap.agents,
    },
  ]

  return <Leaderboard items={stats} loading={loading} />
}

type AlertsFeedProps = {
  infiniteScroll: InfiniteScrollState
  loading?: boolean
  rows: ActivityRow[]
}

const normalizeActivityCopy = (value?: string) =>
  value
    ?.trim()
    .replace(/[.!:]+$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()

const isSameActivityCopy = (left?: string, right?: string) =>
  !!left && !!right && normalizeActivityCopy(left) === normalizeActivityCopy(right)

const AlertStatusIcon = ({ tone }: { tone: ActivityTone }) => {
  if (tone === 'warning') return <AlertTriangle aria-hidden size={14} className="mt-1 shrink-0 text-warning" />

  return (
    <span
      aria-hidden
      className={cn(
        'mt-1 size-3 shrink-0 rounded-full',
        (tone === 'buy' || tone === 'capital') && 'bg-primary shadow-[0_0_8px_var(--ks-primary)]',
        tone === 'sell' && 'bg-red shadow-[0_0_8px_var(--ks-red)]',
        tone === 'fee' && 'bg-blue shadow-[0_0_8px_var(--ks-blue)]',
        tone === 'neutral' && 'bg-subText',
      )}
    />
  )
}

export const AlertsFeed = ({ infiniteScroll, loading, rows }: AlertsFeedProps) => {
  return (
    <ContentPanel title="Alerts Feed">
      <InfiniteScroll {...infiniteScroll} className="max-h-[400px]" scrollbar="vertical">
        <Stack className="gap-4 px-6 py-4">
          {rows.map(item => {
            const alert = getAlertFeedItemViewModel(item)
            const activityLabel = getActivityLabel(item)
            const summary = item.summary.trim()
            const showSummary = !!summary && !isSameActivityCopy(summary, activityLabel)

            return (
              <HStack key={alert.key} className="items-start gap-3">
                <AlertStatusIcon tone={alert.indicatorTone} />
                <Stack className="min-w-0 flex-1 gap-0.5">
                  <p className="min-w-0 break-words text-sm text-text">
                    {alert.agentAction && alert.agentTokenSymbol ? (
                      <>
                        {alert.agentName}{' '}
                        <span className={getActivityToneClassName(alert.agentAction === 'bought' ? 'buy' : 'sell')}>
                          {alert.agentAction}
                        </span>{' '}
                        {alert.agentTokenSymbol}
                        {alert.referenceId && (
                          <span className="text-subText">
                            {' '}
                            · <ShortenedId value={alert.referenceId} />
                          </span>
                        )}
                      </>
                    ) : alert.agentFallback ? (
                      alert.agentFallback
                    ) : alert.activityTone !== 'neutral' ? (
                      <>
                        {alert.agentName}{' '}
                        <span className={getActivityToneClassName(alert.activityTone)}>{activityLabel}</span>
                      </>
                    ) : (
                      `${alert.agentName} ${activityLabel}`
                    )}
                  </p>

                  {alert.userAction ? (
                    <p className="break-words text-sm text-subText">
                      Your Copy:{' '}
                      <span
                        className={cn(
                          getActivityToneClassName(alert.userTone),
                          alert.userAction === 'skipped' && 'text-text',
                        )}
                      >
                        {alert.userAction}
                      </span>
                      {alert.userAction === 'completed' && ' - details syncing'}
                      {(alert.userAction === 'bought' || alert.userAction === 'sold') && (
                        <>
                          {' '}
                          <span className="text-text">
                            {alert.userAmount} {alert.userTokenSymbol} at {alert.userPrice} {alert.userQuoteTokenSymbol}
                          </span>
                        </>
                      )}
                      {alert.userReason && <span> - {alert.userReason}</span>}
                      {alert.manualSellCopyRunId && (
                        <>
                          {' '}
                          <Link
                            className="text-red no-underline hover:text-red hover:underline"
                            to={`${APP_PATHS.COPY_TRADING}/my-copies/${alert.manualSellCopyRunId}`}
                          >
                            [Manual sell]
                          </Link>
                        </>
                      )}
                    </p>
                  ) : alert.userFallback ? (
                    <p className="break-words text-sm text-subText">{alert.userFallback}</p>
                  ) : (
                    showSummary && <p className="break-words text-sm text-subText">{summary}</p>
                  )}

                  <span className="text-sm text-subText">{formatAlertFeedTime(alert.occurredAt)}</span>
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
