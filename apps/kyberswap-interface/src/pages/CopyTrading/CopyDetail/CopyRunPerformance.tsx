import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PerformanceWindow } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  mergePerformancePoints,
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
  const isClosed = status === 'closed'
  const performanceWindow = isClosed ? 'all' : window
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
    { skip: !ownerAddress },
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
  const chartData = useMemo(
    () =>
      mergePerformancePoints(portfolioPerformance?.data || [], realizedPnlPerformance?.data || []).map(
        toPerformanceChartPoint,
      ),
    [portfolioPerformance?.data, realizedPnlPerformance?.data],
  )
  const isError = isPortfolioError || isRealizedPnlError
  const isFetching = isPortfolioFetching || isRealizedPnlFetching

  return (
    <Stack className="gap-6 rounded-xl bg-buttonBlack p-6">
      <CumulativeRealisedPnlChart
        data={chartData}
        isError={isError}
        isFetching={isFetching}
        onWindowChange={isClosed ? undefined : setWindow}
        window={isClosed ? undefined : performanceWindow}
      />
      {!isClosed && <CapitalValueChart data={chartData} isError={isError} isFetching={isFetching} />}
    </Stack>
  )
}

export default CopyRunPerformance
