import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'

import { TabContainer, TabDivider, TabItem, TrueSightPageWrapper } from 'pages/TrueSight/styled'
import TrendingSoon from 'pages/TrueSight/TrendingSoon'
import Trending from 'pages/TrueSight/Trending'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { Trans } from '@lingui/macro'
import DiscoverIcon from 'components/Icons/DiscoverIcon'
import TrendingIcon from 'components/Icons/TrendingIcon'

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
      <TabContainer>
        <TabItem
          active={activeTab === TRUE_SIGHT_TABS.TRENDING_SOON}
          onClick={() => history.push({ search: '?tab=' + TRUE_SIGHT_TABS.TRENDING_SOON })}
        >
          <Text>
            <Trans>Trending Soon</Trans>
          </Text>
          <DiscoverIcon size={24} />
        </TabItem>
        <TabDivider>|</TabDivider>
        <TabItem
          active={activeTab === TRUE_SIGHT_TABS.TRENDING}
          onClick={() => history.push({ search: '?tab=' + TRUE_SIGHT_TABS.TRENDING })}
        >
          <Text>
            <Trans>Trending</Trans>
          </Text>
          <TrendingIcon size={24} />
        </TabItem>
      </TabContainer>
      {activeTab === TRUE_SIGHT_TABS.TRENDING_SOON && (
        <>
          <TrendingSoonHero />
          <TrendingSoon />
        </>
      )}
      {activeTab === TRUE_SIGHT_TABS.TRENDING && (
        <>
          <TrendingHero />
          <Trending />
        </>
      )}
    </TrueSightPageWrapper>
  )
}
