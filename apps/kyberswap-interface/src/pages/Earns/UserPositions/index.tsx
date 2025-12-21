import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
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
import { EarnChain, Exchange } from 'pages/Earns/constants'
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
import { enumToArrayOfValues } from 'utils'

const UserPositions = () => {
  const theme = useTheme()
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
    const statusFilter = filters.statuses.split(',')
    const isFilterOnlyClosedPosition = statusFilter.length === 1 && statusFilter[0] === PositionStatus.CLOSED
    const isFilterOnlyOpenPosition = !statusFilter.includes(PositionStatus.CLOSED)

    const protocols = filters.protocols || enumToArrayOfValues(Exchange).join(',')
    const earnSupportedChains = enumToArrayOfValues(EarnChain, 'number')

    return {
      wallet: account || '',
      chainIds: earnSupportedChains.join(','),
      protocols,
      statuses: isFilterOnlyClosedPosition
        ? PositionStatus.CLOSED
        : isFilterOnlyOpenPosition
        ? [PositionStatus.IN_RANGE, PositionStatus.OUT_RANGE].join(',')
        : '',
      keyword: filters.keyword,
      positionIds: filters.positionId,
      sorts: [filters.sortBy, filters.orderBy].filter(Boolean).join(':'),
      page: filters.page,
      pageSize: filters.pageSize || 10,
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

  const { rewardInfo } = useKemRewards()

  useAccountChanged(() => {
    refetch()
    setLoading(true)
  })

  const selectedChainsLabel = useMemo(() => {
    const arrValue = filters.chainIds?.split(',').filter(Boolean)
    const selectedChains = supportedChains.filter(option => arrValue?.includes(option.value))
    if (selectedChains.length >= 1) {
      return (
        <Flex alignItems="center" sx={{ gap: '6px' }}>
          <Flex>
            {selectedChains.map((chain, index) => (
              <ItemIcon key={chain.value} src={chain.icon} alt={chain.label} style={{ marginLeft: index ? -8 : 0 }} />
            ))}
          </Flex>
          {selectedChains.length > 1 ? `Selected: ${selectedChains.length} chains` : selectedChains[0].label}
        </Flex>
      )
    }
    return AllChainsOption.label
  }, [supportedChains, filters.chainIds])

  const parsedPositions: Array<ParsedPosition> = useMemo(() => {
    const userPositions = userPositionsData?.positions || []
    return userPositions.map(position => {
      const tokenId = position.tokenId?.toString()
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
  }, [feeInfoFromRpc, rewardInfo?.nfts, userPositionsData?.positions, closedPositionsFromRpc])

  const filteredPositions: Array<ParsedPosition> = useMemo(() => {
    const unfinalizedPositions = getUnfinalizedPositions(parsedPositions)
    const filteredUnfinalizedPositions = unfinalizedPositions.filter(
      position =>
        (filters.chainIds ? filters.chainIds.split(',').includes(position.chain.id.toString()) : true) &&
        (filters.protocols ? filters.protocols.split(',').includes(position.dex.id) : true) &&
        (filters.statuses.includes(PositionStatus.IN_RANGE) || filters.statuses.includes(PositionStatus.OUT_RANGE)),
    )

    return [
      ...parsedPositions,
      ...filteredUnfinalizedPositions.filter(
        unfinalizedPos => !parsedPositions.some(p => p.tokenId === unfinalizedPos.tokenId),
      ),
    ]
  }, [parsedPositions, filters.chainIds, filters.protocols, filters.statuses])

  const paginatedPositions: Array<ParsedPosition> = filteredPositions

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
    updateFilters('sortBy', SortBy.VALUE)
    updateFilters('orderBy', Direction.DESC)
  }

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
    const interval = setInterval(() => {
      setFeeInfoFromRpc(prev =>
        prev
          .filter(feeInfo => feeInfo.timeRemaining > 0)
          .map(feeInfo => {
            return {
              ...feeInfo,
              timeRemaining: feeInfo.timeRemaining - 1,
            }
          }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const actionsInfoHelper = (
    <InfoHelper
      text={
        <Flex flexDirection="column" sx={{ gap: 1 }}>
          <Text fontSize={14}>
            <Text as="u" color={theme.primary}>
              {t`Increase liquidity`}
            </Text>
            : {t`Add more liquidity to this position using any token(s).`}
          </Text>
          <Text fontSize={14}>
            <Text as="u" color={theme.primary}>
              {t`Remove liquidity`}
            </Text>
            : {t`Remove liquidity from this position by zapping out to any token(s).`}
          </Text>
          <Text fontSize={14}>
            <Text as="u" color={theme.primary}>
              {t`Claim fees`}
            </Text>
            : {t`Claim your unclaimed fees from this position.`}
          </Text>
          <Text fontSize={14}>
            <Text as="u" color={theme.primary}>
              {t`Claim rewards`}
            </Text>
            : {t`Claim your claimable farming rewards from a position.`}
          </Text>
        </Flex>
      }
      noArrow
      placement="top-end"
      width="280px"
      size={16}
      style={{ position: 'relative', top: '2px', height: 16 }}
    />
  )

  const initialLoading = isFetching && loading

  return (
    <>
      {zapInWidget}
      {zapMigrationWidget}
      {zapOutWidget}

      <PositionPageWrapper>
        <Flex alignItems="center" sx={{ gap: 3 }}>
          <IconArrowLeft onClick={() => navigate(-1)} />
          <Text as="h1" fontSize={24} fontWeight="500">
            {t`My Positions`}
          </Text>
        </Flex>

        <Flex
          flexDirection={upToSmall ? 'column' : 'row'}
          alignItems={upToSmall ? 'flex-start' : 'center'}
          justifyContent={'space-between'}
          sx={{ gap: 2 }}
        >
          <MultiSelectDropdownMenu
            alignLeft
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
        </Flex>

        {account && (
          <PositionBanner
            positions={filteredPositions}
            positionsStats={positionsStats}
            initialLoading={initialLoading}
          />
        )}

        <Filter
          supportedChains={supportedChains}
          supportedDexes={supportedDexes}
          filters={filters}
          updateFilters={(...args) => {
            updateFilters(...args)
            setLoading(true)
          }}
        />

        <PositionTableWrapper>
          <ContentWrapper>
            {!upToCustomLarge && paginatedPositions && paginatedPositions.length > 0 && (
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
                  flexDirection="column"
                  alignItems="flex-start"
                  role="button"
                  onClick={() => onSortChange(SortBy.UNCLAIMED_FEE)}
                >
                  <Trans>
                    <Text>Unclaimed</Text>
                    <Flex alignItems={'center'} sx={{ gap: '4px' }}>
                      <Text>fees</Text>
                      <SortIcon
                        sorted={filters.sortBy === SortBy.UNCLAIMED_FEE ? (filters.orderBy as Direction) : undefined}
                      />
                    </Flex>
                  </Trans>
                </PositionTableHeaderFlexItem>

                <Flex sx={{ gap: '4px' }}>
                  <FarmingIcon width={24} height={24} />
                  <PositionTableHeaderFlexItem
                    flexDirection="column"
                    role="button"
                    onClick={() => onSortChange(SortBy.UNCLAIMED_REWARDS)}
                  >
                    <Trans>
                      <Text>Unclaimed</Text>
                      <Flex alignItems={'center'} sx={{ gap: '4px' }}>
                        <Text>rewards</Text>
                        <SortIcon
                          sorted={
                            filters.sortBy === SortBy.UNCLAIMED_REWARDS ? (filters.orderBy as Direction) : undefined
                          }
                        />
                      </Flex>
                    </Trans>
                  </PositionTableHeaderFlexItem>
                </Flex>

                {!upToCustomLarge && <div />}

                <PositionTableHeaderItem>{t`Balance`}</PositionTableHeaderItem>

                <PositionTableHeaderItem>{t`Price range`}</PositionTableHeaderItem>

                <Flex alignContent="flex-start" justifyContent="flex-end" height="100%">
                  {t`Actions`}
                  {actionsInfoHelper}
                </Flex>
              </PositionTableHeader>
            )}
            {isFetching && loading ? (
              <LocalLoader />
            ) : (
              <TableContent
                positions={paginatedPositions}
                feeInfoFromRpc={feeInfoFromRpc}
                setFeeInfoFromRpc={setFeeInfoFromRpc}
                onOpenZapInWidget={handleOpenZapIn}
                onOpenZapOut={handleOpenZapOut}
                refetchPositions={refetch}
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
