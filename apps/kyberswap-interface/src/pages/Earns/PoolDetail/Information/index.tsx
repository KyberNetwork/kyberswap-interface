import { rgba } from 'polished'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTab from 'hooks/useTab'

import AnalyticsTab from './AnalyticsTab'
import EarningsTab from './EarningsTab'
import InformationTab from './InformationTab'

const POOL_INFO_TABS = [
  { id: 'information', label: 'INFORMATION' },
  { id: 'earnings', label: 'EARNING(S)' },
  { id: 'analytics', label: 'ANALYTICS' },
] as const

const Panel = styled(Stack)`
  overflow: hidden;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
`

const PanelHeader = styled.div`
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.darkBorder};
`

const TabButton = styled.button<{ $active: boolean; $isLast: boolean }>`
  position: relative;
  flex: 0 0 auto;
  padding: 16px 16px;
  border: 0;
  border-right: ${({ theme, $isLast }) => ($isLast ? '0' : `1px solid ${theme.darkBorder}`)};
  background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: inset 0 -2px 0 ${({ theme, $active }) => ($active ? theme.primary : 'transparent')};

  :hover {
    color: ${({ theme, $active }) => ($active ? theme.primary : theme.text)};
    background: ${({ theme, $active }) => ($active ? rgba(theme.primary, 0.14) : theme.tableHeader)};
  }
`

const PanelBody = styled(Stack)`
  padding: 20px 16px 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

type PoolInfoTab = (typeof POOL_INFO_TABS)[number]['id']

const PoolInformation = () => {
  const { activeTab, setActiveTab } = useTab<PoolInfoTab>({
    tabs: POOL_INFO_TABS.map(tab => tab.id),
    defaultTab: 'information',
  })
  const currentTab: PoolInfoTab = activeTab || 'information'

  return (
    <Panel width="100%">
      <PanelHeader role="tablist">
        {POOL_INFO_TABS.map((tab, index) => (
          <TabButton
            $active={tab.id === currentTab}
            $isLast={index === POOL_INFO_TABS.length - 1}
            aria-selected={tab.id === currentTab}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </TabButton>
        ))}
      </PanelHeader>

      <PanelBody>
        {currentTab === 'information' && <InformationTab />}
        {currentTab === 'earnings' && <EarningsTab />}
        {currentTab === 'analytics' && <AnalyticsTab />}
      </PanelBody>
    </Panel>
  )
}

export default PoolInformation
