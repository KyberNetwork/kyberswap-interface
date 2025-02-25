import { t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useUserPositionsQuery } from 'services/zapEarn'

import { ReactComponent as RocketIcon } from 'assets/svg/rocket.svg'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

import { ContentWrapper, Disclaimer, NavigateButton } from '../PoolExplorer/styles'
import { IconArrowLeft } from '../PositionDetail/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import useSupportedDexesAndChains from '../useSupportedDexesAndChains'
import Filter from './Filter'
import PositionBanner from './PositionBanner'
import TableContent, { FeeInfoFromRpc } from './TableContent'
import { PositionPageWrapper, PositionTableHeader, PositionTableWrapper } from './styles'
import useFilter, { SortBy } from './useFilter'

const POSITIONS_TABLE_LIMIT = 10

const MyPositions = () => {
  const navigate = useNavigate()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()
  const { filters, updateFilters } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut } = useLiquidityWidget()
  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)
  const [feeInfoFromRpc, setFeeInfoFromRpc] = useState<FeeInfoFromRpc[]>([])

  const {
    data: userPosition,
    isFetching,
    isError,
  } = useUserPositionsQuery(filters, {
    skip: !filters.addresses,
    pollingInterval: 15_000,
  })

  const filteredPositions = useMemo(() => {
    if (!userPosition) return []

    let positions = [...userPosition].map(position => {
      const feeInfo = feeInfoFromRpc.find(feeInfo => feeInfo.id === position.tokenId)
      if (!feeInfo) return position
      return {
        ...position,
        feeInfo,
      }
    })
    if (filters.status) positions = positions.filter(position => position.status === filters.status)
    if (filters.sortBy) {
      if (filters.sortBy === SortBy.VALUE) {
        positions.sort((a, b) => {
          const aValue = a.currentPositionValue
          const bValue = b.currentPositionValue
          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      } else if (filters.sortBy === SortBy.APR_7D) {
        positions.sort((a, b) => {
          const aValue = a.apr
          const bValue = b.apr
          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      } else if (filters.sortBy === SortBy.UNCLAIMED_FEE) {
        positions.sort((a, b) => {
          const aValue = a.feeInfo
            ? a.feeInfo.totalValue
            : a.feePending.reduce((total, fee) => total + fee.quotes.usd.value, 0)
          const bValue = b.feeInfo
            ? b.feeInfo.totalValue
            : b.feePending.reduce((total, fee) => total + fee.quotes.usd.value, 0)
          return filters.orderBy === Direction.ASC ? aValue - bValue : bValue - aValue
        })
      }
    }

    return positions
  }, [feeInfoFromRpc, filters.orderBy, filters.sortBy, filters.status, userPosition])

  const positionsToShow = useMemo(() => {
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

  return (
    <>
      {liquidityWidget}
      <PositionPageWrapper>
        <Flex
          flexDirection={upToSmall ? 'column' : 'row'}
          alignItems={upToSmall ? 'flex-start' : 'center'}
          justifyContent={'space-between'}
          sx={{ gap: 3 }}
        >
          <Flex sx={{ gap: 3 }}>
            <IconArrowLeft onClick={() => navigate(-1)} />
            <Text as="h1" fontSize={24} fontWeight="500">
              {t`My Liquidity Positions`}
            </Text>
          </Flex>
          <NavigateButton
            mobileFullWidth
            icon={<RocketIcon width={20} height={20} />}
            text={t`Explore Pools`}
            to={APP_PATHS.EARN_POOLS}
          />
        </Flex>

        {account && <PositionBanner positions={filteredPositions} />}

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
            {!upToLarge && positionsToShow && positionsToShow.length > 0 && (
              <PositionTableHeader>
                <Text>{t`Position`}</Text>
                <Flex
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  onClick={() => onSortChange(SortBy.VALUE)}
                >
                  {t`Value`}
                  <SortIcon sorted={filters.sortBy === SortBy.VALUE ? (filters.orderBy as Direction) : undefined} />
                </Flex>
                <Flex
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  onClick={() => onSortChange(SortBy.APR_7D)}
                >
                  {t`7D APR`}
                  <SortIcon sorted={filters.sortBy === SortBy.APR_7D ? (filters.orderBy as Direction) : undefined} />
                </Flex>
                <Flex
                  sx={{ gap: '4px', alignItems: 'center', cursor: 'pointer' }}
                  role="button"
                  onClick={() => onSortChange(SortBy.UNCLAIMED_FEE)}
                >
                  {t`Unclaimed fee`}
                  <SortIcon
                    sorted={filters.sortBy === SortBy.UNCLAIMED_FEE ? (filters.orderBy as Direction) : undefined}
                  />
                </Flex>
                <Text>{t`Balance`}</Text>
                <Text>{t`Price Range`}</Text>
                <Text>{t`Actions`}</Text>
              </PositionTableHeader>
            )}
            {isFetching && loading ? (
              <LocalLoader />
            ) : (
              <TableContent
                positions={positionsToShow}
                feeInfoFromRpc={feeInfoFromRpc}
                setFeeInfoFromRpc={setFeeInfoFromRpc}
                onOpenZapInWidget={handleOpenZapInWidget}
                onOpenZapOut={handleOpenZapOut}
              />
            )}
          </ContentWrapper>
          {!isError && (!isFetching || !loading) && (
            <Pagination
              haveBg={false}
              onPageChange={(newPage: number) => updateFilters('page', newPage)}
              totalCount={userPosition?.length || 0}
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

export default MyPositions
