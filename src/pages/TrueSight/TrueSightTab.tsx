import React from 'react'
import { useHistory } from 'react-router'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'

import DiscoverIcon from 'components/Icons/DiscoverIcon'
import TrendingIcon from 'components/Icons/TrendingIcon'
import { TRUE_SIGHT_TABS } from 'pages/TrueSight/index'
import { TabContainer, TabDivider, TabItem } from 'pages/TrueSight/styled'

const TrueSightTab = ({ activeTab }: { activeTab: TRUE_SIGHT_TABS | undefined }) => {
  const history = useHistory()

  return (
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
  )
}

export default TrueSightTab
