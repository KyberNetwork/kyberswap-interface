import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { HiddenH1, HiddenH2 } from 'components/Seo/HiddenSeoHeadings'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ContentWrapper, Disclaimer, NavigateButton } from 'pages/Earns/PoolExplorer/styles'
import { IconArrowLeft } from 'pages/Earns/PositionDetail/styles'
import Filter from 'pages/Earns/UserPositions/Filter'
import PositionBanner from 'pages/Earns/UserPositions/PositionBanner'
import TableContent, { FeeInfoFromRpc } from 'pages/Earns/UserPositions/TableContent'
import {
  PositionPageWrapper,
  PositionTableHeader,
  PositionTableHeaderFlexItem,
  PositionTableHeaderItem,
  PositionTableWrapper,
} from 'pages/Earns/UserPositions/styles'
import useFilter, { SortBy } from 'pages/Earns/UserPositions/useFilter'
import { default as MultiSelectDropdownMenu } from 'pages/Earns/components/DropdownMenu/MultiSelect'
import { ItemIcon } from 'pages/Earns/components/DropdownMenu/styles'
import RefetchIndicator from 'pages/Earns/components/RefetchIndicator'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useClosedPositions from 'pages/Earns/hooks/useClosedPositions'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useSupportedDexesAndChains, { AllChainsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { getUnfinalizedPositions } from 'pages/Earns/utils/unfinalizedPosition'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const UserPositions = () => {
  const navigate = useNavigate()
  const upToCustomLarge = useMedia(`(max-width: ${1300}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()
  const { filters, updateFilters } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfoFromRpc[]>([])

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()

  const positionQueryParams = useMemo(() => {
    return {
      wallet: account || '',
      chainIds: filters.chainIds,
      protocols: filters.protocols,
      statuses: filters.statuses,
      keyword: filters.keyword,
      positionIds: filters.positionId,
      sorts: [filters.sortBy, filters.orderBy].filter(Boolean).join(':'),
      page: filters.page,
      pageSize: filters.pageSize,
    }
  }, [account, filters])

  const {
    data: userPositionsData,
    isFetching,
    isError,
    refetch,
  } = useUserPositionsQuery(positionQueryParams, {
    skip: !account,
    pollingInterval: 15_000,
  })

  const positionsStats = userPositionsData?.stats

  const {
    widget: zapMigrationWidget,
    handleOpenZapMigration,
    triggerClose,
    setTriggerClose,
  } = useZapMigrationWidget(refetch)
  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration: handleOpenZapMigration,
    onRefreshPosition: refetch,
    triggerClose,
    setTriggerClose,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget(({ tokenId, dex, poolAddress, chainId }) => {
    refetch()
    checkClosedPosition({ tokenId, dex, poolAddress, chainId })
    setLoading(true)
  })

  const {
    rewardInfo,
    claimModal: claimRewardsModal,
    onOpenClaim: onOpenClaimRewards,
    pendingClaimKeys: pendingRewardClaimKeys,
    claimAllRewardsModal,
    onOpenClaimAllRewards,
    isLoadingRewardInfo,
  } = useKemRewards({ refetchAfterCollect: refetch })

  useAccountChanged(() => {
    refetch()
    setLoading(true)
  })

  const selectedChainsLabel = useMemo(() => {
    const arrValue = filters.chainIds?.split(',').filter(Boolean)
    const selectedChains = supportedChains.filter(option => arrValue?.includes(option.value))
    if (selectedChains.length >= 1) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {selectedChains.map((chain, index) => (
              <ItemIcon key={chain.value} src={chain.icon} alt={chain.label} style={{ marginLeft: index ? -8 : 0 }} />
            ))}
          </div>
          {selectedChains.length > 1 ? `Selected: ${selectedChains.length} chains` : selectedChains[0].label}
        </div>
      )
    }
    return AllChainsOption.label
  }, [supportedChains, filters.chainIds])

  const parsedPositions: Array<ParsedPosition> = useMemo(() => {
    return (userPositionsData?.positions || []).map(position => {
      const tokenId = position.tokenId.toString()
      const feeInfo = feeInfoFromRpc.find(feeInfo => feeInfo.id === tokenId)
      const nftRewardInfo = rewardInfo?.nfts.find(item => item.nftId === tokenId)
      const isClosedFromRpc = closedPositionsFromRpc.includes(tokenId)

      return parsePosition({
        position,
        feeInfo,
        nftRewardInfo,
        isClosedFromRpc,
      })
    })
  }, [feeInfoFromRpc, rewardInfo?.nfts, userPositionsData, closedPositionsFromRpc])

  const filteredPositions: Array<ParsedPosition> = useMemo(() => {
    let unfinalizedPositions: ParsedPosition[] = []
    const valueUpdatingTokenIds: Set<number> = new Set()

    if (filters.page && filters.page === 1) {
      const rawUnfinalizedPositions = getUnfinalizedPositions(parsedPositions, account || undefined)
      const filtered = rawUnfinalizedPositions.filter(
        position =>
          (filters.chainIds ? filters.chainIds.split(',').includes(position.chain.id.toString()) : true) &&
          (filters.protocols ? filters.protocols.split(',').includes(position.dex.id) : true) &&
          (filters.statuses.includes(PositionStatus.IN_RANGE) || filters.statuses.includes(PositionStatus.OUT_RANGE)),
      )

      // Separate truly new positions from increase-liquidity positions
      unfinalizedPositions = filtered.filter(p => !p.isValueUpdating)
      filtered.filter(p => p.isValueUpdating).forEach(p => valueUpdatingTokenIds.add(Number(p.tokenId)))
    }

    // Mark API positions that just had liquidity increased
    const mergedPositions = parsedPositions.map(p =>
      valueUpdatingTokenIds.has(Number(p.tokenId)) ? { ...p, isValueUpdating: true } : p,
    )

    return [...unfinalizedPositions, ...mergedPositions]
  }, [account, filters.chainIds, filters.page, filters.protocols, filters.statuses, parsedPositions])

  const onSortChange = useCallback(
    (sortBy: string) => {
      if (!filters.sortBy || filters.sortBy !== sortBy) {
        updateFilters('sortBy', sortBy)
        updateFilters('orderBy', Direction.DESC)
        return
      }
      if (filters.orderBy === Direction.DESC) {
        updateFilters('orderBy', Direction.ASC)
        return
      }
      updateFilters('sortBy', SortBy.VALUE)
      updateFilters('orderBy', Direction.DESC)
    },
    [filters.sortBy, filters.orderBy, updateFilters],
  )

  useEffect(() => {
    if (!isFetching) setLoading(false)
    else {
      if (!firstLoading.current) {
        setLoading(true)
        firstLoading.current = true
      }
    }
  }, [isFetching])

  useEffect(() => {
    if (filters.page && filters.page !== 1) updateFilters('page', 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  useEffect(() => {
    if (feeInfoFromRpc.length === 0) return

    const interval = setInterval(() => {
      setFeeInfoFromRpc(prev => {
        const updated = prev
          .filter(feeInfo => feeInfo.timeRemaining > 0)
          .map(feeInfo => ({
            ...feeInfo,
            timeRemaining: feeInfo.timeRemaining - 1,
          }))
        // Stop interval naturally when all items expire
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [feeInfoFromRpc.length])

  const updateFiltersWithLoading = useCallback(
    (...args: Parameters<typeof updateFilters>) => {
      updateFilters(...args)
      setLoading(true)
    },
    [updateFilters],
  )

  const actionsInfoHelper = (
    <InfoHelper
      text={
        <div className="flex flex-col gap-1">
          <p className="text-[14px]">
            <u className="text-primary">{t`Increase liquidity`}</u>:{' '}
            {t`Add more liquidity to this position using any token(s).`}
          </p>
          <p className="text-[14px]">
            <u className="text-primary">{t`Smart Exit`}</u>:{' '}
            {t`Automatically remove liquidity from this position when your pre-set rice, time, or fee yield condition(s).`}
          </p>
          <p className="text-[14px]">
            <u className="text-primary">{t`Claim fees`}</u>: {t`Claim your unclaimed fees from this position.`}
          </p>
          <p className="text-[14px]">
            <u className="text-primary">{t`Claim rewards`}</u>:{' '}
            {t`Claim your claimable farming rewards from a position.`}
          </p>
          <p className="text-[14px]">
            <u className="text-primary">{t`Remove liquidity`}</u>:{' '}
            {t`Remove liquidity from this position by zapping out to any token(s).`}
          </p>
        </div>
      }
      noArrow
      placement="top-end"
      width="280px"
      size={14}
      className="relative top-px h-3"
    />
  )

  const initialLoading = isFetching && loading

  return (
    <>
      {zapInWidget}
      {zapMigrationWidget}
      {zapOutWidget}
      {claimRewardsModal}
      {claimAllRewardsModal}

      <PositionPageWrapper>
        <HiddenH1>Track all your active liquidity positions in one dashboard.</HiddenH1>
        <HiddenH2>
          Monitor APR, rewards, and performance across protocols — no need to check each one separately.
        </HiddenH2>
        <div className="flex items-center gap-4">
          <IconArrowLeft onClick={() => navigate(-1)} />
          <p className="text-[24px] font-medium">{t`My Liquidity Positions`}</p>
        </div>

        <div className={cn('flex justify-between gap-2', upToSmall ? 'flex-col items-start' : 'flex-row items-center')}>
          <MultiSelectDropdownMenu
            highlightOnSelect
            label={selectedChainsLabel || t`Select chains`}
            options={supportedChains.length ? supportedChains : [AllChainsOption]}
            value={filters.chainIds || ''}
            onChange={value => value !== filters.chainIds && updateFilters('chainIds', value)}
          />

          <NavigateButton
            mobileFullWidth
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explore Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
        </div>

        {account && (
          <PositionBanner
            positionsStats={positionsStats}
            initialLoading={initialLoading}
            rewardInfo={rewardInfo}
            isLoadingRewardInfo={isLoadingRewardInfo}
            onOpenClaimAllRewards={onOpenClaimAllRewards}
          />
        )}

        <Filter
          supportedChains={supportedChains}
          supportedDexes={supportedDexes}
          filters={filters}
          updateFilters={updateFiltersWithLoading}
        />

        <PositionTableWrapper>
          <RefetchIndicator visible={isFetching && !loading} />
          <ContentWrapper>
            {!upToCustomLarge && filteredPositions && filteredPositions.length > 0 && (
              <PositionTableHeader>
                <PositionTableHeaderItem>{t`Position`}</PositionTableHeaderItem>

                <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.VALUE)}>
                  {t`Value`}
                  <SortIcon sorted={filters.sortBy === SortBy.VALUE ? (filters.orderBy as Direction) : undefined} />
                </PositionTableHeaderFlexItem>

                <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.APR)}>
                  {t`Est. APR`}
                  <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
                </PositionTableHeaderFlexItem>

                <PositionTableHeaderFlexItem
                  className="flex-col items-start"
                  role="button"
                  onClick={() => onSortChange(SortBy.UNCLAIMED_FEE)}
                >
                  <Trans>
                    <span>Unclaimed</span>
                    <div className="flex items-center gap-1">
                      <span>fees</span>
                      <SortIcon
                        sorted={filters.sortBy === SortBy.UNCLAIMED_FEE ? (filters.orderBy as Direction) : undefined}
                      />
                    </div>
                  </Trans>
                </PositionTableHeaderFlexItem>

                <div className="flex gap-1">
                  <FarmingIcon width={24} height={24} />
                  <PositionTableHeaderFlexItem className="flex-col">
                    <Trans>
                      <span>Unclaimed</span>
                      <span>rewards</span>
                    </Trans>
                  </PositionTableHeaderFlexItem>
                </div>

                {!upToCustomLarge && <div />}

                <PositionTableHeaderItem>{t`Balance`}</PositionTableHeaderItem>

                <PositionTableHeaderItem>{t`Price range`}</PositionTableHeaderItem>

                <div className="flex h-full items-center justify-end whitespace-nowrap">
                  {t`Actions`}
                  {actionsInfoHelper}
                </div>
              </PositionTableHeader>
            )}
            {isFetching && loading ? (
              <LocalLoader />
            ) : (
              <TableContent
                positions={filteredPositions}
                setFeeInfoFromRpc={setFeeInfoFromRpc}
                onOpenZapInWidget={handleOpenZapIn}
                onOpenZapOut={handleOpenZapOut}
                onOpenZapMigration={handleOpenZapMigration}
                kemRewards={{
                  onOpenClaim: onOpenClaimRewards,
                  pendingClaimKeys: pendingRewardClaimKeys,
                }}
              />
            )}
          </ContentWrapper>
          {!isError && (!isFetching || !loading) && positionsStats && (
            <Pagination
              onPageChange={(newPage: number) => updateFilters('page', newPage)}
              totalCount={positionsStats.totalItems || 0}
              currentPage={filters.page}
              pageSize={filters.pageSize || 10}
            />
          )}
        </PositionTableWrapper>

        <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
      </PositionPageWrapper>
    </>
  )
}

export default UserPositions
