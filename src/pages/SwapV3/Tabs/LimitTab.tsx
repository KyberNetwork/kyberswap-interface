import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { isSupportLimitOrder } from 'utils'

import { Tab } from './index'

const WarningBadge = styled.span`
  display: inline-block;
  min-width: 20px;
  padding: 2px 6px;
  color: ${({ theme }) => theme.warning};
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`

type Props = {
  onClick: () => void
}
export default function LimitTab({ onClick }: Props) {
  const { chainId, account } = useActiveWeb3React()
  const { pathname } = useLocation()

  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isSupport = isSupportLimitOrder(chainId)

  const skip = !account || !isSupport
  const { data } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
    { skip, pollingInterval: 10_000 },
  )
  const numberOfInsufficientFundOrders = skip ? undefined : data

  if (!isSupport) {
    return null
  }

  return (
    <Tab id="limit-button" onClick={onClick} isActive={isLimitPage}>
      <Text fontSize={20} fontWeight={500}>
        <Trans>Limit</Trans>{' '}
        {numberOfInsufficientFundOrders ? (
          <MouseoverTooltip
            placement="top"
            text={
              <Trans>
                You have {numberOfInsufficientFundOrders} active orders that don&apos;t have sufficient funds
              </Trans>
            }
          >
            <WarningBadge>{numberOfInsufficientFundOrders}</WarningBadge>
          </MouseoverTooltip>
        ) : null}
      </Text>
    </Tab>
  )
}
