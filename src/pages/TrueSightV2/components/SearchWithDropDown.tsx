import { Trans, t } from '@lingui/macro'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import History from 'components/Icons/History'
import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import SearchWithDropdown, { SearchSection } from 'components/Search/SearchWithDropdown'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { useFormatParamsFromUrl } from 'pages/TrueSightV2/utils'
import { MEDIA_WIDTHS } from 'theme'

import { KYBERAI_LISTYPE_TO_MIXPANEL } from '../constants'
import { useLazySearchTokenQuery, useSearchTokenQuery, useTokenListQuery } from '../hooks/useKyberAIData'
import { ITokenList, ITokenSearchResult, KyberAIListType } from '../types'
import { formatTokenPrice } from '../utils'
import WatchlistButton from './WatchlistButton'

const formatTokenType = (token: ITokenList): ITokenSearchResult => {
  return {
    assetId: token.assetId,
    name: token.name,
    symbol: token.symbol,
    logo: token.logo,
    price: token.price,
    priceChange24h: token.priceChange24H,
    kyberScore: {
      score: token.kyberScore || 0,
      label: token.kyberScoreTag || '',
    },
  }
}

const DropdownItem = styled.tr`
  padding: 6px;
  background-color: ${({ theme }) => theme.tableHeader};
  height: 36px;
  :hover {
    filter: brightness(1.3);
  }
`

const TokenItem = ({ token, onClick }: { token: ITokenSearchResult; onClick?: () => void }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  if (!token) return null
  return (
    <DropdownItem
      onClick={() => {
        onClick?.()
        navigate(`${APP_PATHS.KYBERAI_EXPLORE}/${token.assetId}`)
      }}
    >
      <td>
        <RowFit gap="10px">
          <WatchlistButton size={16} assetId={token.assetId} symbol={token.symbol} />

          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={token.logo}
                alt={token.symbol}
                width={above768 ? '22px' : '18px'}
                height={above768 ? '22px' : '18px'}
                style={{ display: 'block' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-6px',
                borderRadius: '50%',
                border: `1px solid ${theme.background}`,
                backgroundColor: theme.tableHeader,
              }}
            >
              {/* <img
                src={NETWORK_IMAGE_URL[token.chain]}
                alt="eth"
                width={above768 ? '12px' : '10px'}
                height={above768 ? '12px' : '10px'}
                style={{ display: 'block' }}
              /> */}
            </div>
          </div>
          <Text fontSize={above768 ? '12px' : '10px'} color={theme.text}>
            {token.name} <span style={{ color: theme.subText }}>({token.symbol.toUpperCase()})</span>
          </Text>
        </RowFit>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text
          fontSize={above768 ? '12px' : '10px'}
          color={token.kyberScore ? (token.kyberScore?.score < 50 ? theme.red : theme.primary) : theme.subText}
        >
          {token.kyberScore?.score ? (
            <>
              {token.kyberScore?.score}
              <Text as="span" fontSize="10px" color={theme.subText}>
                /100
              </Text>
            </>
          ) : (
            <>--</>
          )}
        </Text>
      </td>
      <td style={{ textAlign: 'left' }}>
        <Text fontSize={above768 ? '12px' : '10px'} color={theme.text}>
          ${formatTokenPrice(token.price)}
        </Text>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text
          fontSize={above768 ? '12px' : '10px'}
          color={token.priceChange24h && token.priceChange24h < 0 ? theme.red : theme.primary}
        >
          {token.priceChange24h ? `${token.priceChange24h.toFixed(2)}%` : `--%`}
        </Text>
      </td>
    </DropdownItem>
  )
}

