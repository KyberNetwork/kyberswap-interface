import { t } from '@lingui/macro'
import styled from 'styled-components'

import TabButton from 'components/TabButton'

import { LimitOrderTab } from '../type'

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

export default function TabSelector({
  activeTab,
  setActiveTab,
}: {
  activeTab: LimitOrderTab
  setActiveTab: (n: LimitOrderTab) => void
}) {
  return (
    <TabSelectorWrapper>
      <StyledTabButton
        active={activeTab === LimitOrderTab.ORDER_BOOK}
        onClick={() => setActiveTab(LimitOrderTab.ORDER_BOOK)}
        text={t`Open Limit Orders`}
      />
      <StyledTabButton
        active={activeTab === LimitOrderTab.MY_ORDER}
        text={t`My Order(s)`}
        onClick={() => setActiveTab(LimitOrderTab.MY_ORDER)}
      />
    </TabSelectorWrapper>
  )
}
