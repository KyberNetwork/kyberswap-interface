import { t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { usePoolsExplorerQuery } from 'services/zapEarn'

import { ReactComponent as IconUserEarnPosition } from 'assets/svg/earn/ic_user_earn_position.svg'
import { NotificationType } from 'components/Announcement/type'
import Pagination from 'components/Pagination'
import { HiddenH1, HiddenH2 } from 'components/Seo/HiddenSeoHeadings'
import { HStack, Stack } from 'components/Stack'
import CreatePoolModal from 'components/ZapCreatePool/CreatePoolModal'
import { BFF_API } from 'constants/env'
import { APP_PATHS } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import Filter from 'pages/Earns/PoolExplorer/Filter'
import TableContent, { dexKeyMapping } from 'pages/Earns/PoolExplorer/TableContent'
import TableHeader from 'pages/Earns/PoolExplorer/TableHeader'
import {
  BackButton,
  ContentWrapper,
  Disclaimer,
  NavigateButton,
  PoolPageWrapper,
  PoolTableWrapper,
} from 'pages/Earns/PoolExplorer/styles'
import useFilter from 'pages/Earns/PoolExplorer/useFilter'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import { Exchange } from 'pages/Earns/constants'
import useSmartExitWidget from 'pages/Earns/hooks/useSmartExitWidget'
import useZapCreatePoolWidget from 'pages/Earns/hooks/useZapCreatePoolWidget'
import useZapInWidget, { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { getPoolDetailUrl } from 'pages/Earns/utils/url'
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
  const notify = useNotify()
  const { trackingHandler } = useTracking()
  const { filters, updateFilters } = useFilter(setSearch)
  const { widget: zapMigrationWidget, handleOpenZapMigration, triggerClose, setTriggerClose } = useZapMigrationWidget()
  const { onOpenSmartExit, smartExitWidget } = useSmartExitWidget()
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
    onOpenSmartExit,
  })
  const { widget: zapCreatePoolWidget, open: openZapCreatePoolWidget } = useZapCreatePoolWidget()
  const { data: poolData, isError, isFetching } = usePoolsExplorerQuery(filters, { pollingInterval: POLLING_INTERVAL })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const pendingSearchRef = useRef('')

  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const showRewards = useMemo(() => {
    const pools = poolData?.data?.pools || []
    if (!pools.length) return true

    return pools.some(pool => {
      if (pool.egUsd || pool.merklOpportunity?.rewardsRecord?.total) return true
      if (pool.kemReward?.rewardCfg) return true
      return false
    })
  }, [poolData?.data?.pools])

  const showPoolPrice = useMemo(() => {
    const pools = poolData?.data?.pools || []
    if (!pools.length) return true

    return pools.some(pool => pool.sparkline?.some(value => Number.isFinite(value) && value !== 0))
  }, [poolData?.data?.pools])

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

  const handleNavigateToAddLiquidity = useCallback(
    ({ pool, initialTick }: ZapInInfo) => {
      const pathname = getPoolDetailUrl(pool.chainId, pool.dex, pool.address)
      // tickLower/tickUpper stay as optional query params on the new path (currently unread by the
      // detail page, but preserved so a future zap-migration reader can still pick them up).
      const params = new URLSearchParams()
      if (initialTick?.tickLower !== undefined) params.set('tickLower', initialTick.tickLower.toString())
      if (initialTick?.tickUpper !== undefined) params.set('tickUpper', initialTick.tickUpper.toString())
      const search = params.toString()

      navigate(search ? { pathname, search: `?${search}` } : pathname)
    },
    [navigate],
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
      if (deboundedSearch) {
        pendingSearchRef.current = deboundedSearch
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deboundedSearch, filters.q, updateFilters])

  useEffect(() => {
    if (pendingSearchRef.current && poolData) {
      trackingHandler(TRACKING_EVENT_TYPE.POOL_SEARCHED, {
        search_query: pendingSearchRef.current,
        results_count: poolData?.data?.pagination?.totalItems || 0,
        active_category: filters.tag || 'all_pools',
        active_filters: {
          chain: filters.chainIds,
          protocol: filters.protocol || 'all',
          time_period: filters.interval,
        },
      })
      pendingSearchRef.current = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolData])

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
            summary: t`Invalid pool info`,
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
      {zapCreatePoolWidget}
      {smartExitWidget}

      <HiddenH1>Explore and compare yield opportunities across top DeFi protocols on multiple chains.</HiddenH1>
      <HiddenH2>
        Trading volume, TVL, and pool performance across networks - all from one interface without switching apps.
      </HiddenH2>
      <Stack className="gap-2">
        <HStack className="items-center gap-4">
          <BackButton aria-label="Go back" onClick={() => navigate(-1)} type="button">
            <IconArrowLeft />
          </BackButton>
          <span className="text-2xl font-medium">{t`Earning with Smart Liquidity Providing`}</span>
        </HStack>
        <span className="italic text-subText">
          {t`KyberSwap Zap: Instantly and easily add liquidity to high-APY pools using any token or a combination of tokens.`}
        </span>
      </Stack>

      <Filter
        filters={filters}
        updateFilters={updateFilters}
        search={search}
        setSearch={setSearch}
        onOpenCreatePool={() => setIsCreateModalOpen(true)}
        totalItems={poolData?.data?.pagination?.totalItems}
        isFetching={isFetching}
      />

      {upToLarge && (
        <NavigateButton
          mobileFullWidth
          icon={<IconUserEarnPosition />}
          text={t`My Positions`}
          to={APP_PATHS.EARN_POSITIONS}
        />
      )}

      <PoolTableWrapper>
        <ContentWrapper>
          <TableHeader
            onSortChange={onSortChange}
            filters={filters}
            showRewards={showRewards}
            showPoolPrice={showPoolPrice}
          />
          <TableContent
            onOpenZapInWidget={handleNavigateToAddLiquidity}
            filters={filters}
            showRewards={showRewards}
            showPoolPrice={showPoolPrice}
          />
        </ContentWrapper>
        {!isError && (
          <Pagination
            onPageChange={(newPage: number) => updateFilters('page', newPage.toString())}
            totalCount={poolData?.data?.pagination?.totalItems || 0}
            currentPage={filters.page || 1}
            pageSize={filters.limit || 10}
          />
        )}
      </PoolTableWrapper>

      <CreatePoolModal
        isOpen={isCreateModalOpen}
        onDismiss={() => setIsCreateModalOpen(false)}
        onSubmit={openZapCreatePoolWidget}
      />

      <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
    </PoolPageWrapper>
  )
}

export default PoolExplorer
