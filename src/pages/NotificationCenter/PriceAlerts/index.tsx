import { stringify } from 'querystring'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import useParsedQueryString from 'hooks/useParsedQueryString'
import ActiveAlerts from 'pages/NotificationCenter/PriceAlerts/ActiveAlerts'
import AlertsHistory from 'pages/NotificationCenter/PriceAlerts/AlertsHistory'
import Header from 'pages/NotificationCenter/PriceAlerts/Header'
import TitleOnMobile from 'pages/NotificationCenter/PriceAlerts/TitleOnMobile'

export enum Tab {
  ACTIVE = 'active',
  HISTORY = 'history',
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
  const { tab, ...rest } = useParsedQueryString<{ tab: Tab }>()
  const [currentTab, setCurrentTab] = useState(tab || Tab.ACTIVE)
  const navigate = useNavigate()
  const onSetTab = (tab: Tab) => {
    setCurrentTab(tab)
    const search = { ...rest, tab }
    navigate({ search: stringify(search) }, { replace: true })
  }

  return (
    <ShareWrapper>
      <TitleOnMobile />
      <ShareContentWrapper>
        <Header currentTab={currentTab} setCurrentTab={onSetTab} />
        {currentTab === Tab.ACTIVE ? <ActiveAlerts /> : <AlertsHistory />}
      </ShareContentWrapper>
    </ShareWrapper>
  )
}

export default PriceAlerts
