import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PerformanceWindow } from 'services/copyTrading/types'

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
  const isStopped = status === 'stopped' || status === 'closed'
  const performanceWindow = isStopped ? 'all' : window
  const interval = performanceWindow === 'all' ? 'month' : 'day'
  const {
    data: portfolioPerformance,
    isError: isPortfolioError,
    isFetching: isPortfolioFetching,
  } = copyTradingApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval,
      limit: 100,
      series: 'portfolio_value',
      window: performanceWindow,
    },
    { skip: !ownerAddress || isStopped },
  )
  const {
    data: realizedPnlPerformance,
    isError: isRealizedPnlError,
    isFetching: isRealizedPnlFetching,
  } = copyTradingApi.useGetCopyRunPerformanceQuery(
    {
      ownerAddress: ownerAddress || '',
      copyRunId,
      interval,
      limit: 100,
      series: 'cumulative_realized_pnl',
      window: performanceWindow,
    },
    { skip: !ownerAddress },
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
        onWindowChange={isStopped ? undefined : setWindow}
        window={isStopped ? undefined : performanceWindow}
      />
      {!isStopped && (
        <CapitalValueChart data={portfolioData} isError={isPortfolioError} isFetching={isPortfolioFetching} />
      )}
    </Stack>
  )
}

export default CopyRunPerformance
