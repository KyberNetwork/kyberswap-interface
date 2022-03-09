import { useEffect, useMemo, useState } from 'react'
import { TrueSightFilter, TrueSightTimeframe } from 'pages/TrueSight/index'
import { TrueSightTokenResponse } from 'pages/TrueSight/hooks/useGetTrendingSoonData'

export default function useGetTrendingData(filter: TrueSightFilter, currentPage: number, itemPerPage: number) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()
  const [data, setData] = useState<TrueSightTokenResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timeframe = filter.timeframe === TrueSightTimeframe.ONE_DAY ? '24h' : '7d'
        const url = `${
          process.env.REACT_APP_TRUESIGHT_API
        }/api/v1/trending?timeframe=${timeframe}&page_number=${currentPage -
          1}&page_size=${itemPerPage}&search_token_name=${filter.selectedTokenData?.name ??
          ''}&search_token_tag=${filter.selectedTag ?? ''}`
        setError(undefined)
        setIsLoading(true)
        const response = await fetch(url)
        if (response.ok) {
          const json = await response.json()
          const rawResult: TrueSightTokenResponse = json.data
          const result = {
            ...rawResult,
            tokens: rawResult.tokens
              ? filter.isShowTrueSightOnly
                ? // TODO
                  rawResult.tokens.filter(token => token.token_id % 3 === 0)
                : rawResult.tokens
              : [],
          }
          setData(result)
        }
        setIsLoading(false)
      } catch (err) {
        console.error(err)
        setError(err)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentPage, filter, itemPerPage])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
