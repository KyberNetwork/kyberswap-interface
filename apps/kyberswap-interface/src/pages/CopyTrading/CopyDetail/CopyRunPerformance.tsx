import { useMemo, useState } from 'react'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PerformanceWindow } from 'services/copyTrading/types/primitives'

import { Stack } from 'components/Stack'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { useCopyTradingContext } from 'pages/CopyTrading/context'

type CopyRunPerformanceProps = {
  copyRunId: string
  status: CopyRunSummary['status']
}

const CopyRunCumulativeRealisedPnlChart = ({ copyRunId, status }: CopyRunPerformanceProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [realizedPnlWindow, setRealizedPnlWindow] = useState<PerformanceWindow>('30d')
  const isTerminal = status === 'stopped' || status === 'closed'
  const performanceRealizedPnlWindow = isTerminal ? 'all' : realizedPnlWindow
  const realizedPnlInterval = performanceRealizedPnlWindow === 'all' ? 'month' : 'day'

  const {
    currentData: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval: realizedPnlInterval,
      limit: 100,
      series: 'cumulative_realized_pnl',
      window: performanceRealizedPnlWindow,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
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
      onWindowChange={isTerminal ? undefined : setRealizedPnlWindow}
      window={isTerminal ? undefined : performanceRealizedPnlWindow}
    />
  )
}

type CopyRunCapitalValueChartProps = Pick<CopyRunPerformanceProps, 'copyRunId'>

const CopyRunCapitalValueChart = ({ copyRunId }: CopyRunCapitalValueChartProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [capitalValueWindow, setCapitalValueWindow] = useState<PerformanceWindow>('30d')
  const capitalValueInterval = capitalValueWindow === 'all' ? 'month' : 'day'

  const {
    currentData: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval: capitalValueInterval,
      limit: 100,
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
      <CopyRunCumulativeRealisedPnlChart copyRunId={copyRunId} status={status} />
      {!isTerminal && <CopyRunCapitalValueChart copyRunId={copyRunId} />}
    </Stack>
  )
}

export default CopyRunPerformance
