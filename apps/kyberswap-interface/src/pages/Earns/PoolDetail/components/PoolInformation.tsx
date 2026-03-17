import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import AnalyticsTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/AnalyticsTab'
import EarningsTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/EarningsTab'
import InformationTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/InformationTab'
import { Pool } from 'pages/Earns/PoolDetail/types'

const POOL_INFO_TABS = [
  { id: 'information', label: 'INFORMATION' },
  { id: 'Earnings', label: 'EARNING(S)' },
  { id: 'analytics', label: 'ANALYTICS' },
] as const

const Panel = styled(Stack)`
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    border-radius: 12px;
  `}
`

const TabRow = styled(HStack)`
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const TabSeparator = styled.span`
  color: ${({ theme }) => theme.subText};
  opacity: 0.45;
  font-size: 14px;
  font-weight: 700;
`

const TabButton = styled.button<{ $active: boolean }>`
  border: 0;
  padding: 0;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.04em;
  cursor: pointer;

  :hover {
    filter: brightness(1.2);
  }
`

type PoolInfoTab = (typeof POOL_INFO_TABS)[number]['id']

interface PoolInformationProps {
  pool?: Pool
}

const PoolInformation = ({ pool }: PoolInformationProps) => {
  const { activeTab, setActiveTab } = useTab<PoolInfoTab>({
    tabs: POOL_INFO_TABS.map(tab => tab.id),
    queryKey: 'tab',
    defaultTab: 'information',
    syncQuery: true,
  })

  const currentTab: PoolInfoTab = activeTab || 'information'

  return (
    <Panel gap={20} width="100%">
      <TabRow>
        {POOL_INFO_TABS.map((tab, index) => (
          <HStack align="center" gap={16} key={tab.id}>
            <TabButton $active={tab.id === currentTab} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </TabButton>
            {index < POOL_INFO_TABS.length - 1 ? <TabSeparator>|</TabSeparator> : null}
          </HStack>
        ))}
      </TabRow>

      {currentTab === 'information' && <InformationTab pool={pool} />}
      {currentTab === 'Earnings' && <EarningsTab />}
      {currentTab === 'analytics' && <AnalyticsTab />}
    </Panel>
  )
}

export default PoolInformation
