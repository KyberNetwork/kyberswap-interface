import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'
import styled from 'styled-components'

import TabButton from 'components/TabButton'
import { MouseoverTooltip } from 'components/Tooltip'
import { LimitOrderTab } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'

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
  const { chainId, account } = useActiveWeb3React()
  const { data: numberOfInsufficientFundOrders } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
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
