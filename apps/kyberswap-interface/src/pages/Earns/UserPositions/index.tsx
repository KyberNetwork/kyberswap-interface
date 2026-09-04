import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useUserPositionsQuery } from 'services/earn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import { default as MultiSelectDropdownMenu } from 'components/DropdownMenu/MultiSelect'
import { ItemIcon } from 'components/DropdownMenu/styles'
import InfoHelper from 'components/InfoHelper'
import {
  ListingPageDisclaimer,
  ListingPageNavigateButton,
  ListingPageTitle,
  ListingPageWrapper,
} from 'components/Listing/Page'
import Pagination from 'components/Pagination'
import RefetchIndicator from 'components/RefetchIndicator'
import PositionListSkeleton from 'components/RouteFallback/PositionListSkeleton'
import { HiddenH1, HiddenH2 } from 'components/Seo/components'
import { HStack } from 'components/Stack'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useIsWalletRestoring from 'hooks/useIsWalletRestoring'
import Filter from 'pages/Earns/UserPositions/Filter'
import PositionBanner from 'pages/Earns/UserPositions/PositionBanner'
import TableContent, { FeeInfoFromRpc } from 'pages/Earns/UserPositions/TableContent'
import { toPositionQueryParams } from 'pages/Earns/UserPositions/positionsQuery'
import {
  PositionTableHeader,
  PositionTableHeaderFlexItem,
  PositionTableHeaderItem,
  PositionTableWrapper,
} from 'pages/Earns/UserPositions/styles'
import useFilter, { SortBy } from 'pages/Earns/UserPositions/useFilter'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useClosedPositions from 'pages/Earns/hooks/useClosedPositions'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useSupportedDexesAndChains, { AllChainsOption } from 'pages/Earns/hooks/useSupportedDexesAndChains'
import useUnfinalizedPositions from 'pages/Earns/hooks/useUnfinalizedPositions'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import { getUnfinalizedPositionKeyFromPosition } from 'pages/Earns/utils/unfinalizedPosition'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'

