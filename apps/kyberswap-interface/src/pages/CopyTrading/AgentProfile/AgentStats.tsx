import { useMemo, useState } from 'react'
import agentApi from 'services/copyTrading/api/endpoints/agents'
import type { AgentStats as AgentStatsData } from 'services/copyTrading/types/agents'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import { Stack } from 'components/Stack'
import { agentProfileResponsiveOrder } from 'pages/CopyTrading/AgentProfile/responsiveOrder'
import Leaderboard, { type LeaderboardStat } from 'pages/CopyTrading/components/Leaderboard'
import {
  CapitalValueChart,
  CumulativeTotalPnlChart,
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

// Product decision: performance charts intentionally use only page 1 and do not follow pagination cursors.
const PERFORMANCE_CHART_LIMIT = 100

const getProfileStats = (stats?: AgentStatsData): LeaderboardStat[] => [
  {
    label: 'Total Realised P&L',
    value: signedUsd(stats?.totalRealizedPnlUsd),
    valueClassName: getSignedMetricClassName(stats?.totalRealizedPnlUsd),
    icon: copyTradingStatIconMap.pnl,
  },
  {
    label: 'Copiers',
    value: formatCount(stats?.copiers),
    icon: copyTradingStatIconMap.users,
  },
  {
    label: 'Win Rate',
    value: percent(stats?.winRatePct),
    valueClassName: getWinRateClassName(stats?.winRatePct),
    icon: copyTradingStatIconMap.winRate,
  },
  {
    label: 'AUM',
    value: compactUsd(stats?.aumUsd),
    icon: copyTradingStatIconMap.aum,
  },
]

type AgentStatsProps = {
  agentId: string
}

const AgentCumulativeTotalPnlChart = ({ agentId }: AgentStatsProps) => {
  const [totalPnlWindow, setTotalPnlWindow] = useState<PerformanceWindow>('30d')
  const totalPnlInterval = totalPnlWindow === 'all' ? 'month' : 'day'

  const {
    data: totalPnlPerformance,
    isError: isTotalPnlError,
    isFetching: isTotalPnlFetching,
  } = agentApi.useGetAgentPerformanceQuery(
    {
      agentId,
      interval: totalPnlInterval,
      limit: PERFORMANCE_CHART_LIMIT,
      series: 'cumulative_total_pnl',
      window: totalPnlWindow,
    },
    { pollingInterval: 10_000 },
  )

  const totalPnlData = useMemo(
    () => (totalPnlPerformance?.data || []).map(toPerformanceChartPoint),
    [totalPnlPerformance?.data],
  )

  return (
    <CumulativeTotalPnlChart
      collapsible
      data={totalPnlData}
      isError={isTotalPnlError}
      isFetching={isTotalPnlFetching}
      onWindowChange={setTotalPnlWindow}
      window={totalPnlWindow}
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
      limit: PERFORMANCE_CHART_LIMIT,
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
  const { currentData: agentStats, isFetching: isAgentStatsFetching } = agentApi.useGetAgentStatsQuery(
    { agentId },
    { pollingInterval: 10_000 },
  )
  const stats = agentStats?.data

  return (
    <ResponsiveDetailContents className="min-w-0">
      <ResponsiveDetailItem>
        <Leaderboard items={getProfileStats(stats)} loading={!agentStats && isAgentStatsFetching} size="sm" />
      </ResponsiveDetailItem>
      <ResponsiveDetailItem responsiveOrder={agentProfileResponsiveOrder.performance}>
        <Stack className="gap-6 rounded-xl bg-buttonBlack p-6 max-md:-mx-4 max-md:gap-4 max-md:rounded-none max-md:p-4">
          <AgentCumulativeTotalPnlChart agentId={agentId} />
          <AgentCapitalValueChart agentId={agentId} />
        </Stack>
      </ResponsiveDetailItem>
    </ResponsiveDetailContents>
  )
}

export default AgentStats
