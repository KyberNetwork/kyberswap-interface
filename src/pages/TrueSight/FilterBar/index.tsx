import React from 'react'
import { Trans } from '@lingui/macro'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarTitle
} from 'pages/TrueSight/styled'
import { TRUE_SIGHT_TABS, TrueSightFilter } from 'pages/TrueSight/index'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'

const TimeToggle = () => {
  return <div></div>
}

interface FilterBarProps {
  activeTab: TRUE_SIGHT_TABS | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

const FilterBar = ({ activeTab, filter, setFilter }: FilterBarProps) => {
  const isActiveTabTrendingSoon = activeTab === TRUE_SIGHT_TABS.TRENDING_SOON
  const above768 = useMedia('(min-width: 768px)')

  return above768 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarTitle>
        {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
      </TrueSightFilterBarTitle>
      <div>TrueSight toggle</div>
      <div>Time toggle</div>
      <div>Filter by Tag</div>
      <div>Search by token name</div>
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between">
        <TrueSightFilterBarTitle>
          {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
        </TrueSightFilterBarTitle>
        <div>TrueSight toggle</div>
      </Flex>
      <Flex style={{ gap: '12px' }}>
        <div>Time toggle</div>
        <div>Filter by Tag</div>
      </Flex>
      <div>Search by token name</div>
    </TrueSightFilterBarLayoutMobile>
  )
}

export default FilterBar
