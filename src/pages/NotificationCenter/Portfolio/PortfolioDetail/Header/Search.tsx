import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { isMacOs } from 'react-device-detect'
import { Star } from 'react-feather'
import { useLocalStorage, useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  useGetFavoritesPortfoliosQuery,
  useGetPortfolioByIdQuery,
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
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useNavigateToPortfolioDetail } from 'pages/NotificationCenter/Portfolio/helpers'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'
import { SearchSection, SearchWithDropdown } from 'pages/TrueSightV2/components/SearchWithDropDown'
import { StarWithAnimation } from 'pages/TrueSightV2/components/WatchlistStar'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'
import { isULIDString } from 'utils/string'

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

const getPortfolioId = (data: Portfolio | string) => (typeof data === 'string' ? data : data.id)

const PortfolioItem = ({
  onSelect,
  data,
  favorites,
}: {
  onSelect: (v: Portfolio | string) => void
  data: Portfolio | string
  favorites: string[]
}) => {
  const theme = useTheme()
  const navigate = useNavigateToPortfolioDetail()
  const portfolio = data as Portfolio
  const displayName = typeof data === 'string' ? data : portfolio.name
  const id = getPortfolioId(data)
  const [toggleFavorite, { isLoading }] = useToggleFavoritePortfolioMutation()
  const isFavorite = favorites.includes(id)

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
        navigate({ portfolioId: id, myPortfolio: false })
        onSelect(data)
      }}
    >
      <td>
        <Row alignItems="center" gap="6px">
          <StarWithAnimation size={18} active={isFavorite} onClick={onToggleFavorite} stopPropagation />
          <Avatar url="" color={theme.subText} size={16} />
          <Text color={theme.subText}>{displayName}</Text>
        </Row>
      </td>
      <td style={{ textAlign: 'right' }}>
        <Text color={theme.subText}>{formatDisplayNumber(1234567.23, { style: 'decimal', fractionDigits: 2 })}</Text>
      </td>
    </DropdownItem>
  )
}

export default function Search() {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useLocalStorage<Array<Portfolio | string>>('portfolio-history', [])
  const searchDebounced = useDebounce(search, 500)

  const isSearchByAddress = !!isAddress(ChainId.MAINNET, searchDebounced)
  const isSearchById = searchDebounced && isULIDString(searchDebounced)
  const isSearchByName = searchDebounced && !isSearchByAddress && !isSearchById

  const saveToHistory = (data: Portfolio | string) => {
    const list = history || []
    if (!list.some(t => getPortfolioId(t) === getPortfolioId(data))) {
      setHistory([data, ...list].slice(0, 3))
    }
  }
  const { data: favorites = EMPTY_ARRAY, isLoading: isLoadingFavorite } = useGetFavoritesPortfoliosQuery(undefined, {
    skip: !expanded,
  })
  const { data: trending = EMPTY_ARRAY, isFetching: isLoadingTrending } = useGetTrendingPortfoliosQuery(undefined, {
    skip: !expanded,
  })

  const { data: searchDataByName = EMPTY_ARRAY, isFetching: isLoadingSearch } = useSearchPortfolioQuery(
    { name: searchDebounced },
    {
      skip: !isSearchByName,
    },
  )
  const { data: searchDataById, isFetching: isLoadingSearchById } = useGetPortfolioByIdQuery(
    { id: searchDebounced },
    {
      skip: !isSearchById,
    },
  )

  const searchData = useMemo(() => {
    return (
      (isSearchByAddress ? [searchDebounced] : isSearchById && searchDataById ? [searchDataById] : searchDataByName) ||
      EMPTY_ARRAY
    )
  }, [searchDataByName, searchDataById, isSearchById, isSearchByAddress, searchDebounced])

  const isSearching = useShowLoadingAtLeastTime(isLoadingSearch || isLoadingSearchById, 500)

  const onSelect = (data: Portfolio | string) => {
    setExpanded(false)
    setTimeout(() => {
      saveToHistory(data)
    }, 300)
  }

  const itemTrending = trending.map(e => (
    <PortfolioItem favorites={favorites} key={getPortfolioId(e)} onSelect={onSelect} data={e} />
  ))
  const itemSearch = searchData.map(e => (
    <PortfolioItem favorites={favorites} key={getPortfolioId(e)} onSelect={onSelect} data={e} />
  ))
  const itemFavorite = favorites.map(e => (
    <PortfolioItem favorites={favorites} key={getPortfolioId(e)} onSelect={onSelect} data={e} />
  ))
  const itemHistory =
    history?.map(e => <PortfolioItem favorites={favorites} key={getPortfolioId(e)} onSelect={onSelect} data={e} />) ||
    EMPTY_ARRAY

  const sections: SearchSection[] = searchData?.length
    ? [
        {
          items: itemSearch,
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
          items: itemHistory,
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
          items: itemFavorite,
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
          items: itemTrending,
          loading: isLoadingTrending,
        },
      ]
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
