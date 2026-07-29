import type { OwnerCopySummary } from 'services/copyTrading/types'

import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { formatUsd, signedUsd } from 'pages/CopyTrading/helpers'

type CopyHistorySummaryProps = {
  summary?: OwnerCopySummary
}

export const CopyHistorySummary = ({ summary }: CopyHistorySummaryProps) => {
  const historyStats: LeaderboardStat[] = [
    {
      label: 'Realised P&L (All time)',
      value: signedUsd(summary?.realizedPnlUsd),
      icon: copyTradingStatIconMap.money,
    },
    {
      label: 'Closed Positions',
      value: summary?.closedPositions || '—',
      icon: copyTradingStatIconMap.positionClose,
    },
    {
      label: 'Closed Capital (Returned)',
      value: formatUsd(summary?.closedCapitalUsd),
      icon: copyTradingStatIconMap.volume,
    },
  ]

  return <Leaderboard items={historyStats} />
}
