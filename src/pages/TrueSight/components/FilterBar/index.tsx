import React, { useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import {
  TextTooltip,
  TrueSightFilterBarLayout,
  TrueSightFilterBarLayoutMobile,
  TrueSightFilterBarSection,
} from 'pages/TrueSight/styled'
import { TrueSightFilter, TrueSightSortSettings, TrueSightTabs, TrueSightTimeframe } from 'pages/TrueSight/index'
import TimeframePicker from 'pages/TrueSight/components/FilterBar/TimeframePicker'
import TrueSightToggle from 'pages/TrueSight/components/FilterBar/TrueSightToggle'
import useParsedQueryString from 'hooks/useParsedQueryString'
import TrueSightSearchBox, { SelectedOption } from 'pages/TrueSight/components/FilterBar/TrueSightSearchBox'
import NetworkSelect from 'pages/TrueSight/components/FilterBar/NetworkSelect'
import useGetTokensForSearchBox from 'pages/TrueSight/hooks/useGetTokensForSearchBox'
import useDebounce from 'hooks/useDebounce'
import useGetTagsForSearchBox from 'pages/TrueSight/hooks/useGetTagsForSearchBox'
import useTheme from 'hooks/useTheme'
import { MouseoverTooltip } from 'components/Tooltip'
import { Container as SearchContainer, Input as SearchInput } from 'components/Search'
import { useTrendingSoonSortingModalToggle } from 'state/application/hooks'

const TrueSightSearchBoxOnMobile = styled(TrueSightSearchBox)`
  flex: 1;
  background: ${({ theme }) => theme.background};

  ${SearchContainer} {
    background: ${({ theme }) => theme.tabBackgound};
  }

  ${SelectedOption} {
    background: ${({ theme }) => theme.tabBackgound};
    border-radius: 20px;
  }

  ${SearchInput} {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;

    ::placeholder {
      font-size: 14px;
    }
  }
`
interface FilterBarProps {
  activeTab: TrueSightTabs | undefined
  filter: TrueSightFilter
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  sortSettings: TrueSightSortSettings
  setSortSettings: React.Dispatch<React.SetStateAction<TrueSightSortSettings>>
}

export default function FilterBar({ activeTab, filter, setFilter, sortSettings, setSortSettings }: FilterBarProps) {
  const isActiveTabTrending = activeTab === TrueSightTabs.TRENDING
  const below992 = useMedia('(max-width: 992px)')

  const queryString = useParsedQueryString()

  const setActiveTimeframe = (timeframe: TrueSightTimeframe) => {
    setFilter(prev => ({ ...prev, timeframe }))
  }

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase().trim(), 200)

  const { data: foundTokens } = useGetTokensForSearchBox(
    debouncedSearchText,
    filter.timeframe,
    filter.isShowTrueSightOnly,
  )
  const { data: foundTags } = useGetTagsForSearchBox(debouncedSearchText)

  const theme = useTheme()

  const toggleSortingModal = useTrendingSoonSortingModalToggle()

  const { tab } = useParsedQueryString()
  const tooltipText =
    tab === TrueSightTabs.TRENDING_SOON
      ? t`You can choose to see the tokens with the highest growth potential over the last 24 hours or 7 days`
      : t`You can choose to see currently trending tokens over the last 24 hours or 7 days`

  return !below992 ? (
    <TrueSightFilterBarLayout>
      <TrueSightFilterBarSection style={{ gap: '8px' }}>
        <MouseoverTooltip text={tooltipText}>
          <TextTooltip color={theme.subText} fontSize="14px" fontWeight={500}>
            <Trans>Timeframe</Trans>
          </TextTooltip>
        </MouseoverTooltip>
        <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
      </TrueSightFilterBarSection>
      <TrueSightFilterBarSection style={{ gap: '16px' }}>
        {isActiveTabTrending && (
          <TrueSightToggle
            isActive={filter.isShowTrueSightOnly}
            toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
          />
        )}
        <NetworkSelect filter={filter} setFilter={setFilter} />
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
      </TrueSightFilterBarSection>
    </TrueSightFilterBarLayout>
  ) : (
    <TrueSightFilterBarLayoutMobile>
      <Flex justifyContent="space-between" style={{ gap: '16px' }}>
        <Flex style={{ gap: '12px', alignItems: 'center' }}>
          <MouseoverTooltip text={tooltipText}>
            <TextTooltip color={theme.subText} fontSize="14px" fontWeight={500}>
              <Trans>Timeframe</Trans>
            </TextTooltip>
          </MouseoverTooltip>
          <TimeframePicker activeTimeframe={filter.timeframe} setActiveTimeframe={setActiveTimeframe} />
        </Flex>

        {queryString.tab === 'trending' && (
          <Flex justifyContent="flex-end">
            <TrueSightToggle
              isActive={filter.isShowTrueSightOnly}
              toggle={() => setFilter(prev => ({ ...prev, isShowTrueSightOnly: !prev.isShowTrueSightOnly }))}
            />
          </Flex>
        )}
      </Flex>

      <NetworkSelect filter={filter} setFilter={setFilter} />

      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 16px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          background: theme.background,
        }}
      >
        <TrueSightSearchBoxOnMobile
          placeholder={t`Token name or tag`}
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
      </Flex>
    </TrueSightFilterBarLayoutMobile>
  )
}
