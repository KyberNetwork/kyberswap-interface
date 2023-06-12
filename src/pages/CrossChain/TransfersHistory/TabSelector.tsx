import { Trans } from '@lingui/macro'
import styled, { css } from 'styled-components'

import Row from 'components/Row'

const TabItem = styled.div<{ isActive?: boolean }>`
  text-align: center;
  height: fit-content;
  padding: 4px 12px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  user-select: none;
  border-radius: 20px;
  transition: all 150ms;
  cursor: pointer;
  ${({ theme, isActive }) =>
    isActive &&
    css`
      background: ${theme.tabActive};
    `};
`

export enum CrossChainTab {
  ROUTE = 'route',
  HISTORY = 'history',
}

const TabSelector = ({
  activeTab,
  setTab,
  isShowTradeRoutes,
}: {
  activeTab: CrossChainTab
  setTab: (v: CrossChainTab) => void
  isShowTradeRoutes: boolean
}) => {
  return (
    <Row gap="4px">
      {isShowTradeRoutes && (
        <TabItem isActive={activeTab === CrossChainTab.ROUTE} onClick={() => setTab(CrossChainTab.ROUTE)}>
          <Trans>Trade Route</Trans>
        </TabItem>
      )}
      <TabItem isActive={activeTab === CrossChainTab.HISTORY} onClick={() => setTab(CrossChainTab.HISTORY)}>
        <Trans>Transaction History</Trans>
      </TabItem>
    </Row>
  )
}

export default styled(TabSelector)`
  width: 100%;
  height: 46px; // to make it align with the swap container
  display: flex;
  gap: 16px;
  align-items: center;
`
