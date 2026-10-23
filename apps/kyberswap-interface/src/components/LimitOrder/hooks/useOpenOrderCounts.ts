import { ChainId } from '@kyberswap/ks-sdk-core'
import { useGetListOrdersQuery } from 'services/limitOrder'
import { useGetStopMarketsQuery } from 'services/stopMarket'

import { getInitialListOrdersArgs, useSupportedLimitOrderChains } from 'components/LimitOrder/listOrdersArgs'
import { StopMarketStatus } from 'components/StopMarket/types'
import { isSupportLimitOrder, isSupportStopMarket } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'

/**
 * How many limit and stop market orders the wallet has open, on every chain — what the Limit Order tab's badge
 * and the order panel count. Each side reads only a total, and the limit side asks with the args the
 * order list opens with, so both share its cached request.
 */
export const useOpenOrderCounts = (chainId: ChainId) => {
  const { account } = useActiveWeb3React()

  // Waits for the chain config so the first request already carries the final chain list.
  const { chainIds: limitOrderChainIds, isLoaded: isChainListLoaded } = useSupportedLimitOrderChains()
  const skipLimitOrders = !account || !isSupportLimitOrder(chainId) || !isChainListLoaded || !limitOrderChainIds.length
  const { data: { totalOrder = 0 } = {} } = useGetListOrdersQuery(
    getInitialListOrdersArgs(limitOrderChainIds, account),
    { skip: skipLimitOrders, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  // An omitted `chainIds` is the service's all-chains path. Not on a chain without stop market orders: nothing
  // there leads to them, so a count would name orders the user cannot find.
  const skipStopMarkets = !account || !isSupportStopMarket(chainId)
  const { data: { totalItems: totalStopMarkets = 0 } = {} } = useGetStopMarketsQuery(
    { userWallet: account || '', statuses: [StopMarketStatus.OPEN], page: 1, pageSize: 1 },
    { skip: skipStopMarkets, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  // `data` outlives a skip, so a skipped side counts as nothing rather than as its last answer.
  const limit = skipLimitOrders ? 0 : totalOrder
  const stop = skipStopMarkets ? 0 : totalStopMarkets
  return { limit, stop, total: limit + stop }
}
