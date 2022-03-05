import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Flex } from 'rebass'

import { TrueSightPageWrapper } from 'pages/TrueSight/styled'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/components/FilterBar'
import TrendingSoonLayout from 'pages/TrueSight/components/TrendingSoonLayout'
import CurrentlyTrendingLayout from 'pages/TrueSight/components/CurrentlyTrendingLayout'

export enum TrueSightTabs {
  TRENDING_SOON = 'trending_soon',
  TRENDING = 'trending'
}

export enum TrueSightChartDataType {
  TRADING_VOLUME,
  PRICE
}

export enum TrueSightTimeframe {
  ONE_DAY = '1D',
  ONE_WEEK = '7D'
}

export interface TrueSightFilter {
  isShowTrueSightOnly: boolean
  timeframe: TrueSightTimeframe
  filterByTag: string | undefined
  tokenNameSearchText: string
}

export default function TrueSight({ history }: RouteComponentProps) {
  const queryString = useParsedQueryString()

  const [activeTab, setActiveTab] = useState<TrueSightTabs>()
  const [filter, setFilter] = useState<TrueSightFilter>({
    isShowTrueSightOnly: false,
    timeframe: TrueSightTimeframe.ONE_DAY,
    filterByTag: undefined,
    tokenNameSearchText: ''
  })

  useEffect(() => {
    const { tab } = queryString
    if (tab === undefined) {
      history.push({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })
    } else {
      setActiveTab(tab as TrueSightTabs)
    }
  }, [history, queryString])

  return (
    <TrueSightPageWrapper>
      <TrueSightTab activeTab={activeTab} />
      {activeTab === TrueSightTabs.TRENDING_SOON && (
        <>
          <TrendingSoonHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar activeTab={TrueSightTabs.TRENDING_SOON} filter={filter} setFilter={setFilter} />
            <TrendingSoonLayout filter={filter} />
          </Flex>
        </>
      )}
      {activeTab === TrueSightTabs.TRENDING && (
        <>
          <TrendingHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar activeTab={TrueSightTabs.TRENDING} filter={filter} setFilter={setFilter} />
            <CurrentlyTrendingLayout />
          </Flex>
        </>
      )}
    </TrueSightPageWrapper>
  )
}
