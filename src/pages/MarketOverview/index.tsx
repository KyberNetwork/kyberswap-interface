import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useMarketOverviewQuery } from 'services/marketOverview'

import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'
import { MEDIA_WIDTHS } from 'theme'

import SortIcon, { Direction } from './SortIcon'
import TableContent from './TableContent'
import { ContentWrapper, InnerGrid, Tab, TableHeader, TableWrapper, Tabs, Tag } from './styles'
import useFilter from './useFilter'

const filterTags = [
  { label: 'Defi', value: 'defi' },
  { label: 'Gainers', value: 'gainers' },
  { label: 'Losers', value: 'losers' },
  { label: 'Meme', value: 'memes' },
  { label: 'AI', value: 'ai-big-data' },
  { label: 'RWA', value: 'real-world-assets' },
  { label: 'Game', value: 'gaming' },
]

export default function MarketOverview() {
  const theme = useTheme()
  const [showMarketInfo, setShowMarketInfo] = useState(false)
  const { filters, updateFilters } = useFilter()
  const { data } = useMarketOverviewQuery(filters)

  const [sortCol, sortDirection] = (filters.sort || '').split(' ')

  const { search, tags, isFavorite } = filters
  const [input, setInput] = useState(search || '')
  const deboundedInput = useDebounce(input, 300)

  useEffect(() => {
    if (search !== deboundedInput) {
      updateFilters('search', deboundedInput || '')
    }
  }, [deboundedInput, search, updateFilters])

  const updateSort = (col: string, appendChain = true) => {
    const c = appendChain ? `${col}-${filters.chainId}` : col
    // desc -> acs -> none
    let newDirection: Direction | '' = Direction.DESC
    if (sortCol === c) {
      if (sortDirection === Direction.DESC) newDirection = Direction.ASC
      else if (sortDirection === Direction.ASC) newDirection = ''
    }
    updateFilters('sort', newDirection ? `${c} ${newDirection}` : '')
  }

  const isGainerActive = sortCol.includes('price_change_24h') && 'desc' === sortDirection
  const isLoserActive = sortCol.includes('price_change_24h') && 'asc' === sortDirection
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const chainSelector = (
    <>
      {MAINNET_NETWORKS.map(item => (
        <Flex
          key={item}
          alignItems="center"
          padding="4px"
          role="button"
          onClick={() => {
            updateFilters('chainId', item.toString())
            if (sortCol.startsWith('price')) {
              updateFilters('sort', sortCol.split('-')[0] + '-' + item + ' ' + sortDirection)
            }
          }}
          sx={{
            background: filters.chainId === item ? rgba(theme.primary, 0.2) : undefined,
            border: filters.chainId === item ? `1px solid ${theme.primary}` : 'none',
            borderRadius: '4px',
          }}
        >
          <img src={NETWORKS_INFO[item].icon} width="16px" height="16px" alt="" />
        </Flex>
      ))}
    </>
  )

  return (
    <PoolsPageWrapper>
      <Flex justifyContent="space-between" flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Text as="h1" fontSize={24} fontWeight="500">
          <Trans>Market Overview</Trans>
        </Text>
        <SearchInput
          placeholder="Search by token name, symbol or address"
          value={input}
          onChange={val => setInput(val)}
        />
      </Flex>

      <TableWrapper>
        <ContentWrapper>
          <Flex sx={{ gap: '1rem' }} marginBottom="24px" flexWrap="wrap">
            <Tag active={!tags.length} onClick={() => updateFilters('tags', '')} role="button">
              All
            </Tag>
            <Tag
              active={!!isFavorite}
              onClick={() => updateFilters('isFavorite', isFavorite ? '' : 'true')}
              role="button"
            >
              <Star size={14} />
            </Tag>
            {filterTags.map(item => (
              <Tag
                active={
                  ['gainers', 'losers'].includes(item.value)
                    ? sortCol.includes('price_change_24h') &&
                      (item.value === 'gainers' ? 'desc' : 'asc') === sortDirection
                    : tags?.includes(item.value)
                }
                onClick={() => {
                  if (['gainers', 'losers'].includes(item.value)) {
                    updateFilters(
                      'sort',
                      (isGainerActive && item.value === 'gainers') || (isLoserActive && item.value === 'losers')
                        ? ''
                        : `price_change_24h-${filters.chainId} ${item.value === 'gainers' ? 'desc' : 'asc'}`,
                    )
                    return
                  }
                  if (tags.includes(item.value)) {
                    updateFilters('tags', tags.filter(t => t !== item.value).join(','))
                  } else {
                    updateFilters('tags', [...tags, item.value].join(','))
                  }
                }}
                key={item.value}
                role="button"
              >
                {item.label}
              </Tag>
            ))}
          </Flex>

          <Divider />

          {!upToMedium ? (
            <TableHeader>
              <Text
                color={theme.subText}
                fontSize={14}
                height="100%"
                paddingX="12px"
                display="flex"
                alignItems="center"
                sx={{ borderRight: `1px solid ${theme.border}` }}
              >
                Name
              </Text>
              <Box
                sx={{
                  borderRight: `1px solid ${theme.border}`,
                }}
                height="100%"
              >
                <Flex
                  padding="8px 16px"
                  sx={{
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: '14px',
                    gap: '4px',
                  }}
                  alignItems="center"
                >
                  <span>On-chain Price</span>
                  <Flex flexWrap="wrap" alignItems="center">
                    {chainSelector}
                  </Flex>
                </Flex>
                <InnerGrid>
                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('price')}
                  >
                    Price
                    <SortIcon sorted={sortCol.startsWith('price-') ? (sortDirection as Direction) : undefined} />
                  </Flex>
                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('price_change_1h')}
                  >
                    1h
                    <SortIcon
                      sorted={sortCol.startsWith('price_change_1h') ? (sortDirection as Direction) : undefined}
                    />
                  </Flex>

                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('price_change_24h')}
                  >
                    24h
                    <SortIcon
                      sorted={sortCol.startsWith('price_change_24h') ? (sortDirection as Direction) : undefined}
                    />
                  </Flex>

                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('price_change_7d')}
                    padding="0.5rem 1.5rem"
                  >
                    7D
                    <SortIcon
                      sorted={sortCol.startsWith('price_change_7d') ? (sortDirection as Direction) : undefined}
                    />
                  </Flex>
                </InnerGrid>
              </Box>

              <Box
                sx={{
                  borderRight: `1px solid ${theme.border}`,
                }}
                height="100%"
              >
                <Text
                  textAlign="center"
                  fontSize="14px"
                  padding="8px 16px"
                  sx={{
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  Market Overview <InfoHelper text="Marketcap & 24h volume data sourced from Coingecko" />
                </Text>

                <InnerGrid sx={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('volume_24h', false)}
                  >
                    24h Volume
                    <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
                  </Flex>

                  <Flex
                    justifyContent="flex-end"
                    sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                    role="button"
                    onClick={() => updateSort('market_cap', false)}
                    padding="0.5rem 1.5rem"
                  >
                    Market cap
                    <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
                  </Flex>
                </InnerGrid>
              </Box>

              <Text textAlign="center" fontSize={14}>
                Actions
              </Text>
            </TableHeader>
          ) : (
            <>
              <Tabs>
                <Tab role="button" active={!showMarketInfo} onClick={() => setShowMarketInfo(false)}>
                  On-chain Price
                </Tab>
                <span>|</span>
                <Tab role="button" active={showMarketInfo} onClick={() => setShowMarketInfo(true)}>
                  Market Overview
                  <InfoHelper text="Marketcap & 24h volume data sourced from Coingecko" />
                </Tab>
              </Tabs>

              <Flex flexWrap="wrap" alignItems="center" padding="0 0 1rem">
                {chainSelector}
              </Flex>
              <Divider />
            </>
          )}
          <TableContent showMarketInfo={showMarketInfo} />
        </ContentWrapper>
        <Pagination
          onPageChange={(newPage: number) => {
            updateFilters('page', newPage.toString())
          }}
          totalCount={data?.data?.pagination?.totalItems || 0}
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 20}
        />
      </TableWrapper>
    </PoolsPageWrapper>
  )
}
