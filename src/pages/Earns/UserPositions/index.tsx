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
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { MEDIA_WIDTHS } from 'theme'

import { ContentWrapper, Disclaimer, NavigateButton } from '../PoolExplorer/styles'
import { IconArrowLeft } from '../PositionDetail/styles'
import useLiquidityWidget from '../useLiquidityWidget'
import useSupportedDexesAndChains from '../useSupportedDexesAndChains'
import Filter from './Filter'
import PositionBanner from './PositionBanner'
import TableContent from './TableContent'
import { PositionPageWrapper, PositionTableHeader, PositionTableWrapper } from './styles'
import useFilter, { SortBy } from './useFilter'

const POSITIONS_TABLE_LIMIT = 10

const MyPositions = () => {
  const navigate = useNavigate()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { filters, onFilterChange } = useFilter()
  const { supportedDexes, supportedChains } = useSupportedDexesAndChains(filters)

  const { liquidityWidget, handleOpenZapInWidget, handleOpenZapOut } = useLiquidityWidget()
  const firstLoading = useRef(false)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const {
    data: userPosition,
    isFetching,
    isError,
  } = useUserPositionsQuery(filters, {
    skip: !filters.addresses,
    pollingInterval: 15_000,
  })

  const positionsToShow = useMemo(() => {
    if ((!isFetching || !loading) && userPosition && userPosition.length > POSITIONS_TABLE_LIMIT)
      return userPosition.slice((page - 1) * POSITIONS_TABLE_LIMIT, page * POSITIONS_TABLE_LIMIT)

    return userPosition
  }, [isFetching, loading, page, userPosition])

  const onSortChange = (sortBy: string) => {
    setPage(1)
    if (!filters.sortBy || filters.sortBy !== sortBy) {
      onFilterChange('sortBy', sortBy)
      onFilterChange('orderBy', Direction.DESC)
      return
    }
    if (filters.orderBy === Direction.DESC) {
      onFilterChange('orderBy', Direction.ASC)
      return
    }
    onFilterChange('sortBy', SortBy.VALUE)
    onFilterChange('orderBy', Direction.DESC)
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

        <PositionBanner userPosition={userPosition} />

        <Filter
          supportedChains={supportedChains}
          supportedDexes={supportedDexes}
          filters={filters}
          onFilterChange={(...args) => {
            onFilterChange(...args)
            setPage(1)
            setLoading(true)
          }}
        />

        <PositionTableWrapper>
          <ContentWrapper>
            {!upToMedium && positionsToShow && positionsToShow.length > 0 && (
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
                onOpenZapInWidget={handleOpenZapInWidget}
                onOpenZapOut={handleOpenZapOut}
              />
            )}
          </ContentWrapper>
          {!isError && (
            <Pagination
              haveBg={false}
              onPageChange={(newPage: number) => setPage(newPage)}
              totalCount={userPosition?.length || 0}
              currentPage={page || 1}
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
