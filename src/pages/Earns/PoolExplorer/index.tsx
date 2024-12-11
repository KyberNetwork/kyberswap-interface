import { t } from '@lingui/macro'
import 'kyberswap-liquidity-widgets/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { Star } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetDexListQuery } from 'services/ksSetting'
import { usePoolsExplorerQuery, useSupportedProtocolsQuery } from 'services/zapEarn'

import { ReactComponent as IconHighAprPool } from 'assets/svg/ic_pool_high_apr.svg'
import { ReactComponent as IconHighlightedPool } from 'assets/svg/ic_pool_highlighted.svg'
import { ReactComponent as IconLowVolatility } from 'assets/svg/ic_pool_low_volatility.svg'
import { ReactComponent as IconSolidEarningPool } from 'assets/svg/ic_pool_solid_earning.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/ic_user_earn_position.svg'
import Pagination from 'components/Pagination'
import Search from 'components/Search'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

import useLiquidityWidget from '../useLiquidityWidget'
import DropdownMenu, { MenuOption } from './DropdownMenu'
import TableContent from './TableContent'
import {
  ContentWrapper,
  HeadSection,
  PoolPageWrapper,
  TableHeader,
  TableWrapper,
  Tag,
  TagContainer,
  UserPositionButton,
} from './styles'
import useFilter from './useFilter'

export enum FilterTag {
  HIGHLIGHTED_POOL = 'highlighted_pool',
  HIGH_APR = 'high_apr',
  SOLID_EARNING = 'solid_earning',
  LOW_VOLATILITY = 'low_volatility',
}

export enum SortBy {
  APR = 'apr',
  EARN_FEE = 'earn_fee',
  TVL = 'tvl',
  VOLUME = 'volume',
}

const filterTags = [
  {
    label: 'Highlighted Pools',
    value: FilterTag.HIGHLIGHTED_POOL,
    icon: <IconHighlightedPool width={20} color="#FF007A" />,
    tooltip: '',
  },
  {
    label: 'High APR',
    value: FilterTag.HIGH_APR,
    icon: <IconHighAprPool width={20} color="#31CB9E" />,
    tooltip: 'Top 100 Pools with assets that offer exceptionally high APYs',
  },
  {
    label: 'Solid Earning',
    value: FilterTag.SOLID_EARNING,
    icon: <IconSolidEarningPool width={20} color="#FBB324" />,
    tooltip: 'Top 100 pools that have the high total earned fee in the last 7 days',
  },
  {
    label: 'Low Volatility',
    value: FilterTag.LOW_VOLATILITY,
    icon: <IconLowVolatility width={20} color="#2C9CE4" />,
    tooltip: 'Top 100 highest TVL Pools consisting of stable coins or correlated pairs',
  },
]

export const timings: MenuOption[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
]

