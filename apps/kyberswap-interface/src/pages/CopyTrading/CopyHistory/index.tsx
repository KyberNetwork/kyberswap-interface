import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { Stack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import { StatCard, type StatItem } from 'pages/CopyTrading/components/Stats'
import { OWNER_ADDRESS, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'

const CopyHistoryView = () => {
  const navigate = useNavigate()
  const { data: closedRuns } = copyTradingApi.useGetCopyRunsQuery({
    ownerAddress: OWNER_ADDRESS,
    status: 'closed',
  })
  const { data: leaderboard } = copyTradingApi.useGetLeaderboardQuery()
  const closedRunData = closedRuns?.data || []
  const totalRealizedPnl = closedRunData.reduce((total, run) => total + Number(run.realizedPnlUsd || 0), 0).toString()
  const totalClosedPositions = closedRunData.reduce((total, run) => total + run.closedTradeCount, 0)
  const totalClosedCapital = closedRunData
    .reduce((total, run) => total + Number(run.capitalOutUsd || run.capitalInUsd || 0), 0)
    .toString()

  const historyStats: StatItem[] = [
    {
      icon: 'aum',
      value: signedUsd(totalRealizedPnl),
      label: 'Realised P&L (All time)',
      color: 'bg-blue/20 text-blue',
    },
    {
      icon: 'copiers',
      value: String(totalClosedPositions),
      label: 'Closed Positions',
      color: 'bg-primary-20 text-primary',
    },
    {
      icon: 'volume',
      value: formatUsd(totalClosedCapital),
      label: 'Closed Capital (Returned)',
      color: 'bg-primary-12 text-primary',
    },
  ]

  return (
    <main className="min-w-0 flex-1 px-10 py-14 max-md:px-4">
      <Stack className="w-full gap-7">
        <h1 className="m-0 text-4xl font-semibold leading-tight text-text">History</h1>
        <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
          {historyStats.map(item => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>
        <ClosedSubscriptionsTable
          agents={leaderboard?.data || []}
          rows={closedRuns?.data || []}
          onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
        />
      </Stack>
    </main>
  )
}

export default CopyHistoryView
