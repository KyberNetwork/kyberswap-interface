import React, { useEffect, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Flex } from 'rebass'

import {
  ButtonText,
  SubscribeButton,
  TrueSightPageWrapper,
  UnSubscribeButton,
  StyledSpinnder,
} from 'pages/TrueSight/styled'
import TrendingSoonHero from 'pages/TrueSight/TrendingSoonHero'
import TrendingHero from 'pages/TrueSight/TrendingHero'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightTab from 'pages/TrueSight/TrueSightTab'
import FilterBar from 'pages/TrueSight/components/FilterBar'
import TrendingSoonLayout from 'pages/TrueSight/components/TrendingSoonLayout'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import TrendingLayout from 'pages/TrueSight/components/TrendingLayout'
import { ChainId } from '@dynamic-amm/sdk'

import { t, Trans } from '@lingui/macro'
import NotificationIcon from 'components/Icons/NotificationIcon'
import { fetchToken } from 'utils/firebase'
import { checkChrome } from 'utils/checkChrome'

import { useLocalStorage } from 'react-use'
import useTheme from 'hooks/useTheme'

import { MouseoverTooltip } from 'components/Tooltip'
import UnsubscribeModal from './components/UnsubscribeModal'
import { useTrueSightUnsubscribeModalToggle } from 'state/application/hooks'

export enum TrueSightTabs {
  TRENDING_SOON = 'trending_soon',
  TRENDING = 'trending',
}

export enum TrueSightChartCategory {
  TRADING_VOLUME,
  PRICE,
}

export enum TrueSightTimeframe {
  ONE_DAY = '1D',
  ONE_WEEK = '7D',
}

export interface TrueSightFilter {
  isShowTrueSightOnly: boolean
  timeframe: TrueSightTimeframe
  selectedTag: string | undefined
  selectedTokenData: TrueSightTokenData | undefined
  selectedNetwork: ChainId | undefined
}

export interface TrueSightSortSettings {
  sortBy: 'rank' | 'name' | 'discovered_on'
  sortDirection: 'asc' | 'desc'
}

export default function TrueSight({ history }: RouteComponentProps) {
  const { tab } = useParsedQueryString()
  const [activeTab, setActiveTab] = useState<TrueSightTabs>()
  const [subscribe, setSubscribe] = useLocalStorage('true-sight-subscribe', false)
  const [isLoading, setIsLoading] = useState(false)
  const toggleUnsubscribeModal = useTrueSightUnsubscribeModalToggle()
  const [filter, setFilter] = useState<TrueSightFilter>({
    isShowTrueSightOnly: false,
    timeframe: TrueSightTimeframe.ONE_DAY,
    selectedTag: undefined,
    selectedTokenData: undefined,
    selectedNetwork: undefined,
  })
  const [sortSettings, setSortSettings] = useState<TrueSightSortSettings>({ sortBy: 'rank', sortDirection: 'asc' })

  useEffect(() => {
    if (tab === undefined) {
      history.push({ search: '?tab=' + TrueSightTabs.TRENDING_SOON })
    } else {
      setActiveTab(tab as TrueSightTabs)
      setFilter({
        isShowTrueSightOnly: false,
        timeframe: TrueSightTimeframe.ONE_DAY,
        selectedTag: undefined,
        selectedTokenData: undefined,
        selectedNetwork: undefined,
      })
      setSortSettings({ sortBy: 'rank', sortDirection: 'asc' })
    }
  }, [history, tab])

  const isChrome = checkChrome()
  const theme = useTheme()

  const tooltip = useMemo(() => {
    if (!isChrome)
      return t`If you would like to subscribe to notifications, please use Google Chrome. Other browsers will be supported in the future`

    if (subscribe) {
      return t`Unsubscribe to stop receiving notifications on latest tokens that could be trending soon!`
    } else return t`Subscribe to get notifications on the latest tokens that could be trending soon!`
  }, [isChrome, subscribe])

  const handleSubscribe = async () => {
    const token = await fetchToken()
    // TODO: implement for Safari
    if (!token || !isChrome) return
    const payload = { users: [{ type: isChrome && 'FCM_TOKEN', receivingAddress: token }] }
    setIsLoading(true)

    const response = await fetch(`https://notification.dev.kyberengineering.io/api/v1/topics/1/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 200) {
      setSubscribe(true)
    }
    setIsLoading(false)
  }

  const handleUnSubscribe = async () => {
    const token = await fetchToken()
    if (!token) return
    const payload = { users: [{ type: isChrome && 'FCM_TOKEN', receivingAddress: token }] }
    setIsLoading(true)

    const response = await fetch(`https://notification.dev.kyberengineering.io/api/v1/topics/1/unsubscribe`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 200) {
      setSubscribe(false)
    }
    setIsLoading(false)
    toggleUnsubscribeModal()
  }

  return (
    <TrueSightPageWrapper>
      <Flex justifyContent="space-between">
        <TrueSightTab activeTab={activeTab} />

        <MouseoverTooltip text={tooltip}>
          {subscribe ? (
            <UnSubscribeButton disabled={!isChrome || isLoading} onClick={toggleUnsubscribeModal}>
              {isLoading ? <StyledSpinnder color={theme.primary} /> : <NotificationIcon color={theme.primary} />}

              <ButtonText color="primary">
                <Trans>Unsubscribe</Trans>
              </ButtonText>
            </UnSubscribeButton>
          ) : (
            <SubscribeButton disabled={!isChrome || isLoading} onClick={handleSubscribe}>
              {isLoading ? <StyledSpinnder color={theme.primary} /> : <NotificationIcon />}

              <ButtonText>
                <Trans>Subscribe</Trans>
              </ButtonText>
            </SubscribeButton>
          )}
        </MouseoverTooltip>
      </Flex>
      {activeTab === TrueSightTabs.TRENDING_SOON && (
        <>
          <TrendingSoonHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar
              activeTab={TrueSightTabs.TRENDING_SOON}
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
            <TrendingSoonLayout
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
          </Flex>
        </>
      )}
      {activeTab === TrueSightTabs.TRENDING && (
        <>
          <TrendingHero />
          <Flex flexDirection="column" style={{ gap: '16px' }}>
            <FilterBar
              activeTab={TrueSightTabs.TRENDING}
              filter={filter}
              setFilter={setFilter}
              sortSettings={sortSettings}
              setSortSettings={setSortSettings}
            />
            <TrendingLayout filter={filter} setFilter={setFilter} />
          </Flex>
        </>
      )}
      <UnsubscribeModal handleUnsubscribe={handleUnSubscribe} />
    </TrueSightPageWrapper>
  )
}
