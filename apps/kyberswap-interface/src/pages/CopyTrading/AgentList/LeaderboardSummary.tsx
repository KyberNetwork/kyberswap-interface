import type { LeaderboardSummary as LeaderboardSummaryData } from 'services/copyTrading/types'

import { StatCard } from 'pages/CopyTrading/components/common'
import { compactUsd } from 'pages/CopyTrading/helpers'

const LeaderboardSummary = ({
  summary,
  fallbackAgentCount,
}: {
  summary?: LeaderboardSummaryData
  fallbackAgentCount?: number
}) => {
  const stats = [
    {
      icon: 'agent',
      value: String(summary?.totalAgents || fallbackAgentCount || 0),
      label: 'Total Agents',
      color: 'bg-warning-20 text-warning',
    },
    {
      icon: 'aum',
      value: compactUsd(summary?.totalAumUsd),
      label: 'Total AUM',
      color: 'bg-blue/20 text-blue',
    },
    {
      icon: 'copiers',
      value: String(summary?.totalCopiers || 0),
      label: 'Total Copiers',
      color: 'bg-primary-20 text-primary',
    },
    {
      icon: 'volume',
      value: compactUsd(summary?.totalVolumeUsd),
      label: 'Total Volume',
      color: 'bg-primary-12 text-primary',
    },
  ] as const

  return (
    <div className="grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
      {stats.map(item => (
        <StatCard key={item.label} item={item} />
      ))}
    </div>
  )
}

export default LeaderboardSummary
