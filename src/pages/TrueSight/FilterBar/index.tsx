import React from 'react'
import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarTitle
} from 'pages/TrueSight/styled'
import { Timeframe, TRUE_SIGHT_TABS, TrueSightFilter } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/FilterBar/TimeframePicker'
import useTheme from 'hooks/useTheme'
import TrueSightToggle from 'pages/TrueSight/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TagSelect from 'pages/TrueSight/FilterBar/TagSelect'
import TokenNameSearch from 'pages/TrueSight/FilterBar/TokenNameSearch'

interface FilterBarProps {
  activeTab: TRUE_SIGHT_TABS | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

export default function FilterBar({ activeTab, filter, setFilter }: FilterBarProps) {
  const isActiveTabTrendingSoon = activeTab === TRUE_SIGHT_TABS.TRENDING_SOON
  const above768 = useMedia('(min-width: 768px)')
  const theme = useTheme()

  const queryString = useParsedQueryString()

  const setActiveTimeframe = (timeframe: Timeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  return above768 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarTitle>
        {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
      </TrueSightFilterBarTitle>
      <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      {queryString.tab === 'trending' && (
        <TrueSightToggle
          isActive={filter.isShowTrueSightOnly}
          toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
        />
      )}
      <TagSelect />
      <TokenNameSearch />
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between">
        <TrueSightFilterBarTitle>
          {isActiveTabTrendingSoon ? <Trans>Trending Soon Tokens</Trans> : <Trans>Currently Trending</Trans>}
        </TrueSightFilterBarTitle>
        {queryString.tab === 'trending' && (
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        )}
      </Flex>
      <Flex style={{ gap: '12px' }}>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        <TagSelect style={{ width: '100%', flex: 1 }} />
      </Flex>
      <TokenNameSearch />
    </TrueSightFilterBarLayoutMobile>
  )
}
