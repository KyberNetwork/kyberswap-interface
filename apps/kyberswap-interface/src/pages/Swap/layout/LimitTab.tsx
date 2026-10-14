import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'
import { useGetStopOrdersQuery } from 'services/stopOrder'

import { getInitialListOrdersArgs, useSupportedLimitOrderChains } from 'components/LimitOrder/listOrdersArgs'
import { StopOrderStatus } from 'components/StopOrder/types'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { isSupportLimitOrder } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { Tab } from 'pages/Swap/layout/Tabs'

type Props = {
  onClick: () => void
  active?: boolean
  customChainId?: ChainId
}

export const LimitTab = ({ onClick, active, customChainId }: Props) => {
  const { chainId: walletChainId, account } = useActiveWeb3React()
  const { pathname } = useLocation()

  const chainId = customChainId || walletChainId
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSupport = isSupportLimitOrder(chainId)

  // Counts every chain, like the limit-order list's default All Chains view. The args are the ones My
  // Orders opens with, so both share one cached request.
  // Waits for the chain config so the first request already carries the final chain list.
  const { chainIds: limitOrderChainIds, isLoaded: isChainListLoaded } = useSupportedLimitOrderChains()
  const skip = !account || !isSupport || !isChainListLoaded || !limitOrderChainIds.length
  const { data: { totalOrder = 0 } = {} } = useGetListOrdersQuery(
    getInitialListOrdersArgs(limitOrderChainIds, account),
    {
      skip,
      refetchOnFocus: true,
      pollingInterval: 10_000,
    },
  )

  // Stop orders live under the same tab, so the badge counts them too. An omitted `chainIds` is the
  // service's all-chains path; only the total is read.
  const skipStopOrders = !account
  const { data: { totalItems: totalStopOrders = 0 } = {} } = useGetStopOrdersQuery(
    { userWallet: account || '', statuses: [StopOrderStatus.OPEN], page: 1, pageSize: 1 },
    { skip: skipStopOrders, refetchOnFocus: true, pollingInterval: 10_000 },
  )

  const numberOfActiveOrders = (skip ? 0 : totalOrder) + (skipStopOrders ? 0 : totalStopOrders)

  if (!isSupport) {
    return null
  }

  return (
    <Tab id="limit-button" data-testid="limit-button" onClick={onClick} $isActive={active || isLimitPage}>
      <Trans>Limit Order</Trans>
      {!!numberOfActiveOrders && (
        <MouseoverTooltip placement="top" text={<Trans>You have {numberOfActiveOrders} active orders.</Trans>}>
          <span className="min-w-4 rounded-full bg-primary-30 px-1.5 py-px text-xs font-medium text-primary">
            {numberOfActiveOrders}
          </span>
        </MouseoverTooltip>
      )}
    </Tab>
  )
}
