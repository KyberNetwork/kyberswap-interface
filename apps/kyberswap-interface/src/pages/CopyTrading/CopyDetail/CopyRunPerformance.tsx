import { useMemo, useState } from 'react'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import { Stack } from 'components/Stack'
import {
  CapitalValueChart,
  CumulativeTotalPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

// Product decision: performance charts intentionally use only page 1 and do not follow pagination cursors.
const PERFORMANCE_CHART_LIMIT = 100

type CopyRunPerformanceProps = {
  copyRunId: string
  status: CopyRunSummary['status']
}

const CopyRunCumulativeTotalPnlChart = ({ copyRunId, status }: CopyRunPerformanceProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [totalPnlWindow, setTotalPnlWindow] = useState<PerformanceWindow>('30d')
  const isTerminal = status === 'stopped' || status === 'closed'
  const performanceTotalPnlWindow = isTerminal ? 'all' : totalPnlWindow
  const totalPnlInterval = performanceTotalPnlWindow === 'all' ? 'month' : 'day'

  const {
    data: totalPnlPerformance,
    isError: isTotalPnlError,
    isFetching: isTotalPnlFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval: totalPnlInterval,
      limit: PERFORMANCE_CHART_LIMIT,
      series: 'cumulative_total_pnl',
      window: performanceTotalPnlWindow,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
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
      onWindowChange={isTerminal ? undefined : setTotalPnlWindow}
      window={isTerminal ? undefined : performanceTotalPnlWindow}
    />
  )
}

type CopyRunCapitalValueChartProps = Pick<CopyRunPerformanceProps, 'copyRunId'>

const CopyRunCapitalValueChart = ({ copyRunId }: CopyRunCapitalValueChartProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [capitalValueWindow, setCapitalValueWindow] = useState<PerformanceWindow>('30d')
  const capitalValueInterval = capitalValueWindow === 'all' ? 'month' : 'day'

  const {
    data: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval: capitalValueInterval,
      limit: PERFORMANCE_CHART_LIMIT,
      series: 'portfolio_value',
      window: capitalValueWindow,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
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
      window={capitalValueWindow}
    />
  )
}

const CopyRunPerformance = ({ copyRunId, status }: CopyRunPerformanceProps) => {
  const isTerminal = status === 'stopped' || status === 'closed'

  return (
    <Stack className="gap-6 rounded-xl bg-buttonBlack p-6 max-md:-mx-4 max-md:gap-4 max-md:rounded-none max-md:p-4">
      <CopyRunCumulativeTotalPnlChart copyRunId={copyRunId} status={status} />
      {!isTerminal && <CopyRunCapitalValueChart copyRunId={copyRunId} />}
    </Stack>
  )
}

export default CopyRunPerformance
