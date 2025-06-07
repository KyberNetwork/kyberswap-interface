import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { Star } from 'react-feather'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { ReactComponent as IconHighAprPool } from 'assets/svg/earn/ic_pool_high_apr.svg'
import { ReactComponent as IconHighlightedPool } from 'assets/svg/earn/ic_pool_highlighted.svg'
import { ReactComponent as IconLowVolatility } from 'assets/svg/earn/ic_pool_low_volatility.svg'
import { ReactComponent as IconSolidEarningPool } from 'assets/svg/earn/ic_pool_solid_earning.svg'
import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { ReactComponent as IconFarmingPool } from 'assets/svg/kyber/kem.svg'
import { NotificationType } from 'components/Announcement/type'
import Pagination from 'components/Pagination'
import Search from 'components/Search'
import { MouseoverTooltip, MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { BFF_API } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import TableContent, { dexKeyMapping } from 'pages/Earns/PoolExplorer/TableContent'
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
} from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { Exchange } from 'pages/Earns/constants'
import useSupportedDexesAndChains from 'pages/Earns/hooks/useSupportedDexesAndChains'
import useZapInWidget, { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

export enum FilterTag {
  FARMING_POOL = 'farming_pool',
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
    label: 'Farming Pools',
    value: FilterTag.FARMING_POOL,
    icon: <IconFarmingPool width={24} />,
    tooltip: 'No staking is required to earn rewards in these pools',
  },
  {
    label: 'Highlighted Pools',
    value: FilterTag.HIGHLIGHTED_POOL,
    icon: <IconHighlightedPool width={20} color="#FF007A" />,
    tooltip: 'Pools matching your wallet tokens or top volume pools if no wallet is connected',
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

const PoolExplorer = () => {
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, 300)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const notify = useNotify()
  const { filters, updateFilters } = useFilter(setSearch)
  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
  })
  const { data: poolData, isError } = usePoolsExplorerQuery(filters, { pollingInterval: 5 * 60_000 })
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

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

  const handleOpenZapInWithParams = ({ pool }: ZapInInfo) => {
    const { dex, chainId, address } = pool
    searchParams.set('exchange', dex)
    searchParams.set('poolChainId', chainId.toString())
    searchParams.set('poolAddress', address)
    setSearchParams(searchParams)
    handleOpenZapIn({ pool })
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
    const dex = searchParams.get('exchange')
    const chainId = searchParams.get('poolChainId')
    const address = searchParams.get('poolAddress')
    if (!dex || !chainId || !address) {
      handleRemoveUrlParams()
      return
    }
    ;(async () => {
      const pool = await handleFetchPoolData({ chainId: Number(chainId), address })

      if (pool && (pool.exchange === dex || pool.exchange === dexKeyMapping[dex]))
        handleOpenZapIn({ pool: { dex: dex as Exchange, chainId: Number(chainId), address: pool.address } })
      else {
        notify(
          {
            title: t`Open pool detail failed`,
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
      {zapInWidget}
      {zapMigrationWidget}

      <div>
        <Flex alignItems="center" sx={{ gap: 3 }}>
          <IconArrowLeft onClick={() => navigate(-1)} />
          <Text as="h1" fontSize={24} fontWeight="500">
            {t`Earning with Smart Liquidity Providing`}
          </Text>
        </Flex>
        <Text color={theme.subText} marginTop="8px" fontStyle={'italic'}>
          {t`Kyberswap Zap: Instantly and easily add liquidity to high-APY pools using any token or a combination of tokens.`}
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
              <MouseoverTooltipDesktopOnly text={item.tooltip} placement="top" key={index}>
                <Tag
                  active={filters.tag === item.value}
                  key={item.value}
                  role="button"
                  onClick={() => updateFilters('tag', item.value)}
                >
                  {item.icon}
                  {item.label}
                </Tag>
              </MouseoverTooltipDesktopOnly>
            ) : (
              <Tag
                active={filters.tag === item.value}
                key={item.value}
                role="button"
                onClick={() => updateFilters('tag', item.value)}
              >
                {item.icon}
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
        <NavigateButton
          mobileFullWidth
          icon={<IconUserEarnPosition />}
          text={t`My Positions`}
          to={APP_PATHS.EARN_POSITIONS}
        />
      )}

      <TableWrapper>
        <ContentWrapper>
          {!upToMedium && (
            <TableHeader>
              <Text>Protocol</Text>
              <Text>Pair</Text>
              <Flex
                justifyContent="flex-start"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.APR)}
              >
                {t`APR`}
                <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.EARN_FEE)}
              >
                {t`Earn Fees`}
                <SortIcon sorted={filters.sortBy === SortBy.EARN_FEE ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.TVL)}
              >
                {t`TVL`}
                <SortIcon sorted={filters.sortBy === SortBy.TVL ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <Flex
                justifyContent="flex-end"
                sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                role="button"
                onClick={() => onSortChange(SortBy.VOLUME)}
              >
                {t`Volume`}
                <SortIcon sorted={filters.sortBy === SortBy.VOLUME ? (filters.orderBy as Direction) : undefined} />
              </Flex>
              <div />
            </TableHeader>
          )}
          <TableContent onOpenZapInWidget={handleOpenZapInWithParams} />
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

export default PoolExplorer
