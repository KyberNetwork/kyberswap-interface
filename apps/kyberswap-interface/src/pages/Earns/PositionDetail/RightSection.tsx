import { t } from '@lingui/macro'
import { useState } from 'react'

import EarningsTab from 'pages/Earns/PositionDetail/EarningsTab'
import HistoryTab from 'pages/Earns/PositionDetail/HistoryTab'
import InformationTab from 'pages/Earns/PositionDetail/InformationTab'
import { RightColumn, TabDivider, TabItem, TabMenu } from 'pages/Earns/PositionDetail/styles'

type TabType = 'information' | 'earnings' | 'history'

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
        <TabItem active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
          {t`History`}
        </TabItem>
      </TabMenu>

      {/* Tab Content — key forces re-mount to trigger fade animation */}
      {activeTab === 'information' && <InformationTab key="information" />}
      {activeTab === 'earnings' && <EarningsTab key="earnings" />}
      {activeTab === 'history' && <HistoryTab key="history" />}
    </RightColumn>
  )
}

export default RightSection
