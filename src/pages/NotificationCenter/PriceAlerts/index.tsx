import { useState } from 'react'
import styled from 'styled-components'

import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'
import TitleOnMobile from 'pages/NotificationCenter/PriceAlerts/TitleOnMobile'

export enum Tab {
  ACTIVE = 'ACTIVE',
  HISTORY = 'HISTORY',
}

export const ShareWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  padding: 24px;
  padding-bottom: 0;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: 1;
    padding: 0;

    ${ShareContentWrapper} {
      flex: 1;
      padding: 0 16px;
    }
  `}
`

export const ShareContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`

const PriceAlerts = () => {
  const [currentTab, setCurrentTab] = useState(Tab.ACTIVE)

  return (
    <ShareWrapper>
      <TitleOnMobile />
      <ShareContentWrapper>
        <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />
        {currentTab === Tab.ACTIVE ? <ActiveAlerts /> : <AlertsHistory />}
      </ShareContentWrapper>
    </ShareWrapper>
  )
}

export default PriceAlerts
