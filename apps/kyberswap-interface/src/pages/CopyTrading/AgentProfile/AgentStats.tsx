import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { AgentStats as AgentStatsData, PerformanceWindow } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, percent, signedUsd } from 'pages/CopyTrading/helpers'

const getProfileStats = (stats?: AgentStatsData): LeaderboardStat[] => [
  {
    label: 'Total Realised P&L',
    value: signedUsd(stats?.totalRealizedPnlUsd),
    icon: copyTradingStatIconMap.money,
  },
  {
    label: 'Copiers',
    value: String(stats?.copiers || 0),
    icon: copyTradingStatIconMap.users,
  },
  {
    label: 'Win Rate',
    value: percent(stats?.winRatePct),
    icon: copyTradingStatIconMap.positionOpen,
  },
  {
    label: 'AUM',
    value: compactUsd(stats?.aumUsd),
    icon: copyTradingStatIconMap.volume,
  },
]

type AgentStatsProps = {
  agentId: string
}

const AgentStats = ({ agentId }: AgentStatsProps) => {
  const [window, setWindow] = useState<PerformanceWindow>('30d')

  const { data: agentStats } = copyTradingApi.useGetAgentStatsQuery({ agentId })
  const {
    data: performance,
    isError,
    isFetching,
  } = copyTradingApi.useGetAgentPerformanceQuery({
    agentId,
    interval: 'day',
    limit: 60,
    series: 'portfolio_value',
    window,
  })
  const stats = agentStats?.data
  const chartData = useMemo(() => (performance?.data || []).map(toPerformanceChartPoint), [performance?.data])

  return (
    <Stack className="min-w-0 gap-5">
      <Leaderboard items={getProfileStats(stats)} size="sm" />
      <Stack className="gap-6 rounded-xl bg-buttonBlack p-6">
        <CumulativeRealisedPnlChart
          data={chartData}
          isError={isError}
          isFetching={isFetching}
          onWindowChange={setWindow}
          window={window}
        />
        <CapitalValueChart
          data={chartData}
          isError={isError}
          isFetching={isFetching}
          title="Assets Under Management ($)"
        />
      </Stack>
    </Stack>
  )
}

export default AgentStats
