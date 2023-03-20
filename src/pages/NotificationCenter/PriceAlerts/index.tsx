import { useState } from 'react'
import { Flex } from 'rebass'

import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'

export enum Tab {
  ACTIVE = 'ACTIVE',
  HISTORY = 'HISTORY',
}

const PriceAlerts = () => {
  const [currentTab, setCurrentTab] = useState(Tab.ACTIVE)

  return (
    <Flex
      sx={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
      }}
    >
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />
      {currentTab === Tab.ACTIVE ? <ActiveAlerts /> : <AlertsHistory />}
    </Flex>
  )
}

export default PriceAlerts
