import { useGetOpenStopMarketsQuery } from 'services/stopMarket'

import { useConfirmedFundingShortfalls } from 'components/StopMarket/hooks/useConfirmedFundingShortfalls'
import { useStopMarketsFunding } from 'components/StopMarket/hooks/useStopMarketsFunding'
import { StopMarket, StopMarketDisplayStatus } from 'components/StopMarket/types'
import { getStopMarketDisplayStatus, getStopMarketRetry, getStopMarketWarnings } from 'components/StopMarket/utils'
import { useActiveWeb3React } from 'hooks'

const EMPTY_ORDERS: StopMarket[] = []

export const useStopMarketOrderWarning = (enabled: boolean) => {
  const { account } = useActiveWeb3React()
  const shouldFetch = enabled && !!account
  const query = useGetOpenStopMarketsQuery(account || '', {
    skip: !shouldFetch,
    pollingInterval: 10_000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  })
  const orders = shouldFetch ? query.currentData ?? EMPTY_ORDERS : EMPTY_ORDERS
  const funding = useStopMarketsFunding(orders, shouldFetch)
  const shortfallIds = useConfirmedFundingShortfalls(orders, funding, shouldFetch, query)

  return orders.some(
    order =>
      !!getStopMarketRetry(order) ||
      getStopMarketWarnings(order).some(warning => warning.code === 'INSUFFICIENT_FUND') ||
      (getStopMarketDisplayStatus(order) === StopMarketDisplayStatus.ACTIVE && shortfallIds.has(order.id)),
  )
}
