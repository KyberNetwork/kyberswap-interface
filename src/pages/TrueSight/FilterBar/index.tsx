import React from 'react'
import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarTitle
} from 'pages/TrueSight/styled'
import { Timeframe, TRUE_SIGHT_TABS, TrueSightFilter } from 'pages/TrueSight/index'
import TimeframeToggle from 'pages/TrueSight/FilterBar/TimeframeToggle'
import FilterBarToggle from 'components/Toggle/FilterBarToggle'
import useTheme from 'hooks/useTheme'
import TrueSightToggle from 'pages/TrueSight/FilterBar/TrueSightToggle'

interface FilterBarProps {
  activeTab: TRUE_SIGHT_TABS | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

const FilterBar = ({ activeTab, filter, setFilter }: FilterBarProps) => {
  const isActiveTabTrendingSoon = activeTab === TRUE_SIGHT_TABS.TRENDING_SOON
  const above768 = useMedia('(min-width: 768px)')
  const theme = useTheme()

  const setActiveTimeframe = (timeframe: Timeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  return above768 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarTitle>
        {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
      </TrueSightFilterBarTitle>
      <TimeframeToggle activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      <TrueSightToggle
        isActive={filter.isShowTrueSightOnly}
        toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
      />
      <div>Filter by Tag</div>
      <div>Search by token name</div>
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between">
        <TrueSightFilterBarTitle>
          {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
        </TrueSightFilterBarTitle>
        <TrueSightToggle
          isActive={filter.isShowTrueSightOnly}
          toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
        />
      </Flex>
      <Flex style={{ gap: '12px' }}>
        <TimeframeToggle activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        <div>Filter by Tag</div>
      </Flex>
      <div>Search by token name</div>
    </TrueSightFilterBarLayoutMobile>
  )
}

export default FilterBar
