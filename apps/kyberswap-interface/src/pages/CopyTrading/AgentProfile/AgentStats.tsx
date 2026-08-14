import { useMemo, useState } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import type { AgentStats as AgentStatsData } from 'services/copyTrading/types/agents'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import { Stack } from 'components/Stack'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { copyTradingStatIconMap } from 'pages/CopyTrading/constants'
import { compactUsd, formatCount, percent, signedUsd } from 'pages/CopyTrading/helpers'

const getProfileStats = (stats?: AgentStatsData): LeaderboardStat[] => [
  {
    label: 'Total Realised P&L',
    value: signedUsd(stats?.totalRealizedPnlUsd),
    icon: copyTradingStatIconMap.money,
    status: stats?.metrics.totalRealizedPnlUsd?.status,
  },
  {
    label: 'Copiers',
    value: formatCount(stats?.copiers),
    icon: copyTradingStatIconMap.users,
    status: stats?.metrics.copiers?.status,
  },
  {
    label: 'Win Rate',
    value: percent(stats?.winRatePct),
    icon: copyTradingStatIconMap.positionOpen,
    status: stats?.metrics.winRatePct?.status,
  },
  {
    label: 'AUM',
    value: compactUsd(stats?.aumUsd),
    icon: copyTradingStatIconMap.volume,
    status: stats?.metrics.aumUsd?.status,
  },
]

type AgentStatsProps = {
  agentId: string
}

const AgentStats = ({ agentId }: AgentStatsProps) => {
  const [window, setWindow] = useState<PerformanceWindow>('30d')

  const interval = window === 'all' ? 'month' : 'day'

  const { data: agentStats } = agentApi.useGetAgentStatsQuery({ agentId })

  const {
    data: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = agentApi.useGetAgentPerformanceQuery({
    agentId,
    interval,
    limit: 100,
    series: 'portfolio_value',
    window,
  })

  const {
    data: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = agentApi.useGetAgentPerformanceQuery({
    agentId,
    interval,
    limit: 100,
    series: 'cumulative_realized_pnl',
    window,
  })

  const stats = agentStats?.data
  const portfolioData = useMemo(
    () => (portfolioPerformance?.data || []).map(toPerformanceChartPoint),
    [portfolioPerformance?.data],
  )

  const realizedPnlData = useMemo(
    () => (realizedPnlPerformance?.data || []).map(toPerformanceChartPoint),
    [realizedPnlPerformance?.data],
  )

  return (
    <Stack className="min-w-0 gap-4">
      <Leaderboard items={getProfileStats(stats)} size="sm" />
      <Stack className="gap-6 rounded-xl bg-buttonBlack p-6">
        <CumulativeRealisedPnlChart
          data={realizedPnlData}
          isError={isRealizedPnlError}
          isFetching={isRealizedPnlFetching}
          onWindowChange={setWindow}
          window={window}
        />
        <CapitalValueChart
          data={portfolioData}
          isError={isPortfolioError}
          isFetching={isPortfolioFetching}
          title="Portfolio Equity ($)"
        />
      </Stack>
    </Stack>
  )
}

export default AgentStats
