import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarTitle,
} from 'pages/TrueSight/styled'
import { TrueSightFilter, TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/components/FilterBar/TimeframePicker'
import TrueSightToggle from 'pages/TrueSight/components/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightSearchBox from 'pages/TrueSight/components/FilterBar/TrueSightSearchBox'
import NetworkSelect from 'pages/TrueSight/components/FilterBar/NetworkSelect'
import useGetTokensFromSearchTextAndTimeframe from 'pages/TrueSight/hooks/useGetTokensFromSearchTextAndTimeframe'
import useDebounce from 'hooks/useDebounce'
import useGetTagsFromSearchText from 'pages/TrueSight/hooks/useGetTokensFromSearchText'

interface FilterBarProps {
  activeTab: TrueSightTabs | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

export default function FilterBar({ activeTab, filter, setFilter }: FilterBarProps) {
  const isActiveTabTrending = activeTab === TrueSightTabs.TRENDING
  const above1000 = useMedia('(min-width: 1000px)')

  const queryString = useParsedQueryString()

  const setActiveTimeframe = (timeframe: TrueSightTimeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase().trim(), 200)

  const { data: foundTokens } = useGetTokensFromSearchTextAndTimeframe(debouncedSearchText, filter.timeframe)
  const { data: foundTags } = useGetTagsFromSearchText(debouncedSearchText)

  return above1000 ? (
    <TrueSightFilterBarLayout isActiveTabTrending={isActiveTabTrending}>
      <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      {isActiveTabTrending && (
        <TrueSightToggle
          isActive={filter.isShowTrueSightOnly}
          toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
        />
      )}
      <NetworkSelect />
      <TrueSightSearchBox
        placeholder={t`Search by token name or tag`}
        minWidth="260px"
        style={{ minWidth: '260px' }}
        foundTags={foundTags}
        foundTokens={foundTokens}
        searchText={searchText}
        setSearchText={setSearchText}
        selectedTag={filter.selectedTag}
        setSelectedTag={tag => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}
        selectedTokenData={filter.selectedTokenData}
        setSelectedTokenData={tokenData =>
          setFilter(prev => ({ ...prev, selectedTag: undefined, selectedTokenData: tokenData }))
        }
      />
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      {queryString.tab === 'trending' && (
        <Flex justifyContent="flex-end">
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        </Flex>
      )}
      <Flex style={{ gap: '12px' }}>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        <NetworkSelect style={{ flex: 1 }} />
      </Flex>
      <TrueSightSearchBox
        placeholder={t`Search by token name or tag`}
        foundTags={foundTags}
        foundTokens={foundTokens}
        searchText={searchText}
        setSearchText={setSearchText}
        selectedTag={filter.selectedTag}
        setSelectedTag={tag => setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))}
        selectedTokenData={filter.selectedTokenData}
        setSelectedTokenData={tokenData =>
          setFilter(prev => ({ ...prev, selectedTag: undefined, selectedTokenData: tokenData }))
        }
      />
    </TrueSightFilterBarLayoutMobile>
  )
}
