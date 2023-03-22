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

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;

  padding: 24px;
  padding-bottom: 0;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;

    ${ContentWrapper} {
      padding: 0 16px;
    }
  `}
`

const ContentWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
`

const PriceAlerts = () => {
  const [currentTab, setCurrentTab] = useState(Tab.ACTIVE)

  return (
    <Wrapper>
      <TitleOnMobile />
      <ContentWrapper>
        <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />
        {currentTab === Tab.ACTIVE ? <ActiveAlerts /> : <AlertsHistory />}
      </ContentWrapper>
    </Wrapper>
  )
}

export default PriceAlerts