const UserPositions = () => {
  const navigate = useNavigate()
  const upToCustomLarge = useMedia(`(max-width: ${1300}px)`)
  const { account } = useActiveWeb3React()
  const isRestoringWallet = useIsWalletRestoring()
  const { filters, updateFilters } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfoFromRpc[]>([])

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()

  const positionQueryParams = useMemo(() => {
    return toPositionQueryParams(filters, account)
  }, [account, filters])

  const {
    data: userPositionsResult,
    isUninitialized,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useUserPositionsQuery(positionQueryParams, {
    skip: !account,
    pollingInterval: 15_000,
  })

  // RTK Query holds on to the last result once a query is skipped, so disconnecting would otherwise leave
  // the previous wallet's rows, table header and pagination on screen beside an empty list.
  const userPositionsData = account ? userPositionsResult : undefined

  const positionsStats = userPositionsData?.stats
  const hasStartedPositionsRequest = !isUninitialized
  const isInitialLoading = isRestoringWallet || (!!account && (!hasStartedPositionsRequest || isLoading))

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

  const { placeholders, valueUpdatingKeys } = useUnfinalizedPositions({
    owner: account || undefined,
    positions: parsedPositions,
  })

  const filteredPositions: Array<ParsedPosition> = useMemo(() => {
    // Placeholders belong on the first page only; the later pages would duplicate rows the API returns.
    if (filters.page !== 1) return parsedPositions

    const chainIds = filters.chainIds ? filters.chainIds.split(',') : []
    const protocols = filters.protocols ? filters.protocols.split(',') : []
    const showsOpenPositions =
      filters.statuses.includes(PositionStatus.IN_RANGE) || filters.statuses.includes(PositionStatus.OUT_RANGE)

    const visiblePlaceholders = showsOpenPositions
      ? placeholders.filter(
          position =>
            (!chainIds.length || chainIds.includes(position.chain.id.toString())) &&
            (!protocols.length || protocols.includes(position.dex.id)),
        )
      : []

    if (!visiblePlaceholders.length && !valueUpdatingKeys.size) return parsedPositions

    // A zap into an existing position already has a row: flag its value instead of prepending a placeholder.
    return [
      ...visiblePlaceholders,
      ...parsedPositions.map(position =>
        valueUpdatingKeys.has(getUnfinalizedPositionKeyFromPosition(position) ?? '')
          ? { ...position, isValueUpdating: true }
          : position,
      ),
    ]
  }, [
    filters.chainIds,
    filters.page,
    filters.protocols,
    filters.statuses,
    parsedPositions,
    placeholders,
    valueUpdatingKeys,
  ])

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

  return (
    <>
      {zapInWidget}
      {zapMigrationWidget}
      {zapOutWidget}
      {claimRewardsModal}
      {claimAllRewardsModal}

      <ListingPageWrapper>
        <HiddenH1>Track all your active liquidity positions in one dashboard.</HiddenH1>
        <HiddenH2>
          Monitor APR, rewards, and performance across protocols — no need to check each one separately.
        </HiddenH2>
        <ListingPageTitle backLabel="Go back" onBack={() => navigate(-1)} titleAs="span">
          {t`My Liquidity Positions`}
        </ListingPageTitle>

        <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <MultiSelectDropdownMenu
            highlightOnSelect
            showOnlyButton
            label={selectedChainsLabel || t`Select chains`}
            options={supportedChains.length ? supportedChains : [AllChainsOption]}
            value={filters.chainIds || ''}
            onChange={value => value !== filters.chainIds && updateFilters('chainIds', value)}
          />

          <ListingPageNavigateButton
            mobileFullWidth
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explore Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
        </div>

        {(account || isRestoringWallet) && (
          <PositionBanner
            positionsStats={positionsStats}
            initialLoading={isInitialLoading}
            rewardInfo={rewardInfo}
            isLoadingRewardInfo={isLoadingRewardInfo}
            onOpenClaimAllRewards={onOpenClaimAllRewards}
          />
        )}

        <Filter supportedDexes={supportedDexes} filters={filters} updateFilters={updateFilters} />

        <PositionTableWrapper>
          <div>
            {!upToCustomLarge && (filteredPositions.length > 0 || isInitialLoading) && (
              <PositionTableHeader>
                <PositionTableHeaderItem>
                  <span>{t`Position`}</span>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem>
                  <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.VALUE)}>
                    {t`Value`}
                    <SortIcon sorted={filters.sortBy === SortBy.VALUE ? (filters.orderBy as Direction) : undefined} />
                  </PositionTableHeaderFlexItem>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem>
                  <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.APR)}>
                    {t`Est. APR`}
                    <SortIcon sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined} />
                  </PositionTableHeaderFlexItem>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem>
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
                </PositionTableHeaderItem>

                <PositionTableHeaderItem className="flex-row gap-1">
                  <FarmingIcon width={24} height={24} />
                  <div className="flex flex-col">
                    <Trans>
                      <span>Unclaimed</span>
                      <span>rewards</span>
                    </Trans>
                  </div>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem className="items-center">
                  <span>{t`Balance`}</span>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem>
                  <span>{t`Price range`}</span>
                </PositionTableHeaderItem>

                <PositionTableHeaderItem className="flex-row items-start justify-end whitespace-nowrap">
                  <HStack className="shrink-0 items-center">
                    {t`Actions`}
                    {actionsInfoHelper}
                  </HStack>
                </PositionTableHeaderItem>
              </PositionTableHeader>
            )}
            <div className="relative">
              <RefetchIndicator visible={isFetching && !isInitialLoading} />
              {isInitialLoading ? (
                <PositionListSkeleton />
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
            </div>
          </div>
          {!isError && !isInitialLoading && positionsStats && (
            <Pagination
              onPageChange={(newPage: number) => updateFilters('page', newPage)}
              totalCount={positionsStats.totalItems || 0}
              currentPage={filters.page}
              pageSize={filters.pageSize || 10}
            />
          )}
        </PositionTableWrapper>

        <ListingPageDisclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</ListingPageDisclaimer>
      </ListingPageWrapper>
    </>
  )
}

export default UserPositions
