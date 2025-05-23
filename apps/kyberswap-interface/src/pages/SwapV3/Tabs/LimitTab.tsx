import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useLocation } from 'react-router-dom'
import { useGetListOrdersQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isSupportLimitOrder } from 'utils'

import { Tab } from './index'

const ActiveBadge = styled.span`
  display: inline-block;
  min-width: 18px;
  padding: 2px 6px;
  color: ${({ theme }) => theme.primary};
  background-color: ${({ theme }) => rgba(theme.primary, 0.3)};
  border-radius: 20px;
  font-weight: 500;
  font-size: 12px;
`

type Props = {
  onClick: () => void
  active?: boolean
  customChainId?: ChainId
}
export default function LimitTab({ onClick, active, customChainId }: Props) {
  const { chainId: walletChainId, account } = useActiveWeb3React()
  const { pathname } = useLocation()

  const chainId = customChainId || walletChainId
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSupport = isSupportLimitOrder(chainId)

  const skip = !account || !isSupport

  const { data: { totalOrder = 0 } = {} } = useGetListOrdersQuery(
    {
      chainId,
      maker: account,
      status: 'active',
      query: '',
      page: 1,
      pageSize: 10,
    },
    { skip, refetchOnFocus: true, pollingInterval: 10_000 },
  )
  const numberOfActiveOrders = skip ? undefined : totalOrder

  if (!isSupport) {
    return null
  }

  return (
    <Tab
      id="limit-button"
      data-testid="limit-button"
      onClick={onClick}
      isActive={active || isLimitPage}
      style={{ display: 'flex', gap: '4px', fontSize: '18px', fontWeight: '500' }}
    >
      <Trans>Limit Order</Trans>{' '}
      {!!numberOfActiveOrders && (
        <MouseoverTooltip placement="top" text={<Trans>You have {numberOfActiveOrders} active orders.</Trans>}>
          <ActiveBadge>{numberOfActiveOrders}</ActiveBadge>
        </MouseoverTooltip>
      )}
    </Tab>
  )
}
