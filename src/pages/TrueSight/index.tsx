import React, { useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Flex } from 'rebass'

import { TrueSightPageWrapper } from 'pages/TrueSight/styled'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/FilterBar'
import TrendingSoonTable from 'pages/TrueSight/TrendingSoonTable'
import TrendingTable from 'pages/TrueSight/TrendingTable'

export enum TRUE_SIGHT_TABS {
  TRENDING_SOON = 'trending_soon',
  TRENDING = 'trending'
}

export type Timeframe = '1D' | '7D'

export interface TrueSightFilter {
  isShowTrueSightOnly: boolean
  timeframe: '1D' | '7D'
  filterByTag: string | undefined
  tokenNameSearchText: string
}

export default function TrueSight({ history }: RouteComponentProps) {
  const queryString = useParsedQueryString()

  const [activeTab, setActiveTab] = useState<TRUE_SIGHT_TABS>()
  const [filter, setFilter] = useState<TrueSightFilter>({
    isShowTrueSightOnly: false,
    timeframe: '1D',
    filterByTag: undefined,
    tokenNameSearchText: ''
  })

  useEffect(() => {
    const { tab } = queryString
    if (tab === undefined) {
      history.push({ search: '?tab=' + TRUE_SIGHT_TABS.TRENDING_SOON })
    }
    setActiveTab(tab as TRUE_SIGHT_TABS)
  }, [history, queryString])

  return (
    <TrueSightPageWrapper>
      <TrueSightTab activeTab={activeTab} />
      {activeTab === TRUE_SIGHT_TABS.TRENDING_SOON && (
        <>
          <TrendingSoonHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar activeTab={TRUE_SIGHT_TABS.TRENDING_SOON} filter={filter} setFilter={setFilter} />
            <TrendingSoonTable />
          </Flex>
        </>
      )}
      {activeTab === TRUE_SIGHT_TABS.TRENDING && (
        <>
          <TrendingHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar activeTab={TRUE_SIGHT_TABS.TRENDING} filter={filter} setFilter={setFilter} />
            <TrendingTable />
          </Flex>
        </>
      )}
    </TrueSightPageWrapper>
  )
}
