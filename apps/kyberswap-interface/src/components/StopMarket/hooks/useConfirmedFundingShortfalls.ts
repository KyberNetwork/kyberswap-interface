import { useEffect, useRef, useState } from 'react'

import { StopMarket } from 'components/StopMarket/types'
import { StopMarketFunding, getStopMarketFundingKey, getStopMarketFundingShortfalls } from 'components/StopMarket/utils'

type ListQuery = {
  isFetching: boolean
  isSuccess: boolean
  /** When the list's latest request was sent, in milliseconds. */
  startedTimeStamp?: number
  refetch: () => unknown
}

const NO_IDS = new Set<number>()

/**
 * The orders whose funding shortfall the list has confirmed. The wallet's balance falls the moment an order
 * settles, but the list learns of the settlement only on its next read, so an order that just executed would
 * briefly read as short of funds. A shortfall counts once a list read sent after it was first seen still has
 * the order open, and seeing a new one asks for that read straight away.
 */
export const useConfirmedFundingShortfalls = (
  orders: StopMarket[],
  funding: Record<string, StopMarketFunding>,
  enabled: boolean,
  { isFetching, isSuccess, startedTimeStamp, refetch }: ListQuery,
): Set<number> => {
  const shortIds = enabled
    ? orders
        .filter(order => {
          const orderFunding = funding[getStopMarketFundingKey(order.chainId, order.tokenIn)]
          return (
            !!orderFunding &&
            getStopMarketFundingShortfalls(order.amountIn, orderFunding.balance, orderFunding.allowance).length > 0
          )
        })
        .map(order => order.id)
    : []
  const shortKey = shortIds.join(',')

  // Only a read that has landed says anything; one still in flight keeps the last one's word.
  const [listReadAt, setListReadAt] = useState<number>()
  useEffect(() => {
    if (!isFetching && isSuccess && startedTimeStamp) setListReadAt(startedTimeStamp)
  }, [isFetching, isSuccess, startedTimeStamp])

  const seenAtRef = useRef(new Map<number, number>())
  useEffect(() => {
    const seenAt = seenAtRef.current
    const ids = shortKey ? shortKey.split(',').map(Number) : []
    const short = new Set(ids)
    seenAt.forEach((_, id) => {
      if (!short.has(id)) seenAt.delete(id)
    })
    const fresh = ids.filter(id => !seenAt.has(id))
    if (!fresh.length) return
    const now = Date.now()
    fresh.forEach(id => seenAt.set(id, now))
    refetch()
  }, [shortKey, refetch])

  if (!shortIds.length || listReadAt === undefined) return NO_IDS
  const seenAt = seenAtRef.current
  return new Set(
    shortIds.filter(id => {
      const seen = seenAt.get(id)
      // The refetch is sent in the same tick the shortfall is recorded, so it can share its millisecond.
      return seen !== undefined && listReadAt >= seen
    }),
  )
}
