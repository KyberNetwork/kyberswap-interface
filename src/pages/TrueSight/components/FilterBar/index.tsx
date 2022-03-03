import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'

import {
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarTitle
} from 'pages/TrueSight/styled'
import { TrueSightFilter, TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/components/FilterBar/TimeframePicker'
import TrueSightToggle from 'pages/TrueSight/components/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightSearchBox from 'pages/TrueSight/components/FilterBar/TrueSightSearchBox'
import { Currency, WETH } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import NetworkSelect from 'pages/TrueSight/components/FilterBar/NetworkSelect'

interface FilterBarProps {
  activeTab: TrueSightTabs | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

export default function FilterBar({ activeTab, filter, setFilter }: FilterBarProps) {
  const isActiveTabTrending = activeTab === TrueSightTabs.TRENDING
  const above768 = useMedia('(min-width: 768px)')

  const queryString = useParsedQueryString()

  const setActiveTimeframe = (timeframe: TrueSightTimeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  const { chainId = 1 } = useActiveWeb3React()

  const [tagOrCurrencyNameSearchText, setTagOrCurrencyNameSearchText] = useState('')

  const [selectedTagOrCurrency, setSelectedTagOrCurrency] = useState<string | Currency | undefined>()

  const CURRENCIES = [WETH[chainId], WETH[chainId], WETH[chainId]]
  const TAGS = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']

  const foundCurrencies = CURRENCIES.filter(
    token => token.name && token.name.toLowerCase().includes(tagOrCurrencyNameSearchText.toLowerCase().trim())
  )
  const foundTags = TAGS.filter(tag => tag.toLowerCase().includes(tagOrCurrencyNameSearchText.toLowerCase().trim()))

  return above768 ? (
    <TrueSightFilterBarLayout isActiveTabTrending={isActiveTabTrending}>
      <TrueSightFilterBarTitle>
        {isActiveTabTrending ? <Trans>Currently Trending</Trans> : <Trans>Trending Soon Tokens</Trans>}
      </TrueSightFilterBarTitle>
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
        style={{ width: '260px' }}
        foundTags={foundTags}
        foundCurrencies={foundCurrencies}
        searchText={tagOrCurrencyNameSearchText}
        setSearchText={setTagOrCurrencyNameSearchText}
        selectedTagOrCurrency={selectedTagOrCurrency}
        setSelectedTagOrCurrency={setSelectedTagOrCurrency}
      />
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between">
        <TrueSightFilterBarTitle>
          {isActiveTabTrending ? <Trans>Currently Trending</Trans> : <Trans>Trending Soon Tokens</Trans>}
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
        <NetworkSelect style={{ flex: 1 }} />
      </Flex>
      {/*<TrueSightSearchBox*/}
      {/*  placeholder={t`Search by token name or tag`}*/}
      {/*  options={foundTokens}*/}
      {/*  searchText={tagOrCurrencyNameSearchText}*/}
      {/*  setSearchText={setTagOrTokenNameSearchText}*/}
      {/*  selectedOption={selectedTagOrToken}*/}
      {/*  setSelectedOption={setSelectedTagOrToken}*/}
      {/*/>*/}
    </TrueSightFilterBarLayoutMobile>
  )
}
