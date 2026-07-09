import type { CopyRunSummary } from 'services/copyTrading/types'

import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatUsd, signedUsd } from 'pages/CopyTrading/helpers'

type CopyHistorySummaryProps = {
  rows: CopyRunSummary[]
}

export const CopyHistorySummary = ({ rows }: CopyHistorySummaryProps) => {
  const totalRealizedPnl = rows.reduce((total, run) => total + Number(run.realizedPnlUsd || 0), 0).toString()
  const totalClosedPositions = rows.reduce((total, run) => total + run.closedTradeCount, 0)
  const totalClosedCapital = rows
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

  return <Leaderboard items={historyStats} />
}
