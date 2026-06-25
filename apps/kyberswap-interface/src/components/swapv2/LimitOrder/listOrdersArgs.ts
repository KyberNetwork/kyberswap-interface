import { ChainId } from '@kyberswap/ks-sdk-core'

import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'

/** Page size for the limit-orders list — shared by the list page and the nav-intent prefetch. */
export const LIMIT_ORDERS_PAGE_SIZE = 10

/**
 * The `getListOrders` args the ListOrder page fires on a FRESH visit via the nav link (no `?search` /
 * `?tab`): active orders, page 1, empty query. Used by BOTH the list page and the nav-intent prefetch so
 * their RTK Query cache keys match EXACTLY — otherwise the prefetch misses and the page double-fetches.
 *
 * Keep this the single source of truth: if the page's initial query args change, change them here.
 */
export const getInitialListOrdersArgs = (chainId: ChainId, account: string | undefined) => ({
  chainId,
  maker: account,
  status: LimitOrderStatus.ACTIVE,
  query: '',
  page: 1,
  pageSize: LIMIT_ORDERS_PAGE_SIZE,
})
