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

const CopyRunPerformance = ({ copyRunId, status }: CopyRunPerformanceProps) => {
  const { ownerAddress } = useCopyTradingContext()
  const [window, setWindow] = useState<PerformanceWindow>('30d')

  const isTerminal = status === 'stopped' || status === 'closed'
  const performanceWindow = isTerminal ? 'all' : window
  const interval = performanceWindow === 'all' ? 'month' : 'day'

  const {
    currentData: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval,
      limit: 100,
      series: 'portfolio_value',
      window: performanceWindow,
    },
    { pollingInterval: 10_000, skip: !ownerAddress || isTerminal },
  )

  const {
    currentData: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = copyRunApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval,
      limit: 100,
      series: 'cumulative_realized_pnl',
      window: performanceWindow,
    },
    { pollingInterval: 10_000, skip: !ownerAddress },
  )

  const portfolioData = useMemo(
    () => (portfolioPerformance?.data || []).map(toPerformanceChartPoint),
    [portfolioPerformance?.data],
  )

  const realizedPnlData = useMemo(
    () => (realizedPnlPerformance?.data || []).map(toPerformanceChartPoint),
    [realizedPnlPerformance?.data],
  )

  return (
    <Stack className="gap-6 rounded-xl bg-buttonBlack p-6">
      <CumulativeRealisedPnlChart
        data={realizedPnlData}
        isError={isRealizedPnlError}
        isFetching={isRealizedPnlFetching}
        onWindowChange={isTerminal ? undefined : setWindow}
        window={isTerminal ? undefined : performanceWindow}
      />
      {!isTerminal && (
        <CapitalValueChart data={portfolioData} isError={isPortfolioError} isFetching={isPortfolioFetching} />
      )}
    </Stack>
  )
}

export default CopyRunPerformance
