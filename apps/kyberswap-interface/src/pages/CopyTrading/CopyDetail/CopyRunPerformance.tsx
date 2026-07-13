import { useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { CopyRunSummary, PerformanceWindow } from 'services/copyTrading/types'

import { Stack } from 'components/Stack'
import {
  CapitalValueChart,
  CumulativeRealisedPnlChart,
  toPerformanceChartPoint,
} from 'pages/CopyTrading/components/PerformanceCharts'
import { OWNER_ADDRESS } from 'pages/CopyTrading/helpers'

type CopyRunPerformanceProps = {
  copyRunId: string
  status: CopyRunSummary['status']
}

const CopyRunPerformance = ({ copyRunId, status }: CopyRunPerformanceProps) => {
  const [window, setWindow] = useState<PerformanceWindow>('30d')
  const isClosed = status === 'closed'
  const performanceWindow = isClosed ? 'all' : window
  const {
    data: performance,
    isError,
    isFetching,
  } = copyTradingApi.useGetCopyRunPerformanceQuery({
    ownerAddress: OWNER_ADDRESS,
    copyRunId,
    interval: 'day',
    limit: 60,
    series: 'portfolio_value',
    window: performanceWindow,
  })
  const chartData = useMemo(() => (performance?.data || []).map(toPerformanceChartPoint), [performance?.data])

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
