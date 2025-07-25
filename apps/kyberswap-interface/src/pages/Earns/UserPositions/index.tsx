import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

// import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
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
import { earnSupportedChains, earnSupportedExchanges, protocolGroupNameToExchangeMapping } from 'pages/Earns/constants'
import useAccountChanged from 'pages/Earns/hooks/useAccountChanged'
import useClosedPositions from 'pages/Earns/hooks/useClosedPositions'
// import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useSupportedDexesAndChains from 'pages/Earns/hooks/useSupportedDexesAndChains'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { parsePosition } from 'pages/Earns/utils/position'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

const POSITIONS_TABLE_LIMIT = 10

const UserPositions = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()
  const { filters, updateFilters } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfoFromRpc[]>([])

  const { closedPositionsFromRpc, checkClosedPosition } = useClosedPositions()

  const positionQueryParams = useMemo(() => {
    const statusFilter = filters.status.split(',')
    const isFilterOnlyClosedPosition = statusFilter.length === 1 && statusFilter[0] === PositionStatus.CLOSED
    const isFilterOnlyOpenPosition = !statusFilter.includes(PositionStatus.CLOSED)

    return {
      addresses: account || '',
      chainIds: earnSupportedChains.join(','),
      protocols: earnSupportedExchanges.join(','),
      q: filters.q,
      positionStatus: isFilterOnlyClosedPosition ? 'closed' : isFilterOnlyOpenPosition ? 'open' : 'all',
    }
  }, [account, filters.q, filters.status])

  const {
    data: userPosition,
    isFetching,
    isError,
    refetch,
  } = useUserPositionsQuery(positionQueryParams, {
    skip: !account,
    pollingInterval: 15_000,
  })

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

  // const { rewardInfo } = useKemRewards()

  useAccountChanged(() => {
    refetch()
    setLoading(true)
  })

  const parsedPositions: Array<ParsedPosition> = useMemo(
    () =>
      [...(userPosition || [])].map(position => {
        const feeInfo = feeInfoFromRpc.find(feeInfo => feeInfo.id === position.tokenId)
        // const nftRewardInfo = rewardInfo?.nfts.find(item => item.nftId === position.tokenId)
        const nftRewardInfo = undefined
        const isClosedFromRpc = closedPositionsFromRpc.some(
          closedPosition => closedPosition.tokenId === position.tokenId,
        )

        return parsePosition({
          position,
          feeInfo,
          nftRewardInfo,
          isClosedFromRpc,
        })
      }),
    // [feeInfoFromRpc, rewardInfo?.nfts, userPosition, closedPositionsFromRpc],
    [feeInfoFromRpc, userPosition, closedPositionsFromRpc],
  )

  const filteredPositions: Array<ParsedPosition> = useMemo(() => {
    let result = []

    const arrStatus = filters.status.split(',')
    result = [...parsedPositions].filter(position => {
      if (filters.status === PositionStatus.OUT_RANGE)
        return !position.pool.isUniv2 && arrStatus.includes(position.status)

      return arrStatus.includes(position.status)
    })

    if (filters.chainIds) result = result.filter(position => position.chain.id === Number(filters.chainIds))
    if (filters.protocols) {
      result = result.filter(position =>
        filters.protocols?.split(',').includes(protocolGroupNameToExchangeMapping[position.dex.id]),
      )
    }

    if (filters.sortBy) {
      if (filters.sortBy === SortBy.VALUE) {
        result.sort((a, b) => {
          const aValue = a.totalValue
          const bValue = b.totalValue

          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      } else if (filters.sortBy === SortBy.APR) {
        result.sort((a, b) => {
          const aValue = a.apr
          const bValue = b.apr

          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      } else if (filters.sortBy === SortBy.UNCLAIMED_FEE) {
        result.sort((a, b) => {
          const aValue = a.unclaimedFees
          const bValue = b.unclaimedFees

          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      } else if (filters.sortBy === SortBy.UNCLAIMED_REWARDS) {
        result.sort((a, b) => {
          const aValue = a.rewards.unclaimedUsdValue
          const bValue = b.rewards.unclaimedUsdValue

          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      }
    }

    return result
  }, [filters.chainIds, filters.orderBy, filters.protocols, filters.sortBy, filters.status, parsedPositions])

  const paginatedPositions: Array<ParsedPosition> = useMemo(() => {
    if (filteredPositions.length <= POSITIONS_TABLE_LIMIT) return filteredPositions
    return filteredPositions.slice((filters.page - 1) * POSITIONS_TABLE_LIMIT, filters.page * POSITIONS_TABLE_LIMIT)
  }, [filteredPositions, filters.page])

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
          {/* <Text fontSize={14}>
            <Text as="u" color={theme.primary}>
              {t`Claim rewards`}
            </Text>
            : {t`Claim your claimable farming rewards from a position.`}
          </Text> */}
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
        <Flex
          flexDirection={upToSmall ? 'column' : 'row'}
          alignItems={upToSmall ? 'flex-start' : 'center'}
          justifyContent={'space-between'}
          sx={{ gap: 3 }}
        >
          <Flex alignItems="center" sx={{ gap: 3 }}>
            <IconArrowLeft onClick={() => navigate(-1)} />
            <Text as="h1" fontSize={24} fontWeight="500">
              {t`My Positions`}
            </Text>
          </Flex>
          <NavigateButton
            mobileFullWidth
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explore Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
        </Flex>

        {account && <PositionBanner positions={parsedPositions} initialLoading={initialLoading} />}

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
            {!upToLarge && paginatedPositions && paginatedPositions.length > 0 && (
              <PositionTableHeader>
                <PositionTableHeaderItem>{t`Position`}</PositionTableHeaderItem>

                <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.VALUE)}>
                  {t`Value`}
                  <SortIcon
                    sorted={filters.sortBy === SortBy.VALUE ? (filters.orderBy as Direction) : undefined}
                    style={{ position: 'relative', top: '5px' }}
                  />
                </PositionTableHeaderFlexItem>

                <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.APR)}>
                  {t`est. APR`}
                  <SortIcon
                    sorted={filters.sortBy === SortBy.APR ? (filters.orderBy as Direction) : undefined}
                    style={{ position: 'relative', top: '4px' }}
                  />
                </PositionTableHeaderFlexItem>

                <Flex
                  flexDirection={'column'}
                  justifyContent={'flex-start'}
                  sx={{ height: '100%', gap: '9px', cursor: 'pointer' }}
                  role="button"
                  onClick={() => onSortChange(SortBy.UNCLAIMED_FEE)}
                >
                  <div>Unclaimed</div>
                  <Flex alignItems={'center'} sx={{ gap: '4px' }}>
                    fees
                    <SortIcon
                      sorted={filters.sortBy === SortBy.UNCLAIMED_FEE ? (filters.orderBy as Direction) : undefined}
                    />
                  </Flex>
                </Flex>

                {/* <PositionTableHeaderFlexItem role="button" onClick={() => onSortChange(SortBy.UNCLAIMED_REWARDS)}>
                  <Flex alignItems={'flex-start'} sx={{ gap: '4px' }}>
                    <IconKem width={24} height={24} />
                    <Text>Unclaimed</Text>
                  </Flex>
                  <Flex alignItems={'center'} sx={{ gap: '4px' }} paddingLeft={'28px'}>
                    <Text>rewards</Text>
                    <SortIcon
                      sorted={filters.sortBy === SortBy.UNCLAIMED_REWARDS ? (filters.orderBy as Direction) : undefined}
                    />
                  </Flex>
                </PositionTableHeaderFlexItem> */}

                {/* {!upToLarge && <div />} */}

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
              />
            )}
          </ContentWrapper>
          {!isError && (!isFetching || !loading) && (
            <Pagination
              haveBg={false}
              onPageChange={(newPage: number) => updateFilters('page', newPage)}
              totalCount={filteredPositions.length || 0}
              currentPage={filters.page}
              pageSize={POSITIONS_TABLE_LIMIT}
            />
          )}
        </PositionTableWrapper>

        <Disclaimer>{t`KyberSwap provides tools for tracking & adding liquidity to third-party Protocols. For any pool-related concerns, please contact the respective Liquidity Protocol directly.`}</Disclaimer>
      </PositionPageWrapper>
    </>
  )
}

export default UserPositions
