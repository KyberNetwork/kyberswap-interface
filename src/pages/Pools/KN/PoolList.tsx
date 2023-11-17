import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { Input as PaginationInput } from 'components/Pagination/PaginationInputOnMobile'
import ItemCard from 'components/PoolList/ItemCard'
import ListItem from 'components/PoolList/ListItem'
import ShareModal from 'components/ShareModal'
import { SORT_DIRECTION } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'
import { useUserProMMPositions } from 'state/prommPools/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ElasticPoolDetail } from 'types/pool'

import ProAmmPoolCardItem from './ElasticPools/CardItem'
import ProAmmPoolListItem from './ElasticPools/ListItem'
import { ITEM_PER_PAGE, SORT_FIELD } from './const'
import { SelectPairInstructionWrapper } from './styleds'

const PageWrapper = styled.div`
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.background};

  ${PaginationInput} {
    background: ${({ theme }) => theme.background};
  }

  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
`

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  padding: 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  `}
`

const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }

  user-select: none;
  text-transform: uppercase;
`

const Grid = styled.div`
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    grid-template-columns: 1fr;
  `};
`

export default function PoolList({
  pools,
  loading,
  page,
  sortBy,
  sortType,
  timeframe,
  view,
}: {
  pools:
    | {
        [address: string]: ClassicPoolData | ElasticPoolDetail
      }
    | undefined
  loading: boolean
  page: number
  sortBy: '' | 'apr' | 'tvl' | 'volume' | 'fees' | 'id'
  sortType: '' | 'asc' | 'desc'
  timeframe: '24h' | '7d' | '30d'
  view: 'list' | 'grid'
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account, isEVM, networkInfo } = useActiveWeb3React()

  const { farms } = useElasticFarms()
  const farmTokens = [
    ...new Set(
      farms
        ?.map(farm => farm.pools)
        .flat()
        .map(pool => [
          ...pool.rewardTokens.map(rw => rw.wrapped.address.toLowerCase()),
          pool.token0.wrapped.address,
          pool.token1.wrapped.address,
        ])
        .flat() || [],
    ),
  ] //todo namgold: remove

  const poolTokens = Object.values(pools || {})
    .map(item => [item.token0.address, item.token1.address])
    .flat()
  const tokenPriceMap = useTokenPrices([...new Set(farmTokens.concat(poolTokens))])

  const userLiquidityPositionsQueryResult = useUserProMMPositions(tokenPriceMap)
  const loadingUserPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userPositions = useMemo(
    () => (!account ? {} : userLiquidityPositionsQueryResult.userLiquidityUsdByPool),
    [account, userLiquidityPositionsQueryResult],
  )

  const userLiquidityPositionsClassicQueryResult = useUserLiquidityPositions()
  const loadingUserLiquidityPositions = !account ? false : userLiquidityPositionsClassicQueryResult.loading
  const userLiquidityPositions = useMemo(
    () => (!account ? { liquidityPositions: [] } : userLiquidityPositionsClassicQueryResult.data),
    [account, userLiquidityPositionsClassicQueryResult],
  )

  const isSortDesc = sortType === SORT_DIRECTION.DESC

  const anyLoading = loading || loadingUserPositions || loadingUserLiquidityPositions

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortBy !== field
        ? SORT_DIRECTION.DESC
        : sortType === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('orderDirection', direction)
    searchParams.set('orderBy', field)
    setSearchParams(searchParams)
  }

  const renderHeader = () => {
    return view === VIEW_MODE.LIST ? (
      <TableHeader>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Token Pair | Fee</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.TVL)}>
            <span>TVL</span>
            {sortBy === SORT_FIELD.TVL ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => handleSort(SORT_FIELD.APR)}
            style={{
              paddingRight: '20px', // leave some space for the money bag in the value rows
            }}
          >
            <Trans>APR</Trans>
            {sortBy === SORT_FIELD.APR ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}

            <InfoHelper
              text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm.`}
            />
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.VOLUME)}>
            <Trans>VOLUME (24H)</Trans>
            {sortBy === SORT_FIELD.VOLUME ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.FEE)}>
            <Trans>FEES (24H)</Trans>
            {sortBy === SORT_FIELD.FEE ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>ACTIONS</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams
  const setPage = useCallback(
    (page: number) => {
      if (page && page > 1) searchParamsRef.current.set('page', String(page))
      else searchParamsRef.current.delete('page')
      setSearchParams(searchParamsRef.current, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    setPage(1)
  }, [pools, setPage])

  const [sharedPoolId, setSharedPoolId] = useState('')
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const chainRoute = networkInfo.route
  const shareUrl = sharedPoolId
    ? window.location.origin + `/pools/${chainRoute}?search=` + sharedPoolId + '&tab=elastic'
    : undefined

  useEffect(() => {
    if (sharedPoolId) {
      openShareModal()
    }
  }, [openShareModal, sharedPoolId])

  useEffect(() => {
    if (!isShareModalOpen) {
      setSharedPoolId('')
    }
  }, [isShareModalOpen, setSharedPoolId])

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = useMemo(() => {
    if (!userLiquidityPositions) return {}

    return userLiquidityPositions.liquidityPositions.reduce((acc, position) => {
      acc[position.pool.id] = position
      return acc
    }, {} as { [key: string]: UserLiquidityPosition })
  }, [userLiquidityPositions])

  if (!isEVM) return <Navigate to="/" />
  const poolsList = Object.values(pools || {})

  if (!anyLoading && !poolsList.length) {
    return (
      <SelectPairInstructionWrapper>
        <div style={{ marginBottom: '1rem' }}>
          <Trans>There are no pools for this token pair.</Trans>
        </div>
        <div>
          <Trans>Create a new pool or select another pair of tokens to view the available pools.</Trans>
        </div>
      </SelectPairInstructionWrapper>
    )
  }

  return (
    <PageWrapper>
      {renderHeader()}
      {anyLoading && !poolsList.length && <LocalLoader />}
      {view === VIEW_MODE.LIST ? (
        poolsList.map(pool => {
          if (pool.protocol === 'elastic')
            return (
              <ProAmmPoolListItem
                key={pool.address}
                pool={pool}
                onShared={setSharedPoolId}
                userPositions={userPositions}
              />
            )
          if (pool.protocol === 'classic')
            return <ListItem key={pool.id} poolData={pool} userLiquidityPositions={transformedUserLiquidityPositions} />

          return null
        })
      ) : (
        <Grid>
          {poolsList.map(pool => {
            if (pool.protocol === 'elastic')
              return (
                <ProAmmPoolCardItem
                  key={pool.address}
                  pool={pool}
                  onShared={setSharedPoolId}
                  userPositions={userPositions}
                  timeframe={timeframe}
                />
              )
            if (pool.protocol === 'classic')
              return <ItemCard poolData={pool} key={pool.id} myLiquidity={transformedUserLiquidityPositions[pool.id]} />

            return null
          })}
        </Grid>
      )}

      {!!poolsList.length && (
        <Pagination onPageChange={setPage} totalCount={poolsList.length} currentPage={page} pageSize={ITEM_PER_PAGE} />
      )}
      <ShareModal
        url={shareUrl}
        title={sharedPoolId ? t`Share this pool with your friends!` : t`Share this list of pools with your friends`}
      />
    </PageWrapper>
  )
}
