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
import BubbleTokens, { type BubbleToken } from './components/BubbleTokens'
import MarketMoodGauge from './components/MarketMoodGauge'
import { ContentWrapper, MarketTableHeader, MarketTableWrapper, PriceSelectionField, SortableHeader } from './styles'
import useFilter from './useFilter'

const bubbleTokenPool: BubbleToken[] = [
  { id: 'doge-1', symbol: 'DOGE', change: 132.8, size: 'xl', tone: 'bull', score: 13 },
  { id: 'shib', symbol: 'SHIB', change: -132.8, size: 'lg', tone: 'bear', score: 64 },
  { id: 'fun', symbol: 'FUN', change: 86.8, size: 'lg', tone: 'bull', score: 13 },
  { id: 'bq', symbol: 'BQ', change: -86.8, size: 'lg', tone: 'bear', score: 64 },
  { id: 'doge-2', symbol: 'DOGE', change: 132.8, size: 'lg', tone: 'bull', score: 13 },
  { id: 'usdc', symbol: 'USDC', change: 0, size: 'md', tone: 'neutral', score: 86 },
  { id: 'enj-1', symbol: 'ENJ', change: 34.8, size: 'md', tone: 'bull', score: 37 },
  { id: 'tron', symbol: 'TRON', change: -13.2, size: 'md', tone: 'bear', score: 1 },
  { id: 'usdt-1', symbol: 'USDT', change: 0, size: 'sm', tone: 'neutral', score: 37 },
  { id: 'usdt-2', symbol: 'USDT', change: 0, size: 'sm', tone: 'neutral', score: 37 },
  { id: 'bnb-1', symbol: 'BNB', change: 5.76, size: 'sm', tone: 'bull', score: 37 },
  { id: 'bnb-2', symbol: 'BNB', change: 5.76, size: 'sm', tone: 'bull', score: 37 },
  { id: 'bnb-3', symbol: 'BNB', change: 5.76, size: 'sm', tone: 'bull', score: 37 },
  { id: 'bnb-4', symbol: 'BNB', change: 5.76, size: 'sm', tone: 'bull', score: 37 },
  { id: 'xrp-1', symbol: 'XRP', change: -8.54, size: 'sm', tone: 'bear', score: 64 },
  { id: 'xrp-2', symbol: 'XRP', change: -8.54, size: 'sm', tone: 'bear', score: 64 },
  { id: 'enj-2', symbol: 'ENJ', change: 34.8, size: 'sm', tone: 'bull', score: 37 },
  { id: 'bnb-5', symbol: 'BNB', change: 5.76, size: 'sm', tone: 'bull', score: 37 },
  { id: 'btc', symbol: 'BTC', change: 2.15, size: 'md', tone: 'bull', score: 71 },
  { id: 'eth', symbol: 'ETH', change: -1.25, size: 'md', tone: 'bear', score: 42 },
  { id: 'sol', symbol: 'SOL', change: 9.12, size: 'sm', tone: 'bull', score: 55 },
  { id: 'ada', symbol: 'ADA', change: -4.21, size: 'sm', tone: 'bear', score: 28 },
  { id: 'matic', symbol: 'MATIC', change: 3.84, size: 'sm', tone: 'bull', score: 63 },
  { id: 'avax', symbol: 'AVAX', change: -6.9, size: 'sm', tone: 'bear', score: 47 },
]

const pickRandomTokens = (pool: BubbleToken[], count: number) => {
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

const randomizeToken = (token: BubbleToken): BubbleToken => {
  const isNeutral = Math.random() < 0.15
  const change = isNeutral ? 0 : Number((Math.random() * 300 - 150).toFixed(2))
  const sizes: BubbleToken['size'][] = ['sm', 'md', 'lg', 'xl']
  const size = sizes[Math.floor(Math.random() * sizes.length)]
  const score = Math.random() < 0.15 ? undefined : Math.floor(Math.random() * 99) + 1
  return {
    ...token,
    change,
    size,
    score,
    tone: isNeutral ? 'neutral' : change > 0 ? 'bull' : 'bear',
  }
}

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

  const [marketPieValue, setMarketPieValue] = useState(() => Math.floor(Math.random() * 101))
  const [bubbleTokens, setBubbleTokens] = useState<BubbleToken[]>(() =>
    pickRandomTokens(bubbleTokenPool, 20).map(randomizeToken),
  )
  const [bubbleSeed, setBubbleSeed] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMarketPieValue(Math.floor(Math.random() * 101))
    }, 3000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBubbleTokens(pickRandomTokens(bubbleTokenPool, 20).map(randomizeToken))
      setBubbleSeed(seed => seed + 1)
    }, 5000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <PoolsPageWrapper>
      <div style={{ marginBottom: 48 }}>
        <BubbleTokens tokens={bubbleTokens} randomizeKey={bubbleSeed} />
      </div>
      <Flex style={{ marginBottom: 120, alignItems: 'flex-end' }}>
        <MarketMoodGauge size={240} value={marketPieValue} />
        <MarketMoodGauge size={320} value={marketPieValue} />
        <MarketMoodGauge size={400} value={marketPieValue} />
      </Flex>
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
