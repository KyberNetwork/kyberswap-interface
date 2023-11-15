import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { isMacOs } from 'react-device-detect'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import {
  useGetFavoritesPortfoliosQuery,
  useGetTrendingPortfoliosQuery,
  useSearchPortfolioQuery,
  useToggleFavoritePortfolioMutation,
} from 'services/portfolio'
import styled from 'styled-components'

import { ReactComponent as PortfolioIcon } from 'assets/svg/portfolio.svg'
import Avatar from 'components/Avatar'
import { ButtonOutlined } from 'components/Button'
import History from 'components/Icons/History'
import Icon from 'components/Icons/Icon'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import { useNavigateToPortfolioDetail } from 'pages/NotificationCenter/Portfolio/helpers'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { SearchSection, SearchWithDropdown } from 'pages/TrueSightV2/components/SearchWithDropDown'
import { StarWithAnimation } from 'pages/TrueSightV2/components/WatchlistStar'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

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
const PortfolioItem = ({
  onSelect,
  data,
  favorites,
}: {
  onSelect: () => void
  data: Portfolio | string
  favorites: string[]
}) => {
  const theme = useTheme()
  const navigate = useNavigateToPortfolioDetail()
  const portfolio = data as Portfolio
  const displayName = typeof data === 'string' ? data : portfolio.name
  const id = typeof data === 'string' ? data : portfolio.id
  const [toggleFavorite, { isLoading }] = useToggleFavoritePortfolioMutation()
  const isFavorite = favorites.includes(id)

  const onToggleFavorite = async () => {
    try {
      if (isLoading) return
      await toggleFavorite({ value: id, isAdd: !isFavorite }).unwrap()
    } catch (error) {}
  }

  return (
    <DropdownItem
      onClick={() => {
        navigate({ portfolioId: id, myPortfolio: false })
        onSelect()
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

export default function Header() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const history = false
  const { data: favorites = EMPTY_ARRAY, isLoading: isLoadingFavorite } = useGetFavoritesPortfoliosQuery(undefined, {
    skip: !expanded,
  })
  const { data: trending = EMPTY_ARRAY, isFetching: isLoadingTrending } = useGetTrendingPortfoliosQuery(undefined, {
    skip: !expanded,
  })

  const searchDebounced = useDebounce(search, 500)
  const { data: searchData = EMPTY_ARRAY, isFetching: isLoadingSearch } = useSearchPortfolioQuery(
    { name: searchDebounced },
    {
      skip: !searchDebounced,
    },
  )
  const isSearching = useShowLoadingAtLeastTime(isLoadingSearch, 500)

  const itemTrending = trending.map(e => (
    <PortfolioItem favorites={favorites} key={e} onSelect={() => setExpanded(false)} data={e} />
  ))
  const itemSearch = searchData.map(e => (
    <PortfolioItem favorites={favorites} key={e} onSelect={() => setExpanded(false)} data={e} />
  ))
  const itemFavorite = favorites.map(e => (
    <PortfolioItem favorites={favorites} key={e} onSelect={() => setExpanded(false)} data={e} />
  ))

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
    : history
    ? [
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Search History</Text>
            </RowFit>
          ),
          items: [],
          show: !!history,
        },
      ]
    : [
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Favorites</Text>
            </RowFit>
          ),
          items: itemFavorite,
          loading: isLoadingFavorite,
          show: !!favorites.length && !isLoadingFavorite,
        },
        {
          title: (
            <RowFit color={theme.subText} gap="10px">
              <History />
              <Text fontSize="12px">Trending</Text>
            </RowFit>
          ),
          items: itemTrending,
          loading: isLoadingTrending,
        },
      ]

  const { pathname } = useLocation()

  const renderSearch = () => (
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

  return (
    <>
      <RowBetween align="center">
        <Flex color={theme.text} fontSize={'24px'} fontWeight={'500'} alignItems={'center'} sx={{ gap: '4px' }}>
          <PortfolioIcon />
          {pathname.startsWith(APP_PATHS.MY_PORTFOLIO) ? <Trans>My Portfolio</Trans> : <Trans>Portfolio</Trans>}
        </Flex>
        <Row width={'fit-content'} gap="15px">
          {!upToSmall && renderSearch()}
          <ButtonOutlined
            height={'36px'}
            width={upToSmall ? '36px' : '116px'}
            style={{ background: theme.buttonGray, border: 'none', minWidth: '36px' }}
            onClick={() => navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PORTFOLIO}`)}
          >
            <TransactionSettingsIcon fill={theme.subText} style={{ height: '20px', minWidth: '20px' }} />
            {!upToSmall && (
              <>
                &nbsp;<Trans>Setting</Trans>
              </>
            )}
          </ButtonOutlined>
        </Row>
      </RowBetween>
      {upToSmall && renderSearch()}
    </>
  )
}
