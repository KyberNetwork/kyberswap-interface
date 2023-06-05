import { useMemo } from 'react'

import { useActiveWeb3React } from 'hooks'

import { ITokenList, KyberAIListType } from '../types'
import { useTokenListQuery } from './useKyberAIData'

const MAX_LIMIT_WATCHED_TOKEN = 30
export default function useIsReachMaxLimitWatchedToken() {
  const { account } = useActiveWeb3React()
  const { data } = useTokenListQuery({
    type: KyberAIListType.ALL,
    chain: 'all',
    page: 1,
    pageSize: 30,
    wallet: account,
    watchlist: true,
  })

  const watchedCount = useMemo(() => {
    let count = 0
    data?.data.forEach((t: ITokenList) => {
      count += t.tokens.length
    })
    return count
  }, [data])

  return watchedCount >= MAX_LIMIT_WATCHED_TOKEN
}
