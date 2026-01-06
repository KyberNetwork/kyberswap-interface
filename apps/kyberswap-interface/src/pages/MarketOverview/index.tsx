import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import { useMarketOverviewQuery } from 'services/marketOverview'

import { ButtonEmpty } from 'components/Button'
import Pagination from 'components/Pagination'
import { MouseoverTooltip } from 'components/Tooltip'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { PoolsPageWrapper } from 'pages/Pools/styleds'

import Filter from './Filter'
import SortIcon, { Direction } from './SortIcon'
import TableContent from './TableContent'
import { ContentWrapper, MarketTableHeader, MarketTableWrapper, PriceSelectionField, SortableHeader } from './styles'
import useFilter from './useFilter'

export default function MarketOverview() {
  const theme = useTheme()

  const { filters, updateFilters } = useFilter()
  const { data } = useMarketOverviewQuery(filters)

  const [sortCol, sortDirection] = (filters.sort || '').split(' ')

  const { search } = filters
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

  const [buyPriceSelectedField, setBuyPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')
  const [sellPriceSelectedField, setSellPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')

  return (
    <PoolsPageWrapper>
      <div>
        <Text as="h1" fontSize={24} fontWeight="500">
          <Trans>Market Overview</Trans>
        </Text>
        <Text color={theme.subText} marginTop="8px">
          <Trans>
            The first-ever aggregated on-chain price platform, offering the most real-time, trade-able, and reliable
            price data.
          </Trans>
        </Text>
      </div>

      <Filter filters={filters} updateFilters={updateFilters} input={input} setInput={setInput} />

      <MarketTableWrapper>
        <ContentWrapper>
          <MarketTableHeader>
            <Text color={theme.subText}>
              <Trans>Name</Trans>
            </Text>
            <Flex justifyContent="flex-end" alignItems="center" sx={{ gap: '4px', flexWrap: 'wrap' }}>
              <Text color={theme.subText}>
                <Trans>Price</Trans>
              </Text>
              <SortableHeader role="button" onClick={() => updateSort('price_buy')}>
                <Trans>Buy</Trans>
                <SortIcon sorted={sortCol.startsWith('price_buy-') ? (sortDirection as Direction) : undefined} />
              </SortableHeader>
              <Text color={theme.subText}>/</Text>
              <SortableHeader role="button" onClick={() => updateSort('price_sell')}>
                <Trans>Sell</Trans>
                <SortIcon sorted={sortCol.startsWith('price_sell-') ? (sortDirection as Direction) : undefined} />
              </SortableHeader>
            </Flex>
            <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
              <Text color={theme.subText}>
                <Trans>Buy Change</Trans>
              </Text>
              <SortableHeader role="button">
                <MouseoverTooltip
                  text={
                    <Flex flexDirection="column" margin="-8px -12px">
                      <PriceSelectionField
                        active={buyPriceSelectedField === '1h'}
                        onClick={() => {
                          setBuyPriceSelectedField('1h')
                          if (sortCol.startsWith('price_buy_change')) {
                            updateFilters('sort', `price_buy_change_1h-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                      >
                        <Trans>1H</Trans>
                      </PriceSelectionField>
                      <PriceSelectionField
                        active={buyPriceSelectedField === '24h'}
                        onClick={() => {
                          setBuyPriceSelectedField('24h')
                          if (sortCol.startsWith('price_buy_change')) {
                            updateFilters('sort', `price_buy_change_24h-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                      >
                        <Trans>24H</Trans>
                      </PriceSelectionField>
                      <PriceSelectionField
                        onClick={() => {
                          setBuyPriceSelectedField('7d')
                          if (sortCol.startsWith('price_buy_change')) {
                            updateFilters('sort', `price_buy_change_7d-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                        active={buyPriceSelectedField === '7d'}
                      >
                        <Trans>7D</Trans>
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
              </SortableHeader>
            </Flex>

            <Flex flexDirection="column" alignItems="flex-end" sx={{ gap: '4px' }}>
              <Text color={theme.subText}>
                <Trans>Sell Change</Trans>
              </Text>
              <SortableHeader role="button" sx={{ justifyContent: 'flex-end' }}>
                <MouseoverTooltip
                  text={
                    <Flex flexDirection="column" margin="-8px -12px">
                      <PriceSelectionField
                        active={sellPriceSelectedField === '1h'}
                        onClick={() => {
                          setSellPriceSelectedField('1h')
                          if (sortCol.startsWith('price_sell_change')) {
                            updateFilters('sort', `price_sell_change_1h-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                      >
                        <Trans>1H</Trans>
                      </PriceSelectionField>
                      <PriceSelectionField
                        active={sellPriceSelectedField === '24h'}
                        onClick={() => {
                          setSellPriceSelectedField('24h')
                          if (sortCol.startsWith('price_sell_change')) {
                            updateFilters('sort', `price_sell_change_24h-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                      >
                        <Trans>24H</Trans>
                      </PriceSelectionField>
                      <PriceSelectionField
                        onClick={() => {
                          setSellPriceSelectedField('7d')
                          if (sortCol.startsWith('price_sell_change')) {
                            updateFilters('sort', `price_sell_change_7d-${filters.chainId} ${sortDirection}`)
                          }
                        }}
                        active={sellPriceSelectedField === '7d'}
                      >
                        <Trans>7D</Trans>
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
              </SortableHeader>
            </Flex>

            <SortableHeader role="button" onClick={() => updateSort('volume_24h', false)} sx={{ justifySelf: 'end' }}>
              <Trans>24h Volume</Trans>
              <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
            </SortableHeader>

            <SortableHeader role="button" onClick={() => updateSort('market_cap', false)} sx={{ justifySelf: 'end' }}>
              <Trans>Market Cap</Trans>
              <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
            </SortableHeader>
            <div />
          </MarketTableHeader>

          <TableContent buyPriceSelectedField={buyPriceSelectedField} sellPriceSelectedField={sellPriceSelectedField} />
        </ContentWrapper>
        <Pagination
          onPageChange={(newPage: number) => {
            updateFilters('page', newPage.toString())
          }}
          totalCount={data?.data?.pagination?.totalItems || 0}
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 10}
        />
      </MarketTableWrapper>

      <Text color={theme.subText} textAlign="center" fontStyle="italic" fontSize={14}>
        <Trans>
          Data and information on KyberSwap.com is for informational purposes only, neither recommendation nor
          investment advice is provided.
        </Trans>
      </Text>
    </PoolsPageWrapper>
  )
}
