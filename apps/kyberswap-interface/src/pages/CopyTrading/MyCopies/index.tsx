import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { HStack, Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import ActiveSubscriptionsTable from 'pages/CopyTrading/MyCopies/ActiveSubscriptionsTable'
import { StatCard, type StatItem } from 'pages/CopyTrading/components/Stats'
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
  const stats: StatItem[] = [
    {
      icon: 'volume',
      value: formatUsd(summary?.totalAllocatedUsd),
      label: 'Total Allocated',
      color: 'bg-primary-12 text-primary',
    },
    {
      icon: 'aum',
      value: signedUsd(summary?.unrealizedPnlUsd),
      label: 'Unrealised P&L',
      color: 'bg-blue/20 text-blue',
    },
    {
      icon: 'copiers',
      value: String(summary?.openPositions || 0),
      label: 'Open Positions',
      color: 'bg-primary-20 text-primary',
    },
    {
      icon: 'agent',
      value: String(summary?.activeCopies || activeRuns?.data.length || 0),
      label: 'Active Copies',
      color: 'bg-warning-20 text-warning',
    },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-14 max-md:px-4">
      <Stack className="w-full gap-7">
        <Stack className="gap-3.5">
          <h1 className="m-0 text-4xl font-semibold leading-tight text-text">
            Open <span className="font-normal text-primary">Copies</span>
          </h1>
          <p className="m-0 text-lg text-subText">Monitor and manage all your active copy positions.</p>
        </Stack>
        <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {stats.map(item => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
        <ActiveSubscriptionsTable
          agents={leaderboard?.data || []}
          rows={activeRuns?.data || []}
          onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/my-copies/${subscription.copyRunId}`)}
        />
        <Stack className="gap-5 rounded-xl bg-buttonBlack p-7">
          <HStack className="items-center gap-2">
            <span className="text-sm font-semibold uppercase text-subText">Alerts Feed</span>
            <span className="rounded bg-primary-12 px-2 py-0.5 text-xs font-semibold text-primary">LIVE</span>
          </HStack>
          {(activity?.data || []).map((item, index) => (
            <HStack key={item.activityId} className="gap-3.5">
              <span className={cn('mt-1 size-2 rounded-full', index === 0 ? 'bg-blue' : 'bg-primary')} />
              <Stack className="gap-1">
                <span className="text-sm text-text">{item.summary}</span>
                <span className="text-sm text-subText">{formatDate(item.occurredAt)}</span>
              </Stack>
            </HStack>
          ))}
        </Stack>
      </Stack>
    </main>
  )
}

export default MyCopiesView
