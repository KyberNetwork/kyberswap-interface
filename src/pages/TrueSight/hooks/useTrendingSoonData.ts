import { useEffect, useMemo, useState } from 'react'

interface TrendingSoonTokenData {
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
    bsc: string
  }
  present_on_chains: string[]
  predicted_date: number
  market_cap: number
  number_holders: number
  trading_volume: number
  price: number
  social_urls: {
    twitter: string
  }
  tags: string[]
  discovered_on: number
}

interface TrendingSoonResponse {
  total_number_tokens: number
  tokens: TrendingSoonTokenData[]
}

export default function useTrendingSoonData() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<TrendingSoonResponse>()

  useEffect(() => {
    const fetchData = async () => {
      const url = `${process.env.REACT_APP_TRUESIGHT_API}/api/v1/trending-soon?timeframe=24h&page_number=0&page_size=10`
      setIsLoading(true)
      const response = await fetch(url)
      if (response.ok) {
        const { data: result } = await response.json()
        setData(result)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  return useMemo(() => ({ isLoading, data }), [data, isLoading])
}
