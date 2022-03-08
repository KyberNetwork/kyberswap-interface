import { useEffect, useMemo, useState } from 'react'
import { TrueSightTimeframe } from 'pages/TrueSight/index'

export interface TrendingSoonChartDataItem {
  timestamp: number
  token_id: number
  token_name: string
  price: number
  market_cap: number
  number_holders: number
  trading_volume: number
}

export interface TrendingSoonChartData {
  chart_info: TrendingSoonChartDataItem[]
}

export default function useGetTrendingSoonChartData(tokenId: number | undefined, timeframe: TrueSightTimeframe) {
  const [data, setData] = useState<TrendingSoonChartData>({ chart_info: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const fetchData = async () => {
      if (tokenId) {
        try {
          const timeframeStr = timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
          const url =
            process.env.REACT_APP_TRUESIGHT_API +
            `/api/v1/trending-soon/chart-info?token_id=${tokenId}&timeframe=${timeframeStr}`
          setError(undefined)
          setIsLoading(true)
          const response = await fetch(url)
          if (response.ok) {
            const json = await response.json()
            const rawResult = json.data
            // eslint-disable-next-line @typescript-eslint/camelcase
            rawResult.chart_info = rawResult.chart_info ?? []
            setData(rawResult)
          }
          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(err)
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [timeframe, tokenId])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
