import { KyberAIListType } from '../types'
import { useTokenListQuery } from './useKyberAIData'

const MAX_LIMIT_WATCHED_TOKEN = 30
export default function useIsReachMaxLimitWatchedToken() {
  const { data } = useTokenListQuery({
    type: KyberAIListType.ALL,
    chain: 'all',
    page: 1,
    pageSize: 30,
    watchlist: true,
  })

  const watchedCount = data?.totalItems || 0

  return watchedCount + 1 > MAX_LIMIT_WATCHED_TOKEN
}
