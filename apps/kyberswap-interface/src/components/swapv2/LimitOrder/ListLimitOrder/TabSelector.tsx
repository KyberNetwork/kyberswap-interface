import { t, Trans } from '@lingui/macro'
import styled from 'styled-components'

import TabButton from 'components/TabButton'
import { rgba } from 'polished'

import { LimitOrderTab } from '../type'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'
import { useActiveWeb3React } from 'hooks'
import { useSearchParams } from 'react-router-dom'
import { SUPPORTED_NETWORKS } from 'constants/networks'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { MouseoverTooltip } from 'components/Tooltip'

const TabSelectorWrapper = styled.div`
  display: flex;
  overflow: hidden;
  border-top-left-radius: 19px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    border-top-left-radius: 0;
    width: 100%;
  `};
`

const StyledTabButton = styled(TabButton)`
  padding: 16px;
  flex: unset;
  font-size: 14px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 50%;
  `};
`

const WarningBadge = styled.span`
  display: inline-block;
  min-width: 20px;
  padding: 2px 6px;
  color: ${({ theme }) => theme.warning};
  background-color: ${({ theme }) => rgba(theme.warning, 0.3)};
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
  margin-left: 8px;
`

export default function TabSelector({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderTab
  setActiveTab: (n: LimitOrderTab) => void
}) {
  const [searchParams] = useSearchParams()
  const chainIdFromParam = searchParams.get('chainId')
  const customChainId =
    chainIdFromParam && SUPPORTED_NETWORKS.includes(+chainIdFromParam) ? +chainIdFromParam : ChainId.MAINNET

  const { chainId: walletChainId, account } = useActiveWeb3React()
  const { data: numberOfInsufficientFundOrders } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId: customChainId || walletChainId, maker: account || '' },
    { skip: !account, pollingInterval: 10_000 },
  )

  return (
    <TabSelectorWrapper>
      <StyledTabButton
        active={activeTab === LimitOrderTab.ORDER_BOOK}
        onClick={() => setActiveTab(LimitOrderTab.ORDER_BOOK)}
        text={t`Open Limit Orders`}
      />
      <StyledTabButton
        active={activeTab === LimitOrderTab.MY_ORDER}
        text={
          <>
            <Trans>My Order(s)</Trans>
            {!!numberOfInsufficientFundOrders && (
              <MouseoverTooltip
                placement="top"
                text={
                  <Trans>
                    You have {numberOfInsufficientFundOrders} active orders that don&apos;t have sufficient funds.
                  </Trans>
                }
              >
                <WarningBadge>{numberOfInsufficientFundOrders}</WarningBadge>
              </MouseoverTooltip>
            )}
          </>
        }
        onClick={() => setActiveTab(LimitOrderTab.MY_ORDER)}
      />
    </TabSelectorWrapper>
  )
}
