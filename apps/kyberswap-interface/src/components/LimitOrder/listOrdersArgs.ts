import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import type { ListOrdersParams } from 'services/limitOrder'

import { type MenuOption } from 'components/DropdownMenu'
import { LimitOrderStatus } from 'components/LimitOrder/types'
import { isSupportLimitOrder } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'
import { sortChainOptionsByPriority } from 'pages/Earns/hooks/useSupportedDexesAndChains'

/** Page size shared by My Orders, the order-book link and the nav-intent prefetch. */
export const LIMIT_ORDERS_PAGE_SIZE = 10

export const useSupportedLimitOrderChains = () => {
  const { supportedChains } = useChainsConfig()

  return useMemo(() => {
    const options: MenuOption[] = supportedChains
      .filter(chain => isSupportLimitOrder(chain.chainId))
      .map(chain => ({ label: chain.name, value: chain.chainId.toString(), icon: chain.icon }))
      .sort(sortChainOptionsByPriority)

    return { options, chainIds: options.map(option => Number(option.value) as ChainId) }
  }, [supportedChains])
}

/**
 * First-page active-order args shared by My Orders, the order-book link and nav prefetch.
 * All-chains callers must use the same chain ordering so their RTK Query cache keys match.
 */
export const getInitialListOrdersArgs = (
  chainId: ChainId | ChainId[],
  account: string | undefined,
): ListOrdersParams => ({
  chainIds: Array.isArray(chainId) ? chainId : [chainId],
  maker: account,
  status: LimitOrderStatus.ACTIVE,
  query: '',
  page: 1,
  pageSize: LIMIT_ORDERS_PAGE_SIZE,
})
