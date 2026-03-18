import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import useTheme from 'hooks/useTheme'
import AnalyticsTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/AnalyticsTab'
import EarningsTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/EarningsTab'
import InformationTab from 'pages/Earns/PoolDetail/components/PoolInformationTabs/InformationTab'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

const POOL_INFO_TABS = [
  { id: 'information', label: 'INFORMATION' },
  { id: 'Earnings', label: 'EARNING(S)' },
  { id: 'analytics', label: 'ANALYTICS' },
] as const

const Panel = styled(Stack)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

const TabButton = styled.button<{ $active: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.04em;
  cursor: pointer;

  :hover {
    color: ${({ theme, $active }) => ($active ? theme.primary : theme.text)};
  }
`

type PoolInfoTab = (typeof POOL_INFO_TABS)[number]['id']

const PoolInformation = () => {
  const theme = useTheme()
  const { pool } = usePoolDetailContext()
  const { activeTab, setActiveTab } = useTab<PoolInfoTab>({
    tabs: POOL_INFO_TABS.map(tab => tab.id),
    queryKey: 'tab',
    defaultTab: 'information',
    syncQuery: true,
  })

  const currentTab: PoolInfoTab = activeTab || 'information'

  return (
    <Panel width="100%" gap={16}>
      <HStack align="center" gap={16} wrap="wrap">
        {POOL_INFO_TABS.map((tab, index) => (
          <HStack key={tab.id} align="center" gap={16}>
            <TabButton $active={tab.id === currentTab} onClick={() => setActiveTab(tab.id)} type="button">
              {tab.label}
            </TabButton>
            {index < POOL_INFO_TABS.length - 1 ? (
              <Text color={rgba(theme.border, 0.24)} fontSize={14} fontWeight={500}>
                |
              </Text>
            ) : null}
          </HStack>
        ))}
      </HStack>

      {currentTab === 'information' && <InformationTab pool={pool} />}
      {currentTab === 'Earnings' && <EarningsTab />}
      {currentTab === 'analytics' && <AnalyticsTab />}
    </Panel>
  )
}

export default PoolInformation
