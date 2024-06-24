import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useMarketOverviewQuery } from 'services/marketOverview'

import { ButtonEmpty } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import SearchInput from 'components/SearchInput'
import { MouseoverTooltip } from 'components/Tooltip'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'
import { MEDIA_WIDTHS } from 'theme'

import SortIcon, { Direction } from './SortIcon'
import TableContent from './TableContent'
import { ContentWrapper, PriceSelectionField, SubHeaderRow, Tab, TableHeader, TableWrapper, Tabs, Tag } from './styles'
import useFilter from './useFilter'

const filterTags = [
  { label: 'Defi', value: 'defi' },
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

  const [buyPriceSelectedField, setBuyPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')
  const [sellPriceSelectedField, setSellPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')

  useEffect(() => {
    if (sortCol.startsWith('price_buy_change')) {
      updateFilters('sort', `price_buy_change_${buyPriceSelectedField}-${filters.chainId} ${sortDirection}`)
    }
  }, [buyPriceSelectedField, sortCol, updateFilters, filters.chainId, sortDirection])

  useEffect(() => {
    if (sortCol.startsWith('price_sell_change')) {
      updateFilters('sort', `price_sell_change_${sellPriceSelectedField}-${filters.chainId} ${sortDirection}`)
    }
  }, [sellPriceSelectedField, sortCol, updateFilters, filters.chainId, sortDirection])

  return (
    <PoolsPageWrapper>
      <Text as="h1" fontSize={24} fontWeight="500">
        <Trans>Market Overview</Trans>
      </Text>

      <Flex justifyContent="space-between" flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Flex sx={{ gap: '1rem' }} flexWrap="wrap">
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
        <SearchInput
          placeholder="Search by token name, symbol or address"
          value={input}
          onChange={val => setInput(val)}
          style={{ height: '36px' }}
        />
      </Flex>

      <TableWrapper>
        <ContentWrapper>
          {!upToMedium ? (
            <TableHeader>
              <Text color={theme.text} fontSize={14} height="100%" paddingX="12px" display="flex" alignItems="center">
                Name
              </Text>
              <Flex
                padding="8px 16px"
                sx={{
                  fontSize: '14px',
                  gap: '6px',
                }}
                alignItems="flex-start"
                justifyContent="flex-end"
              >
                <Text sx={{ lineHeight: '24px', whiteSpace: 'nowrap', minWidth: 'max-content' }}>On-chain Price</Text>
                <Flex flexWrap="wrap" alignItems="center" justifyContent="flex-end">
                  {chainSelector}
                </Flex>
              </Flex>

              <Text textAlign="right" fontSize="14px" padding="8px 16px">
                Market Overview <InfoHelper text="Market cap & 24h volume data sourced from Coingecko" />
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
                  <InfoHelper text="Market cap & 24h volume data sourced from Coingecko" />
                </Tab>
              </Tabs>

              <Flex flexWrap="wrap" alignItems="center" padding="0 0 1rem">
                {chainSelector}
              </Flex>
              <Divider />
            </>
          )}
          {!upToMedium && (
            <>
              <SubHeaderRow>
                <div />
                <Flex
                  justifyContent="flex-end"
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  onClick={() => updateSort('price_buy')}
                >
                  Buy Price
                  <SortIcon sorted={sortCol.startsWith('price_buy-') ? (sortDirection as Direction) : undefined} />
                </Flex>
                <Flex
                  justifyContent="flex-end"
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                >
                  <MouseoverTooltip
                    text={
                      <Flex flexDirection="column" margin="-8px -12px">
                        <PriceSelectionField
                          active={buyPriceSelectedField === '1h'}
                          onClick={() => setBuyPriceSelectedField('1h')}
                        >
                          1H
                        </PriceSelectionField>
                        <PriceSelectionField
                          active={buyPriceSelectedField === '24h'}
                          onClick={() => setBuyPriceSelectedField('24h')}
                        >
                          24H
                        </PriceSelectionField>
                        <PriceSelectionField
                          onClick={() => setBuyPriceSelectedField('7d')}
                          active={buyPriceSelectedField === '7d'}
                        >
                          7D
                        </PriceSelectionField>
                      </Flex>
                    }
                    noArrow
                    width="fit-content"
                    placement="bottom"
                  >
                    <Box
                      width="48px"
                      textAlign="center"
                      sx={{
                        borderRadius: '8px',
                        border: `1px solid ${theme.border}`,
                        // background: `${theme.primary}33`,
                        color: theme.text,
                      }}
                      padding="4px 12px"
                    >
                      {buyPriceSelectedField.toUpperCase()}
                    </Box>
                  </MouseoverTooltip>
                  <ButtonEmpty
                    padding="6px"
                    width="fit-content"
                    onClick={() => updateSort(`price_buy_change_${buyPriceSelectedField}`)}
                  >
                    <SortIcon
                      sorted={sortCol.startsWith('price_buy_change') ? (sortDirection as Direction) : undefined}
                    />
                  </ButtonEmpty>
                </Flex>

                <Flex
                  justifyContent="flex-end"
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  onClick={() => updateSort('price_sell')}
                >
                  Sell Price
                  <SortIcon sorted={sortCol.startsWith('price_sell-') ? (sortDirection as Direction) : undefined} />
                </Flex>

                <Flex
                  justifyContent="flex-end"
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  padding="0.5rem 1.5rem"
                >
                  <MouseoverTooltip
                    text={
                      <Flex flexDirection="column" margin="-8px -12px">
                        <PriceSelectionField
                          active={sellPriceSelectedField === '1h'}
                          onClick={() => setSellPriceSelectedField('1h')}
                        >
                          1H
                        </PriceSelectionField>
                        <PriceSelectionField
                          active={sellPriceSelectedField === '24h'}
                          onClick={() => setSellPriceSelectedField('24h')}
                        >
                          24H
                        </PriceSelectionField>
                        <PriceSelectionField
                          onClick={() => setSellPriceSelectedField('7d')}
                          active={sellPriceSelectedField === '7d'}
                        >
                          7D
                        </PriceSelectionField>
                      </Flex>
                    }
                    noArrow
                    width="fit-content"
                    placement="bottom"
                  >
                    <Box
                      width="48px"
                      textAlign="center"
                      sx={{
                        borderRadius: '8px',
                        border: `1px solid ${theme.border}`,
                        // background: `${theme.primary}33`,
                        color: theme.text,
                      }}
                      padding="4px 12px"
                    >
                      {sellPriceSelectedField.toUpperCase()}
                    </Box>
                  </MouseoverTooltip>
                  <ButtonEmpty
                    padding="6px"
                    width="fit-content"
                    onClick={() => updateSort(`price_sell_change_${buyPriceSelectedField}`)}
                  >
                    <SortIcon
                      sorted={sortCol.startsWith('price_sell_change') ? (sortDirection as Direction) : undefined}
                    />
                  </ButtonEmpty>
                </Flex>

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
              </SubHeaderRow>
              <Divider />
            </>
          )}
          <TableContent
            showMarketInfo={showMarketInfo}
            buyPriceSelectedField={buyPriceSelectedField}
            setBuyPriceSelectedField={setBuyPriceSelectedField}
            sellPriceSelectedField={sellPriceSelectedField}
            setSellPriceSelectedField={setSellPriceSelectedField}
          />
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
