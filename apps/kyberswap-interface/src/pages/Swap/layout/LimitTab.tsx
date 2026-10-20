import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useLocation } from 'react-router-dom'

import { useOpenOrderCounts } from 'components/LimitOrder/hooks/useOpenOrderCounts'
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
  const { chainId: walletChainId } = useActiveWeb3React()
  const { pathname } = useLocation()

  const chainId = customChainId || walletChainId
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSupport = isSupportLimitOrder(chainId)

  // Stop market orders live under the same tab, so the badge counts them too.
  const { total: numberOfActiveOrders } = useOpenOrderCounts(chainId)

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
