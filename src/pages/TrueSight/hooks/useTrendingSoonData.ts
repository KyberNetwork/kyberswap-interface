import { useEffect, useMemo, useState } from 'react'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'

export interface TrendingSoonTokenData {
  token_id: number
  id_of_sources: {
    CoinGecko: string
    CoinMarketCap: string
  }
  order: number
  name: string
  symbol: string
  rank: number
  platforms: {
    [p: string]: string
  }
  present_on_chains: string[]
  predicted_date: number
  market_cap: number
  number_holders: number
  trading_volume: number
  price: number
  social_urls: {
    [p: string]: string
  }
  tags: string[]
  discovered_on: number
}

export interface TrendingSoonResponse {
  total_number_tokens: number
  tokens: TrendingSoonTokenData[]
}

export default function useTrendingSoonData(filter: TrueSightFilter, currentPage: number, itemPerPage: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<TrendingSoonResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeframe = filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
        const url = `${
          process.env.REACT_APP_TRUESIGHT_API
        }/api/v1/trending-soon?timeframe=${timeframe}&page_number=${currentPage -
          1}&page_size=${itemPerPage}&search_token_name=`
        setIsLoading(true)
        const response = await fetch(url)
        if (response.ok) {
          const json = await response.json()
          const result: TrendingSoonResponse = json.data
          const sortedResult = {
            ...result,
            tokens: result.tokens ? result.tokens.sort((a, b) => a.rank - b.rank) : []
          }
          setData(sortedResult)
        }
        setIsLoading(false)
      } catch (err) {
        setError(err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, filter, itemPerPage])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
