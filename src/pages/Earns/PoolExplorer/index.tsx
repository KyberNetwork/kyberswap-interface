import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Info, Star } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { ReactComponent as IconHighAprPool } from 'assets/svg/ic_pool_high_apr.svg'
import { ReactComponent as IconHighlightedPool } from 'assets/svg/ic_pool_highlighted.svg'
import { ReactComponent as IconLowVolatility } from 'assets/svg/ic_pool_low_volatility.svg'
import { ReactComponent as IconSolidEarningPool } from 'assets/svg/ic_pool_solid_earning.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/ic_user_earn_position.svg'
import { NotificationType } from 'components/Announcement/type'
import Pagination from 'components/Pagination'
import Search from 'components/Search'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { BFF_API } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { IconArrowLeft } from '../PositionDetail/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import useSupportedDexesAndChains from '../useSupportedDexesAndChains'
import DropdownMenu, { MenuOption } from './DropdownMenu'
import TableContent from './TableContent'
import {
  ContentWrapper,
  Disclaimer,
  HeadSection,
  NavigateButton,
  PoolPageWrapper,
  TableHeader,
  TableWrapper,
  Tag,
  TagContainer,
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
    tooltip: 'Pools matching your wallet tokens or top 24h volume pools if no wallet is connected',
  },
  {
    label: 'High APR',
    value: FilterTag.HIGH_APR,
    icon: <IconHighAprPool width={20} color="#31CB9E" />,
    tooltip: 'Top 100 Pools with assets that offer exceptionally high APRs',
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
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, 300)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const notify = useNotify()
  const { filters, updateFilters } = useFilter(setSearch)
  const { liquidityWidget, handleOpenZapInWidget } = useLiquidityWidget()
  const { data: poolData, isError } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

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

  const handleFetchPoolData = async ({ chainId, address }: { chainId: number; address: string }) => {
    try {
      const response = await fetch(
        `${BFF_API}/v1/pools` +
          '?' +
          new URLSearchParams({
            chainId: chainId.toString(),
            ids: address,
          }).toString(),
      )
      const data = await response.json()
      return data?.data?.pools?.[0]
    } catch (error) {
      console.log('Fetch Pool Data Error:', error)
      return
    }
  }

  const handleOpenZapInWidgetWithParams = (pool: { exchange: string; chainId?: number; address: string }) => {
    const { exchange, chainId, address } = pool
    searchParams.set('exchange', exchange)
    searchParams.set('poolChainId', chainId ? chainId.toString() : filters.chainId.toString())
    searchParams.set('poolAddress', address)
    setSearchParams(searchParams)
    handleOpenZapInWidget(pool)
  }

  const handleRemoveUrlParams = useCallback(() => {
    searchParams.delete('exchange')
    searchParams.delete('poolChainId')
    searchParams.delete('poolAddress')
    setSearchParams(searchParams)
  }, [searchParams, setSearchParams])

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

  useEffect(() => {
    const exchange = searchParams.get('exchange')
    const chainId = searchParams.get('poolChainId')
    const address = searchParams.get('poolAddress')
    if (!exchange || !chainId || !address) {
      handleRemoveUrlParams()
      return
    }
    ;(async () => {
      const pool = await handleFetchPoolData({ chainId: Number(chainId), address })
      if (pool && pool.exchange === exchange)
        handleOpenZapInWidget({ exchange, chainId: Number(chainId), address: pool.address })
      else {
        notify(
          {
            title: `Open pool detail failed`,
            summary: `Invalid pool info`,
            type: NotificationType.ERROR,
          },
          5000,
        )
        handleRemoveUrlParams()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PoolPageWrapper>
      {liquidityWidget}

      <div>
        <Flex sx={{ gap: 3 }}>
          <IconArrowLeft onClick={() => navigate(-1)} />
          <Text as="h1" fontSize={24} fontWeight="500">
            {t`Earning with Smart Liquidity Providing`}
          </Text>
        </Flex>
        <Text color={theme.subText} marginTop="8px" fontStyle={'italic'}>
          {t`KyberSwap Zap: Instantly add liquidity to high-APY pools using any token(s) or your existing liquidity position with KyberZap`}
        </Text>
      </div>
      <HeadSection>
        <TagContainer>
          <Tag active={!filters.tag} role="button" onClick={() => updateFilters('tag', '')}>
            {t`All pools`}
          </Tag>
          <MouseoverTooltip text="List of pools added as favorite" placement="top" width="fit-content">
            <Tag active={filters.tag === 'favorite'} role="button" onClick={() => updateFilters('tag', 'favorite')}>
              <Star size={16} />
            </Tag>
          </MouseoverTooltip>
          {filterTags.map((item, index) =>
            !upToMedium ? (
              <MouseoverTooltip text={item.tooltip} placement="top" key={index}>
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
          <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
        )}
      </HeadSection>
      <Flex justifyContent="space-between" flexDirection={upToMedium ? 'column' : 'row'} sx={{ gap: '1rem' }}>
        <Flex sx={{ gap: '1rem' }} flexWrap="wrap">
          <DropdownMenu
            options={supportedChains}
            value={filters.chainId.toString()}
            alignLeft
            onChange={onChainChange}
          />
          <DropdownMenu
            width={100}
            options={supportedDexes}
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

      {upToLarge && (
        <NavigateButton icon={<IconUserEarnPosition />} text={t`My Positions`} to={APP_PATHS.EARN_POSITIONS} />
      )}

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
                <MouseoverTooltipDesktopOnly
                  text={t`Only pools with a Total Value Locked of $10,000 or more are displayed on this page`}
                  placement="top"
                >
                  <Text marginRight={1} marginLeft={1} sx={{ position: 'relative', top: '2.5px' }}>
                    <Info color={theme.subText} size={16} />
                  </Text>
                </MouseoverTooltipDesktopOnly>
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
          <TableContent onOpenZapInWidget={handleOpenZapInWidgetWithParams} />
        </ContentWrapper>
        {!isError && (
          <Pagination
            onPageChange={(newPage: number) => updateFilters('page', newPage.toString())}
            totalCount={poolData?.data?.pagination?.totalItems || 0}
            currentPage={filters.page || 1}
            pageSize={filters.limit || 10}
          />
        )}
      </TableWrapper>

      <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
    </PoolPageWrapper>
  )
}

export default Earn
