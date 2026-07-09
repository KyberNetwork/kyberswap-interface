import { useNavigate } from 'react-router-dom'
import copyTradingApi from 'services/copyTrading'

import { APP_PATHS } from 'constants/index'
import ClosedSubscriptionsTable from 'pages/CopyTrading/CopyHistory/ClosedSubscriptionsTable'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { CopyTradingPage } from 'pages/CopyTrading/components/common'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
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

  const historyStats: LeaderboardStat[] = [
    {
      label: 'Realised P&L (All time)',
      value: signedUsd(totalRealizedPnl),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Closed Positions',
      value: String(totalClosedPositions),
      icon: copyTradingStatIconMap.positionClose,
    },
    {
      label: 'Closed Capital (Returned)',
      value: formatUsd(totalClosedCapital),
      icon: copyTradingStatIconMap.volume,
    },
  ]

  return (
    <CopyTradingPage>
      <h1 className="text-4xl font-medium text-text">History</h1>
      <Leaderboard items={historyStats} />
      <ClosedSubscriptionsTable
        agents={leaderboard?.data || []}
        rows={closedRuns?.data || []}
        onOpenSubscription={subscription => navigate(`${APP_PATHS.COPY_TRADING}/history/${subscription.copyRunId}`)}
      />
    </CopyTradingPage>
  )
}

export default CopyHistoryView
