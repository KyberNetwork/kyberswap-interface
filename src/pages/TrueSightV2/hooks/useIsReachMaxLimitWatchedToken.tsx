import { useMemo } from 'react'

import { ITokenList, KyberAIListType } from '../types'
import { useTokenListQuery } from './useKyberAIData'

const MAX_LIMIT_WATCHED_TOKEN = 30
export default function useIsReachMaxLimitWatchedToken(tokenCount?: number) {
  const { data } = useTokenListQuery({
    type: KyberAIListType.ALL,
    chain: 'all',
    page: 1,
    pageSize: 30,
    watchlist: true,
  })

  const watchedCount = useMemo(() => {
    let count = 0
    data?.data.forEach((t: ITokenList) => {
      count += t.tokens.length
    })
    return count
  }, [data])

  return watchedCount + (tokenCount || 1) > MAX_LIMIT_WATCHED_TOKEN
}
