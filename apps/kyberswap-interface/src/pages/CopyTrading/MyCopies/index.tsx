import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { CopyTradingPage } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { OWNER_ADDRESS, formatDate, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'
import { cn } from 'utils/cn'

const MyCopiesView = () => {
  const navigate = useNavigate()
  const { data: ownerSummary } = copyTradingApi.useGetOwnerCopySummaryQuery({
    ownerAddress: OWNER_ADDRESS,
  })
  const { data: activeRuns } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'active',
  })
  const { data: activity } = copyTradingApi.useGetOwnerActivityQuery({
    ownerAddress: OWNER_ADDRESS,
  })
  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery()
  const summary = ownerSummary?.data
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
      value: String(summary?.activeCopies || activeRuns?.data.length || 0),
      icon: copyTradingStatIconMap.agents,
    },
  ]

  return (
    <CopyTradingPage>
      <Stack className="gap-3.5">
        <h1 className="text-4xl font-medium text-text">
          Open <span className="text-primary">Copies</span>
        </h1>
        <p className="text-lg text-subText">Monitor and manage all your active copy positions.</p>
      </Stack>
      <Leaderboard items={stats} />
      <ActiveSubscriptionsTable
        agents={leaderboard?.data || []}
        rows={activeRuns?.data || []}
        onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${subscription.copyRunId}`)}
      />
      <Stack className="gap-5 rounded-xl bg-buttonBlack p-7">
        <HStack className="items-center gap-2">
          <span className="text-sm font-medium uppercase text-subText">Alerts Feed</span>
          <span className="rounded bg-primary-12 px-2 py-0.5 text-xs font-medium text-primary">LIVE</span>
        </HStack>
        {(activity?.data || []).map((item, index) => (
          <HStack key={item.activityId} className="items-start gap-3.5">
            <span className={cn('size-2 shrink-0 rounded-full', index === 0 ? 'bg-blue' : 'bg-primary')} />
            <Stack className="gap-1">
              <span className="text-sm text-text">{item.summary}</span>
              <span className="text-sm text-subText">{formatDate(item.occurredAt)}</span>
            </Stack>
          </HStack>
        ))}
      </Stack>
    </CopyTradingPage>
  )
}

export default MyCopiesView
