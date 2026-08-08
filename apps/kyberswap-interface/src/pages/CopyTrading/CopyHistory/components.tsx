import type { OwnerCopySummary } from 'services/copyTrading/types'

import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatCount, formatUsd, signedUsd } from 'pages/CopyTrading/helpers'

type CopyHistorySummaryProps = {
  summary?: OwnerCopySummary
}

export const CopyHistorySummary = ({ summary }: CopyHistorySummaryProps) => {
  const historyStats: LeaderboardStat[] = [
    {
      label: 'Realised P&L (All time)',
      value: signedUsd(summary?.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
      status: summary?.metrics.realizedPnlUsd?.status,
    },
    {
      label: 'Closed Positions in History Runs',
      value: formatCount(summary?.closedPositions),
      icon: copyTradingStatIconMap.positionClose,
      status: summary?.metrics.closedPositionCount?.status,
    },
    {
      label: 'Closed Capital (Returned)',
      value: formatUsd(summary?.closedCapitalUsd),
      icon: copyTradingStatIconMap.volume,
      status: summary?.metrics.closedCapitalUsd?.status,
    },
  ]

  return <Leaderboard items={historyStats} />
}
