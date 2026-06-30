import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Star } from 'react-feather'
import { useMedia } from 'react-use'
import { useMarketOverviewQuery } from 'services/tokenCatalog'

import { ButtonEmpty } from 'components/Button'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { PoolsPageWrapper } from 'components/PageWrappers'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import Search from 'components/Search'
import { HiddenH1, HiddenH2 } from 'components/Seo/HiddenSeoHeadings'
import { MouseoverTooltip } from 'components/Tooltip'
import { MAINNET_NETWORKS } from 'constants/networks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import TableContent from 'pages/MarketOverview/TableContent'
import {
  ContentWrapper,
  PriceSelectionField,
  SubHeaderRow,
  Tab,
  TableHeader,
  TableWrapper,
  Tabs,
  Tag,
} from 'pages/MarketOverview/styles'
import useFilter from 'pages/MarketOverview/useFilter'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const filterTags = [
  { label: 'Defi', value: 'defi' },
  { label: 'Meme', value: 'memes' },
  { label: 'AI', value: 'ai-big-data' },
  { label: 'RWA', value: 'real-world-assets' },
  { label: 'Game', value: 'gaming' },
]

export default function MarketOverview() {
  const [showMarketInfo, setShowMarketInfo] = useState(false)
  const { filters, updateFilters } = useFilter()
  const { data, isFetching, isLoading } = useMarketOverviewQuery(filters)

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
        <MouseoverTooltip text={NETWORKS_INFO[item].name} key={item} placement="top" width="fit-content">
          <div
            className={cn(
              'flex items-center rounded p-1',
              filters.chainId === item ? 'border border-solid border-primary bg-primary-20' : 'border-none',
            )}
            role="button"
            onClick={() => {
              updateFilters('chainId', item.toString())
              if (sortCol.startsWith('price')) {
                updateFilters('sort', sortCol.split('-')[0] + '-' + item + ' ' + sortDirection)
              }
            }}
          >
            <img src={NETWORKS_INFO[item].icon} width="16px" height="16px" alt="" />
          </div>
        </MouseoverTooltip>
      ))}
    </>
  )

  const [buyPriceSelectedField, setBuyPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')
  const [sellPriceSelectedField, setSellPriceSelectedField] = useState<'1h' | '24h' | '7d'>('24h')

  return (
    <PoolsPageWrapper>
      <HiddenH1>Live token on-chain prices, trading volume, and market trends across multiple chains.</HiddenH1>
      <HiddenH2>Spot opportunities and jump straight into a trade from one dashboard.</HiddenH2>
      <div>
        <p className="text-[24px] font-medium">
          <Trans>Market Overview</Trans>
        </p>
        <p className="mt-2 text-subText">
          <Trans>
            The first-ever aggregated on-chain price platform, offering the most real-time, trade-able, and reliable
            price data.
          </Trans>
        </p>
      </div>

      <div className={cn('flex justify-between gap-4', upToSmall ? 'flex-col' : 'flex-row')}>
        <div className="flex flex-wrap gap-4">
          <Tag active={!tags.length} onClick={() => updateFilters('tags', '')} role="button">
            <Trans>All</Trans>
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
        </div>
        <Search
          placeholder={t`Search by token name, symbol or address`}
          searchValue={input}
          allowClear
          onSearch={val => setInput(val)}
          style={{ height: '36px' }}
        />
      </div>

      <TableWrapper className="relative">
        <RefetchIndicator visible={isFetching && !isLoading} />
        <ContentWrapper>
          {!upToMedium ? (
            <TableHeader>
              <p className="flex h-full items-center px-3 text-[14px] text-text">
                <Trans>Name</Trans>
              </p>
              <div className="flex items-start justify-end gap-1.5 px-4 py-2 text-[14px]">
                <span className="min-w-max whitespace-nowrap leading-6">
                  <Trans>On-chain Price</Trans>
                </span>
                <div className="flex flex-wrap items-center justify-end">{chainSelector}</div>
              </div>

              <p className="px-4 py-2 text-right text-[14px]">
                <Trans>Market Overview</Trans>{' '}
                <InfoHelper text={t`Market cap & 24h volume data sourced from Coingecko`} />
              </p>
            </TableHeader>
          ) : (
            <>
              <Tabs>
                <Tab role="button" active={!showMarketInfo} onClick={() => setShowMarketInfo(false)}>
                  <Trans>On-chain Price</Trans>
                </Tab>
                <span>|</span>
                <Tab role="button" active={showMarketInfo} onClick={() => setShowMarketInfo(true)}>
                  <Trans>Market Overview</Trans>
                  <InfoHelper text={t`Market cap & 24h volume data sourced from Coingecko`} />
                </Tab>
              </Tabs>

              <div className="flex flex-wrap items-center pb-4">{chainSelector}</div>
              <Divider />
            </>
          )}
          {!upToMedium && (
            <>
              <SubHeaderRow>
                <div />
                <div
                  className="flex cursor-pointer items-center justify-end gap-1"
                  role="button"
                  onClick={() => updateSort('price_buy')}
                >
                  <Trans>Buy Price</Trans>
                  <SortIcon sorted={sortCol.startsWith('price_buy-') ? (sortDirection as Direction) : undefined} />
                </div>
                <div className="flex cursor-pointer items-center justify-end gap-1 px-4 py-2" role="button">
                  <MouseoverTooltip
                    text={
                      <div className="-mx-3 -my-2 flex flex-col">
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
                      </div>
                    }
                    noArrow
                    width="fit-content"
                    placement="bottom"
                  >
                    <div className="w-12 rounded-lg border border-solid border-border px-3 py-1 text-center text-text">
                      {buyPriceSelectedField.toUpperCase()}
                    </div>
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
                </div>

                <div
                  className="flex cursor-pointer items-center justify-end gap-1"
                  role="button"
                  onClick={() => updateSort('price_sell')}
                >
                  <Trans>Sell Price</Trans>
                  <SortIcon sorted={sortCol.startsWith('price_sell-') ? (sortDirection as Direction) : undefined} />
                </div>

                <div className="flex cursor-pointer items-center justify-end gap-1 px-4 py-2" role="button">
                  <MouseoverTooltip
                    text={
                      <div className="-mx-3 -my-2 flex flex-col">
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
                      </div>
                    }
                    noArrow
                    width="fit-content"
                    placement="bottom"
                  >
                    <div className="w-12 rounded-lg border border-solid border-border px-3 py-1 text-center text-text">
                      {sellPriceSelectedField.toUpperCase()}
                    </div>
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
                </div>

                <div
                  className="flex cursor-pointer items-center justify-end gap-1"
                  role="button"
                  onClick={() => updateSort('volume_24h', false)}
                >
                  <Trans>24h Volume</Trans>
                  <SortIcon sorted={sortCol === 'volume_24h' ? (sortDirection as Direction) : undefined} />
                </div>

                <div
                  className="flex cursor-pointer items-center justify-end gap-1"
                  role="button"
                  onClick={() => updateSort('market_cap', false)}
                >
                  <Trans>Market cap</Trans>
                  <SortIcon sorted={sortCol === 'market_cap' ? (sortDirection as Direction) : undefined} />
                </div>
              </SubHeaderRow>
              <Divider />
            </>
          )}
          <TableContent
            showMarketInfo={showMarketInfo}
            buyPriceSelectedField={buyPriceSelectedField}
            sellPriceSelectedField={sellPriceSelectedField}
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

      <p className="text-center text-[14px] italic text-subText">
        <Trans>
          Data and information on KyberSwap.com is for informational purposes only, neither recommendation nor
          investment advice is provided.
        </Trans>
      </p>
    </PoolsPageWrapper>
  )
}