const columns = [
  { align: 'left', label: 'KyberScore', style: { width: '100px', minWidth: 'auto' } },
  { align: 'left', label: 'Price', style: { width: '100px' } },
  { align: 'right', label: '24H', style: { width: '60px' } },
]
let checkedNewData = false
const SearchWithDropdownKyberAI = () => {
  const theme = useTheme()
  const mixpanelHandler = useMixpanelKyberAI()
  const { pathname } = useLocation()

  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 1000)
  const { data: searchResult, isFetching } = useSearchTokenQuery(
    { q: debouncedSearch, size: 10 },
    { skip: !debouncedSearch },
  )
  const [history, setHistory] = useLocalStorage<Array<ITokenSearchResult>>('kyberai-search-history')
  const saveToHistory = useCallback(
    (token: ITokenSearchResult) => {
      if (!(history && history.some(t => t.assetId === token.assetId))) {
        setHistory([token, ...(history || [])].slice(0, 3))
      }
    },
    [history, setHistory],
  )

  const [getTokenData] = useLazySearchTokenQuery()
  useEffect(() => {
    if (history && !checkedNewData) {
      const fetchHistoryTokenInfo = async () => {
        const results = await Promise.all(
          history.map(t => {
            return getTokenData({ q: t.assetId, size: 1 }, true).unwrap()
          }),
        )
        setHistory(results.map(res => res[0]))
        checkedNewData = true
      }
      fetchHistoryTokenInfo()
    }
  }, [history, getTokenData, setHistory])

  const { listType } = useFormatParamsFromUrl()

  const { data: top5bullish, isLoading: isBullishLoading } = useTokenListQuery({
    type: KyberAIListType.BULLISH,
    page: 1,
    pageSize: 3,
  })

  const { data: top5bearish, isLoading: isBearishLoading } = useTokenListQuery({
    type: KyberAIListType.BEARISH,
    page: 1,
    pageSize: 3,
  })

  const haveSearchResult = debouncedSearch !== '' && searchResult && searchResult.length > 0 && !isFetching
  const noSearchResult = debouncedSearch !== '' && searchResult && searchResult.length === 0 && !isFetching
  const isLoading = isFetching && search === debouncedSearch

  const onSelect = useCallback(
    (item: ITokenList | ITokenSearchResult, payload = {}, itemSearch = false) => {
      setExpanded(false)
      saveToHistory(itemSearch ? (item as ITokenSearchResult) : formatTokenType(item as ITokenList))
      mixpanelHandler(MIXPANEL_TYPE.KYBERAI_SEARCH_TOKEN_SUCCESS, {
        token_name: item.symbol?.toUpperCase(),
        source: pathname.includes(APP_PATHS.KYBERAI_EXPLORE) ? 'explore' : KYBERAI_LISTYPE_TO_MIXPANEL[listType],
        ...payload,
      })
    },
    [listType, mixpanelHandler, pathname, saveToHistory],
  )

  const getItemsBullishBearish = useCallback(
    (arr: ITokenList[] | undefined, onClick: (item: ITokenList) => void) =>
      (arr || []).map((item, index) => (
        <TokenItem key={index} token={formatTokenType(item)} onClick={() => onClick(item)} />
      )),
    [],
  )

  const sections: SearchSection[] = useMemo(() => {
    const searchResultNode = (searchResult || []).map(item => (
      <TokenItem
        key={item.assetId}
        token={item}
        onClick={() => onSelect(item, { search_term: debouncedSearch }, true)}
      />
    ))

    const historyNode = (history || []).map((item, index) => (
      <TokenItem key={index} token={item} onClick={() => setExpanded(false)} />
    ))

    return haveSearchResult
      ? [{ items: searchResultNode }]
      : [
          {
            title: (
              <RowFit color={theme.subText} gap="10px">
                <History />
                <Text fontSize="12px">Search History</Text>
              </RowFit>
            ),
            items: historyNode,
            show: !!history,
          },
          {
            title: (
              <RowFit color={theme.subText} gap="10px">
                <Icon id="bullish" size={16} />
                <Text fontSize="12px">Bullish Tokens</Text>
              </RowFit>
            ),
            loading: isBullishLoading,
            items: getItemsBullishBearish(top5bullish?.data, item => onSelect(item, { token_type: 'bullish' })),
          },
          {
            title: (
              <RowFit color={theme.subText} gap="10px">
                <Icon id="bearish" size={16} />
                <Text fontSize="12px">Bearish Tokens</Text>
              </RowFit>
            ),
            loading: isBearishLoading,
            items: getItemsBullishBearish(top5bearish?.data, item => onSelect(item, { token_type: 'bearish' })),
          },
        ]
  }, [
    isBearishLoading,
    isBullishLoading,
    history,
    onSelect,
    top5bearish,
    top5bullish,
    haveSearchResult,
    debouncedSearch,
    searchResult,
    theme,
    getItemsBullishBearish,
  ])

  return (
    <SearchWithDropdown
      columns={columns}
      expanded={expanded}
      setExpanded={setExpanded}
      noSearchResult={!!noSearchResult}
      noResultText={t`Oops, we couldnt find your token! We will regularly add new tokens that have achieved a certain
      trading volume`}
      searching={isLoading}
      id="kyberai-search"
      value={search}
      onChange={setSearch}
      placeholder={t`Search by token name, symbol or contract address`}
      sections={sections}
      searchIcon={
        <Trans>
          <Icon id="search" size={24} /> Ape Smart!
        </Trans>
      }
    />
  )
}

export default SearchWithDropdownKyberAI