const Earn = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, 300)
  const [searchParams] = useSearchParams()
  const theme = useTheme()
  const { supportedChains } = useChainsConfig()
  const { filters, updateFilters } = useFilter(setSearch)
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()

  const dexList = useGetDexListQuery({
    chainId: NETWORKS_INFO[filters.chainId].ksSettingRoute,
  })
  const { data: supportedProtocolsData } = useSupportedProtocolsQuery()
  const { data: poolData } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })

  const supportedProtocols = useMemo(() => {
    if (!supportedProtocolsData?.data?.chains) return []
    const parsedProtocols =
      supportedProtocolsData.data.chains[filters.chainId]?.protocols?.map(item => ({
        label: (dexList?.data?.find(dex => dex.dexId === item.id)?.name || item.name).replaceAll('-', ' '),
        value: item.id,
      })) || []
    return [{ label: 'All Protocols', value: '' }].concat(parsedProtocols)
  }, [filters.chainId, supportedProtocolsData, dexList])

  const chains = useMemo(
    () =>
      supportedChains
        .map(chain => ({
          label: chain.name,
          value: chain.chainId,
          icon: chain.icon,
        }))
        .filter(chain => supportedProtocolsData?.data?.chains?.[chain.value]),
    [supportedChains, supportedProtocolsData],
  )

  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const onChainChange = (newChainId: string | number) => {
    updateFilters('chainId', newChainId.toString())
  }
  const onProtocolChange = (newProtocol: string | number) => {
    updateFilters('protocol', newProtocol.toString())
  }
  const onIntervalChange = (newInterval: string | number) => {
    updateFilters('interval', newInterval.toString())
  }
  const onSortChange = (sortBy: string) => {
    if (!filters.sortBy || filters.sortBy !== sortBy) {
      updateFilters('sortBy', sortBy)
      updateFilters('orderBy', Direction.DESC)
      return
    }
    if (filters.orderBy === Direction.DESC) {
      updateFilters('orderBy', Direction.ASC)
      return
    }
    updateFilters('sortBy', '')
    updateFilters('orderBy', '')
  }

  useEffect(() => {
    if (searchParams.get('q') && !search) {
      setSearch(searchParams.get('q') || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (filters.q !== deboundedSearch) {
      updateFilters('q', deboundedSearch || '')
    }
  }, [deboundedSearch, filters.q, updateFilters])

  return (
    <PoolPageWrapper>
      {liquidityWidget}

      <div>
        <Text as="h1" fontSize={24} fontWeight="500">
          {t`Earning with Smart Liquidity Providing`}
        </Text>
        <Text color={theme.subText} marginTop="8px" fontStyle={'italic'}>
          {t`KyberSwap Zap: Instantly and easily add liquidity to high-APY pools using any token or a combination of tokens.`}
        </Text>
      </div>
      <HeadSection>
        <TagContainer>
          <Tag active={!filters.tag} role="button" onClick={() => updateFilters('tag', '')}>
            {t`All pools`}
          </Tag>
          <MouseoverTooltip text="List of pools added as favorite" placement="bottom" width="fit-content">
            <Tag active={filters.tag === 'favorite'} role="button" onClick={() => updateFilters('tag', 'favorite')}>
              <Star size={16} />
            </Tag>
          </MouseoverTooltip>
          {filterTags.map((item, index) =>
            !upToMedium ? (
              <MouseoverTooltip text={item.tooltip} placement="bottom" key={index}>
                <Tag
                  active={filters.tag === item.value}
                  key={item.value}
                  role="button"
                  onClick={() => updateFilters('tag', item.value)}
                >
                  {!upToExtraSmall && item.icon}
                  {item.label}
                </Tag>
              </MouseoverTooltip>
            ) : (
              <Tag
                active={filters.tag === item.value}
                key={item.value}
                role="button"
                onClick={() => updateFilters('tag', item.value)}
              >
                {!upToExtraSmall && item.icon}
                {item.label}
              </Tag>
            ),
          )}
        </TagContainer>
        {!upToLarge && (
          <UserPositionButton onClick={() => navigate({ pathname: APP_PATHS.EARN_POSITIONS })}>
            <IconUserEarnPosition />
            <Text width={'max-content'}>{t`My Positions`}</Text>
          </UserPositionButton>
        )}
      </HeadSection>
      <Flex justifyContent="space-between" flexDirection={upToMedium ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Flex sx={{ gap: '1rem' }} flexWrap="wrap">
          <DropdownMenu options={chains} value={filters.chainId} alignLeft onChange={onChainChange} />
          <DropdownMenu
            width={100}
            options={supportedProtocols}
            value={filters.protocol}
            alignLeft
            onChange={onProtocolChange}
          />
          <DropdownMenu width={30} options={timings} value={filters.interval} onChange={onIntervalChange} />
        </Flex>
        <Search
          placeholder="Search by token symbol or address"
          searchValue={search}
          allowClear
          onSearch={val => setSearch(val)}
          style={{ height: '36px' }}
        />
      </Flex>
      <TableWrapper>
        <ContentWrapper>
          {!upToMedium && (
            <TableHeader>
              <Text>Protocol</Text>
              <Text>Pair</Text>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.APR)}
              >
                APR
                <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.EARN_FEE)}
              >
                Earn Fees
                <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.TVL)}
              >
                TVL
                <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.VOLUME)}
              >
                Volume
                <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <div />
            </TableHeader>
          )}
          <TableContent onOpenZapInWidget={handleOpenZapInWidget} />
        </ContentWrapper>
        <Pagination
          onPageChange={(newPage: number) => updateFilters('page', newPage.toString())}
          totalCount={poolData?.data?.pagination?.totalItems || 0}
          currentPage={filters.page || 1}
          pageSize={filters.limit || 10}
        />
      </TableWrapper>

      <Text
        fontSize={14}
        color={'#737373'}
        textAlign={'center'}
        fontStyle={'italic'}
      >{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Text>
    </PoolPageWrapper>
  )
}

export default Earn
