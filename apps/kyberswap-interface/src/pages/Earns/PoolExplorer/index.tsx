import { t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { NotificationType } from 'components/Announcement/type'
import Pagination from 'components/Pagination'
import { BFF_API } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import Filter from 'pages/Earns/PoolExplorer/Filter'
import TableContent, { dexKeyMapping } from 'pages/Earns/PoolExplorer/TableContent'
import TableHeader from 'pages/Earns/PoolExplorer/TableHeader'
import {
  ContentWrapper,
  Disclaimer,
  NavigateButton,
  PoolPageWrapper,
  TableWrapper,
} from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { Exchange } from 'pages/Earns/constants'
import useZapInWidget, { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { Direction } from 'pages/MarketOverview/SortIcon'
import { useNotify } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'

export enum SortBy {
  APR = 'apr',
  EARN_FEE = 'earn_fee',
  TVL = 'tvl',
  VOLUME = 'volume',
}

const POLLING_INTERVAL = 5 * 60_000
const DEBOUNCE_DELAY = 300

const PoolExplorer = () => {
  const [search, setSearch] = useState('')
  const deboundedSearch = useDebounce(search, DEBOUNCE_DELAY)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const notify = useNotify()
  const { filters, updateFilters } = useFilter(setSearch)
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
  })
  const { data: poolData, isError } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL })

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

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

  const handleOpenZapInWithParams = useCallback(
    ({ pool }: ZapInInfo) => {
      const { dex, chainId, address } = pool
      searchParams.set('exchange', dex)
      searchParams.set('poolChainId', chainId.toString())
      searchParams.set('poolAddress', address)
      setSearchParams(searchParams)
      handleOpenZapIn({ pool })
    },
    [handleOpenZapIn, searchParams, setSearchParams],
  )

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
      const shouldUpdateSort = !filters.q && deboundedSearch.length > 0
      const shouldResetSort = filters.q && !deboundedSearch
      updateFilters('q', deboundedSearch || '')
      if (shouldUpdateSort) {
        updateFilters('sortBy', SortBy.VOLUME)
        updateFilters('orderBy', Direction.DESC)
      }
      if (shouldResetSort) {
        updateFilters('sortBy', '')
        updateFilters('orderBy', '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <Filter filters={filters} updateFilters={updateFilters} search={search} setSearch={setSearch} />

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
          <TableHeader onSortChange={onSortChange} filters={filters} />
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
