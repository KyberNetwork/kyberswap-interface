import { useMemo, useState } from 'react'

import { HStack } from 'components/Stack'

import {
  PoolInfoActivePlaceholder,
  PoolInfoContent,
  PoolInfoContentCard,
  PoolInfoHeader,
  PoolInfoPlaceholder,
  PoolInfoTab,
  PoolInfoTitle,
  PoolTabsBar,
} from '../styled'

const POOL_INFO_TABS = ['Pool Information', 'Earning', 'Analytics']

const PoolInformation = () => {
  const [activeTab, setActiveTab] = useState(POOL_INFO_TABS[0])
  const content = useMemo(() => {
    switch (activeTab) {
      case 'Earning':
        return 'Earning content will be displayed here.'
      case 'Analytics':
        return 'Analytics content will be displayed here.'
      case POOL_INFO_TABS[0]:
      default:
        return 'Pool information content will be displayed here.'
    }
  }, [activeTab])

  return (
    <PoolInfoContent>
      <PoolInfoContentCard>
        <PoolInfoHeader>
          <PoolInfoTitle>Pool Information</PoolInfoTitle>
          <PoolTabsBar>
            {POOL_INFO_TABS.map(tab => (
              <PoolInfoTab key={tab} $active={tab === activeTab} onClick={() => setActiveTab(tab)}>
                {tab}
              </PoolInfoTab>
            ))}
          </PoolTabsBar>
        </PoolInfoHeader>
      </PoolInfoContentCard>

      <PoolInfoContentCard>
        <HStack gap="12px">
          <PoolInfoActivePlaceholder>{activeTab}</PoolInfoActivePlaceholder>
          <PoolInfoPlaceholder>{content}</PoolInfoPlaceholder>
        </HStack>
      </PoolInfoContentCard>
    </PoolInfoContent>
  )
}

export default PoolInformation
