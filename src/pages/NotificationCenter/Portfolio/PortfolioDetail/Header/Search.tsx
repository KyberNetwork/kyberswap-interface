import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { isMacOs, isMobile } from 'react-device-detect'
import { Star } from 'react-feather'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  useGetFavoritesPortfoliosQuery,
  useGetTrendingPortfoliosQuery,
  useSearchPortfolioQuery,
  useToggleFavoritePortfolioMutation,
} from 'services/portfolio'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import Avatar from 'components/Avatar'
import History from 'components/Icons/History'
import Icon from 'components/Icons/Icon'
import Row, { RowFit } from 'components/Row'
import SearchWithDropdown, { SearchSection } from 'components/Search/SearchWithDropdown'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useNavigateToPortfolioDetail } from 'pages/NotificationCenter/Portfolio/helpers'
import { PortfolioSearchData } from 'pages/NotificationCenter/Portfolio/type'
import { StarWithAnimation } from 'pages/TrueSightV2/components/WatchlistStar'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'
import { formatDisplayNumber } from 'utils/numbers'
import { shortString } from 'utils/string'

const ShortCut = styled.span`
  background-color: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  border-radius: 16px;
  padding: 2px 8px;
  font-size: 10px;
`

const columns = [{ align: 'right', label: 'Value', style: { width: '100px', minWidth: 'auto' } }]
const DropdownItem = styled.tr`
  padding: 6px;
  background-color: ${({ theme }) => theme.tableHeader};
  height: 36px;
  font-size: 12px;
  font-weight: 400;
  :hover {
    filter: brightness(1.3);
  }
`

const getPortfolioId = (data: PortfolioSearchData) => data.id || data.name

const PortfolioItem = ({
  onSelect,
  data,
  favorites,
}: {
  onSelect: (v: PortfolioSearchData) => void
  data: PortfolioSearchData
  favorites: PortfolioSearchData[]
}) => {
  const theme = useTheme()
  const navigate = useNavigateToPortfolioDetail()
  const displayName = data.name || data.id
  const id = getPortfolioId(data)
  const [toggleFavorite, { isLoading }] = useToggleFavoritePortfolioMutation()
  const isFavorite = favorites.some(e => e.id === id)

  const notify = useNotify()
  const onToggleFavorite = async () => {
    try {
      if (isLoading) return
      await toggleFavorite({ value: id, isAdd: !isFavorite }).unwrap()
    } catch (error) {
      notify({
        type: NotificationType.WARNING,
        summary: t`You can only watch up to 3 portfolios.`,
        title: t`Save favorites`,
      })
    }
  }

  return (
    <DropdownItem
      onClick={() => {
        navigate({ portfolioId: id, myPortfolio: false }, false, { search: 1 })
        onSelect(data)
      }}
    >
      <td>
        <Row alignItems="center" gap="6px">
          <StarWithAnimation size={18} active={isFavorite} onClick={onToggleFavorite} stopPropagation />
          <Avatar url="" color={theme.subText} size={16} />
          <Text color={theme.subText} sx={{ whiteSpace: 'nowrap' }}>
            {isMobile
              ? isAddress(ChainId.MAINNET, displayName)
                ? getShortenAddress(displayName)
                : shortString(displayName, 22)
              : displayName}
          </Text>
        </Row>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text color={theme.subText}>
          {formatDisplayNumber(data.totalUsd, { style: 'currency', fractionDigits: 2 })}
        </Text>
      </td>
    </DropdownItem>
  )
}

export default function Search() {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useLocalStorage<Array<PortfolioSearchData>>('portfolios-history', [])
  const searchDebounced = useDebounce(search, 500)

  const saveToHistory = useCallback(
    (data: PortfolioSearchData) => {
      const list = history || []
      if (!list.some(t => getPortfolioId(t) === getPortfolioId(data))) {
        setHistory([data, ...list].slice(0, 3))
      }
    },
    [history, setHistory],
  )

  const { data: favorites = EMPTY_ARRAY, isLoading: isLoadingFavorite } = useGetFavoritesPortfoliosQuery(undefined, {
    skip: !expanded,
  })
  const { data: trending = EMPTY_ARRAY, isFetching: isLoadingTrending } = useGetTrendingPortfoliosQuery(undefined, {
    skip: !expanded,
  })

  const { data = EMPTY_ARRAY, isFetching: isLoadingSearch } = useSearchPortfolioQuery(
    { value: searchDebounced },
    {
      skip: !searchDebounced,
    },
  )

  const searchData = searchDebounced ? data : EMPTY_ARRAY

  const isSearching = useShowLoadingAtLeastTime(isLoadingSearch || isLoadingFavorite || isLoadingTrending, 500)

  const onSelect = useCallback(
    (data: PortfolioSearchData) => {
      setExpanded(false)
      setTimeout(() => {
        saveToHistory(data)
      }, 300)
    },
    [saveToHistory],
  )

  const getItemsSearch = useCallback(
    (arr: PortfolioSearchData[] | undefined) =>
      arr?.map(e => <PortfolioItem favorites={favorites} key={getPortfolioId(e)} onSelect={onSelect} data={e} />) ||
      EMPTY_ARRAY,
    [favorites, onSelect],
  )

  const sections: SearchSection[] = useMemo(() => {
    return searchData?.length
      ? [
          {
            items: getItemsSearch(searchData),
            title: (
              <RowFit>
                <Text fontSize="12px">Search Result</Text>
              </RowFit>
            ),
          },
        ]
      : [
          {
            title: (
              <RowFit color={theme.subText} gap="6px">
                <History />
                <Text fontSize="12px" fontWeight={'500'}>
                  Search History
                </Text>
              </RowFit>
            ),
            items: getItemsSearch(history),
            show: !!history?.length,
          },
          {
            title: (
              <RowFit color={theme.subText} gap="6px">
                <Star size={17} fill={theme.subText} />
                <Text fontSize="12px" fontWeight={'500'}>
                  Favorites
                </Text>
              </RowFit>
            ),
            items: getItemsSearch(favorites),
            loading: isLoadingFavorite,
            show: !!favorites.length && !isLoadingFavorite,
          },
          {
            title: (
              <RowFit color={theme.subText} gap="6px">
                <Icon id="flame" size={16} />
                <Text fontSize="12px" fontWeight={'500'}>
                  Trending
                </Text>
              </RowFit>
            ),
            items: getItemsSearch(trending),
            loading: isLoadingTrending,
            show: !!trending.length && !isLoadingTrending,
          },
        ]
  }, [theme, trending, favorites, history, isLoadingFavorite, isLoadingTrending, searchData, getItemsSearch])

  return (
    <SearchWithDropdown
      searching={isSearching}
      noResultText={
        <Trans>
          Oops, we couldnt find your address or portfolio!
          <br />
          You can try searching for another address or portfolio
        </Trans>
      }
      expanded={expanded}
      setExpanded={setExpanded}
      placeholder={t`Enter wallet address or portfolio ID`}
      sections={sections}
      columns={columns}
      value={search}
      noSearchResult={!!(searchDebounced && !isSearching && !searchData?.length)}
      onChange={setSearch}
      style={{ maxWidth: upToSmall ? '100%' : undefined }}
      searchIcon={upToSmall ? <Icon id="search" /> : <ShortCut>{isMacOs ? 'Cmd+K' : 'Ctrl+K'}</ShortCut>}
    />
  )
}
