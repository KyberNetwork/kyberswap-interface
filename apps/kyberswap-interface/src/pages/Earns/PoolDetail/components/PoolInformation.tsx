import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTab from 'hooks/useTab'
import useTheme from 'hooks/useTheme'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'
import AnalyticsTab from 'pages/Earns/PoolDetail/tabs/AnalyticsTab'
import EarningsTab from 'pages/Earns/PoolDetail/tabs/EarningsTab'
import InformationTab from 'pages/Earns/PoolDetail/tabs/InformationTab'

const POOL_INFO_TABS = [
  { id: 'information', label: 'INFORMATION' },
  { id: 'earnings', label: 'EARNING(S)' },
  { id: 'analytics', label: 'ANALYTICS' },
] as const

const Panel = styled(Stack)`
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
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
    defaultTab: 'information',
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
              <Text color={theme.gray} fontSize={14} fontWeight={500}>
                |
              </Text>
            ) : null}
          </HStack>
        ))}
      </HStack>

      {currentTab === 'information' && <InformationTab pool={pool} />}
      {currentTab === 'earnings' && <EarningsTab />}
      {currentTab === 'analytics' && <AnalyticsTab />}
    </Panel>
  )
}

export default PoolInformation
