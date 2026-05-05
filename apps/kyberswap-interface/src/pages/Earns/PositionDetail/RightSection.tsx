import { t } from '@lingui/macro'
import { useState } from 'react'

import AnalyticTab from 'pages/Earns/PositionDetail/AnalyticTab'
import EarningsTab from 'pages/Earns/PositionDetail/EarningsTab'
import InformationTab from 'pages/Earns/PositionDetail/InformationTab'
import { RightColumn, TabContent, TabDivider, TabItem, TabMenu } from 'pages/Earns/PositionDetail/styles'

type TabType = 'information' | 'earnings' | 'analytic'

const RightSection = () => {
  const [activeTab, setActiveTab] = useState<TabType>('information')

  return (
    <RightColumn>
      {/* Tab Menu */}
      <TabMenu>
        <TabItem active={activeTab === 'information'} onClick={() => setActiveTab('information')}>
          {t`Information`}
        </TabItem>
        <TabDivider />
        <TabItem active={activeTab === 'earnings'} onClick={() => setActiveTab('earnings')}>
          {t`Earning(s)`}
        </TabItem>
        <TabDivider />
        <TabItem active={activeTab === 'analytic'} onClick={() => setActiveTab('analytic')}>
          {t`Analytics`}
        </TabItem>
      </TabMenu>

      {/* Tab Content — key forces re-mount to trigger fade animation */}
      <TabContent>
        {activeTab === 'information' && <InformationTab key="information" />}
        {activeTab === 'earnings' && <EarningsTab key="earnings" />}
        {activeTab === 'analytic' && <AnalyticTab key="analytic" />}
      </TabContent>
    </RightColumn>
  )
}

export default RightSection
