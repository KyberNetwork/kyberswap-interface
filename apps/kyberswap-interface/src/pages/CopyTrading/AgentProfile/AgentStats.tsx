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
import {
  compactUsd,
  formatCount,
  getSignedMetricClassName,
  getWinRateClassName,
  percent,
  signedUsd,
} from 'pages/CopyTrading/helpers'

const getProfileStats = (stats?: AgentStatsData): LeaderboardStat[] => [
  {
    label: 'Total Realised P&L',
    value: signedUsd(stats?.totalRealizedPnlUsd),
    valueClassName: getSignedMetricClassName(stats?.totalRealizedPnlUsd),
    icon: copyTradingStatIconMap.pnl,
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
    valueClassName: getWinRateClassName(stats?.winRatePct),
    icon: copyTradingStatIconMap.winRate,
    status: stats?.metrics.winRatePct?.status,
  },
  {
    label: 'AUM',
    value: compactUsd(stats?.aumUsd),
    icon: copyTradingStatIconMap.aum,
    status: stats?.metrics.aumUsd?.status,
  },
]

type AgentStatsProps = {
  agentId: string
}

const AgentStats = ({ agentId }: AgentStatsProps) => {
  const [window, setWindow] = useState<PerformanceWindow>('30d')

  const interval = window === 'all' ? 'month' : 'day'

  const { data: agentStats } = agentApi.useGetAgentStatsQuery({ agentId }, { pollingInterval: 10_000 })

  const {
    data: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = agentApi.useGetAgentPerformanceQuery(
    {
      agentId,
      interval,
      limit: 100,
      series: 'portfolio_value',
      window,
    },
    { pollingInterval: 10_000 },
  )

  const {
    data: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = agentApi.useGetAgentPerformanceQuery(
    {
      agentId,
      interval,
      limit: 100,
      series: 'cumulative_realized_pnl',
      window,
    },
    { pollingInterval: 10_000 },
  )

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
      <Stack className="gap-6 rounded-xl bg-buttonBlack p-6 max-md:-mx-4 max-md:gap-4 max-md:rounded-none max-md:p-4">
        <CumulativeRealisedPnlChart
          collapsible
          data={realizedPnlData}
          isError={isRealizedPnlError}
          isFetching={isRealizedPnlFetching}
          onWindowChange={setWindow}
          window={window}
        />
        <CapitalValueChart
          collapsible
          data={portfolioData}
          isError={isPortfolioError}
          isFetching={isPortfolioFetching}
          title="Capital Value"
        />
      </Stack>
    </Stack>
  )
}

export default AgentStats
