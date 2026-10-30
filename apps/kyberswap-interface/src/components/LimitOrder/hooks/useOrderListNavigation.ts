import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import { LimitOrderStatus, LimitOrderTab, OrderKind, ShowOrdersState } from 'components/LimitOrder/types'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { currencyId } from 'utils/currencyId'
import { useNavigateToUrl } from 'utils/redirect'

type OrderListNavigationOptions = {
  kind: OrderKind
  chainId?: ChainId
  status?: LimitOrderStatus.ACTIVE | LimitOrderStatus.CLOSED
  currencyIn?: Currency
  currencyOut?: Currency
  search?: string
}

const getPairPath = (currencyIn: Currency | undefined, currencyOut: Currency | undefined, chainId: ChainId) =>
  currencyIn && currencyOut ? `/${currencyId(currencyIn, chainId)}-to-${currencyId(currencyOut, chainId)}` : ''

export const getOrderListPath = ({
  kind,
  chainId,
  status = LimitOrderStatus.ACTIVE,
  currencyIn,
  currencyOut,
  search,
}: OrderListNavigationOptions) => {
  const route = NETWORKS_INFO[chainId ?? ChainId.MAINNET].route
  const path = kind === OrderKind.STOP ? APP_PATHS.STOP_MARKET : APP_PATHS.LIMIT
  const params = new URLSearchParams()

  if (kind === OrderKind.LIMIT) params.set('tab', LimitOrderTab.MY_ORDER)
  params.set('orderTab', status)
  if (search) params.set('search', search)

  return `${path}/${route}${getPairPath(currencyIn, currencyOut, chainId ?? ChainId.MAINNET)}?${params.toString()}`
}

export const useOrderListNavigation = () => {
  const { chainId: currentChainId } = useActiveWeb3React()
  const navigate = useNavigateToUrl()

  return useCallback(
    (options: OrderListNavigationOptions) => {
      const chainId = options.chainId ?? currentChainId
      const state: ShowOrdersState = {
        showOrders: options.kind,
        orderTab: options.status ?? LimitOrderStatus.ACTIVE,
      }

      navigate(getOrderListPath({ ...options, chainId }), chainId, { state })
    },
    [currentChainId, navigate],
  )
}
