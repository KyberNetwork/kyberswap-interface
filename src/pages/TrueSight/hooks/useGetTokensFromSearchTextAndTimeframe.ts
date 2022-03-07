import { useEffect, useMemo, useState } from 'react'
import { TrueSightTimeframe } from 'pages/TrueSight/index'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useTrendingSoonData'

export default function useGetTokensFromSearchTextAndTimeframe(searchText: string, timeframe: TrueSightTimeframe) {
  const [data, setData] = useState<TrueSightTokenData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const fetchTags = async () => {
      if (searchText) {
        try {
          const timeframeStr = timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
          const url = `${
            process.env.REACT_APP_TRUESIGHT_API
          }/api/v1/trending-soon?timeframe=${timeframeStr}&page_number=${0}&page_size=${5}&search_token_name=${searchText}`
          setError(undefined)
          setIsLoading(true)
          const response = await fetch(url)
          if (response.ok) {
            const json = await response.json()
            const rawResult = json.data
            rawResult.tokens = (rawResult.tokens ?? []).map((token: TrueSightTokenData) => ({
              ...token,
              // eslint-disable-next-line @typescript-eslint/camelcase
              social_urls: JSON.parse((token.social_urls as unknown) as string)
            }))
            setData(rawResult.tokens ?? [])
          }
          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(err)
          setIsLoading(false)
        }
      }
    }

    fetchTags()
  }, [searchText, timeframe])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
