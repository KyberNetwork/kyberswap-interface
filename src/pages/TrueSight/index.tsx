import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { TabContainer, TrueSightPageWrapper } from 'pages/TrueSight/styled'
import TrendingSoon from 'pages/TrueSight/TrendingSoon'
import Trending from 'pages/TrueSight/Trending'
import HeroTrendingSoon from 'pages/TrueSight/HeroTrendingSoon'
import HeroTrending from 'pages/TrueSight/HeroTrending'
import useParsedQueryString from 'hooks/useParsedQueryString'

enum TRUE_SIGHT_TABS {
  TRENDING_SOON = 'trending_soon',
  TRENDING = 'trending'
}

export default function TrueSight({ history }: RouteComponentProps) {
  const queryString = useParsedQueryString()

  const [activeTab, setActiveTab] = useState<TRUE_SIGHT_TABS>()

  useEffect(() => {
    const { tab } = queryString
    if (tab === undefined) {
      history.push({ search: '?tab=' + TRUE_SIGHT_TABS.TRENDING_SOON })
    }
    setActiveTab(tab as TRUE_SIGHT_TABS)
  }, [history, queryString])

  return (
    <TrueSightPageWrapper>
      <TabContainer>TabContainer</TabContainer>
      {activeTab === TRUE_SIGHT_TABS.TRENDING_SOON && (
        <>
          <HeroTrendingSoon />
          <TrendingSoon />
        </>
      )}
      {activeTab === TRUE_SIGHT_TABS.TRENDING && (
        <>
          <HeroTrending />
          <Trending />
        </>
      )}
    </TrueSightPageWrapper>
  )
}
