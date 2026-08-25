import { useMemo, useState } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import type { AgentStats as AgentStatsData } from 'services/copyTrading/types/agents'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import { Stack } from 'components/Stack'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { ResponsiveDetailContents, ResponsiveDetailItem } from 'pages/CopyTrading/components/common/layout'
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

const AgentCumulativeRealisedPnlChart = ({ agentId }: AgentStatsProps) => {
  const [realizedPnlWindow, setRealizedPnlWindow] = useState<PerformanceWindow>('30d')
  const realizedPnlInterval = realizedPnlWindow === 'all' ? 'month' : 'day'

  const {
    data: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = agentApi.useGetAgentPerformanceQuery(
    {
      agentId,
      interval: realizedPnlInterval,
      limit: 100,
      series: 'cumulative_realized_pnl',
      window: realizedPnlWindow,
    },
    { pollingInterval: 10_000 },
  )

  const realizedPnlData = useMemo(
    () => (realizedPnlPerformance?.data || []).map(toPerformanceChartPoint),
    [realizedPnlPerformance?.data],
  )

  return (
    <CumulativeRealisedPnlChart
      collapsible
      data={realizedPnlData}
      isError={isRealizedPnlError}
      isFetching={isRealizedPnlFetching}
      onWindowChange={setRealizedPnlWindow}
      window={realizedPnlWindow}
    />
  )
}

const AgentCapitalValueChart = ({ agentId }: AgentStatsProps) => {
  const [capitalValueWindow, setCapitalValueWindow] = useState<PerformanceWindow>('30d')
  const capitalValueInterval = capitalValueWindow === 'all' ? 'month' : 'day'

  const {
    data: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = agentApi.useGetAgentPerformanceQuery(
    {
      agentId,
      interval: capitalValueInterval,
      limit: 100,
      series: 'portfolio_value',
      window: capitalValueWindow,
    },
    { pollingInterval: 10_000 },
  )

  const portfolioData = useMemo(
    () => (portfolioPerformance?.data || []).map(toPerformanceChartPoint),
    [portfolioPerformance?.data],
  )

  return (
    <CapitalValueChart
      collapsible
      data={portfolioData}
      isError={isPortfolioError}
      isFetching={isPortfolioFetching}
      onWindowChange={setCapitalValueWindow}
      title="Capital Value"
      window={capitalValueWindow}
    />
  )
}

const AgentStats = ({ agentId }: AgentStatsProps) => {
  const { data: agentStats } = agentApi.useGetAgentStatsQuery({ agentId }, { pollingInterval: 10_000 })
  const stats = agentStats?.data

  return (
    <ResponsiveDetailContents className="min-w-0">
      <ResponsiveDetailItem>
        <Leaderboard items={getProfileStats(stats)} size="sm" />
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.performance}>
        <Stack className="gap-6 rounded-xl bg-buttonBlack p-6 max-md:-mx-4 max-md:gap-4 max-md:rounded-none max-md:p-4">
          <AgentCumulativeRealisedPnlChart agentId={agentId} />
          <AgentCapitalValueChart agentId={agentId} />
        </Stack>
      </ResponsiveDetailItem>
    </ResponsiveDetailContents>
  )
}

export default AgentStats
