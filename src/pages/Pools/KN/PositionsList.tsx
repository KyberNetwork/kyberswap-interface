import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { Input as PaginationInput } from 'components/Pagination/PaginationInputOnMobile'
import ShareModal from 'components/ShareModal'
import { SORT_DIRECTION } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ElasticPoolDetail } from 'types/pool'

import ClassicGridItem from './Positions/ClassicPositions/GridItem'
import ClassicListItem from './Positions/ClassicPositions/ListItem'
import ElasticGridItem from './Positions/ElasticPositions/GridItem'
import ElasticListItem from './Positions/ElasticPositions/ListItem'
import { ITEM_PER_PAGE, POOL_TIMEFRAME, SORT_FIELD } from './const'
import { ClickableText, TableHeader } from './styleds'

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
const BodyWrapper = styled.div`
  overflow-y: scroll;
  width: 100%;
`

function PositionsList({
  data,
  loading,
  page,
  setPage,
  sortBy,
  sortType,
  timeframe,
  view,
}: {
  data:
    | {
        pools: {
          [address: string]: ClassicPoolData | ElasticPoolDetail
        }
        pagination: { totalRecords: number }
      }
    | undefined
    | null
  loading: boolean
  page: number
  setPage: (page: number) => void
  sortBy?: SORT_FIELD
  sortType?: SORT_DIRECTION
  timeframe: POOL_TIMEFRAME
  view: VIEW_MODE
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { account, isEVM } = useActiveWeb3React()
  const theme = useTheme()

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortBy !== field
        ? SORT_DIRECTION.DESC
        : sortType === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('sortType', direction)
    searchParams.set('sortBy', field === SORT_FIELD.MY_LIQUIDITY && !account ? '' : field)
    setSearchParams(searchParams)
  }

  const renderHeader = () => {
    const sortArrow =
      sortType === SORT_DIRECTION.DESC ? (
        <ArrowDown size="14" style={{ marginLeft: '2px' }} />
      ) : (
        <ArrowUp size="14" style={{ marginLeft: '2px' }} />
      )

    return view === VIEW_MODE.LIST ? (
      <TableHeader>
        <Flex alignItems="center" as="th">
          <ClickableText>
            <Trans>Token Pair</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.MY_LIQUIDITY)}>
            <Trans>MY LIQUIDITY</Trans>
            {sortBy === SORT_FIELD.MY_LIQUIDITY && sortArrow}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }}>
            <Trans>PROFIT & LOSS</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }}>
            <Trans>PRICE RANGE</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.MY_POOL_APR)}>
            <Trans>MY POOL APR</Trans>
            {sortBy === SORT_FIELD.MY_POOL_APR && sortArrow}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.MY_FARM_APR)}>
            <Trans>MY FARM APR</Trans>
            {sortBy === SORT_FIELD.MY_FARM_APR && sortArrow}
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

  const [sharedPoolId, setSharedPoolId] = useState('')
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const shareUrl = sharedPoolId ? window.location.origin + `/pools/ethereum?search=` + sharedPoolId : undefined

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

  if (!isEVM) return <Navigate to="/" />
  const poolsList = Object.values(data?.pools || {})
  const positionsList = poolsList
    .map(pool => {
      if (!pool.positions) return null
      if (pool.protocol === 'elastic') {
        return pool.positions.map(position => {
          if (view === VIEW_MODE.LIST) {
            return (
              <ElasticListItem
                key={pool.address + '_' + position.id}
                pool={pool}
                position={position}
                onShared={setSharedPoolId}
              />
            )
          }
          return (
            <ElasticGridItem
              key={pool.address + '_' + position.id}
              pool={pool}
              position={position}
              onShared={setSharedPoolId}
              timeframe={timeframe}
            />
          )
        })
      } else if (pool.protocol === 'classic') {
        return pool.positions.map(position => {
          if (view === VIEW_MODE.LIST) {
            return (
              <ClassicListItem
                key={pool.address + '_' + position.id}
                pool={pool}
                position={position}
                onShared={setSharedPoolId}
              />
            )
          }
          return (
            <ClassicGridItem
              key={pool.address + '_' + position.id}
              pool={pool}
              position={position}
              timeframe={timeframe}
              onShared={setSharedPoolId}
            />
          )
        })
      }
      return null
    })
    .flat(1)
    .filter(Boolean) as JSX.Element[]

  return (
    <PageWrapper>
      <BodyWrapper>
        {renderHeader()}
        {loading ? (
          <LocalLoader />
        ) : !positionsList.length ? (
          <Flex
            backgroundColor={theme.background}
            justifyContent="center"
            alignItems="center"
            sx={{ borderRadius: '20px', width: '100%', height: '400px' }}
          >
            <Text color={theme.subText}>
              <Trans>No Position found</Trans>
            </Text>
          </Flex>
        ) : (
          positionsList
        )}

        <ShareModal
          url={shareUrl}
          title={sharedPoolId ? t`Share this pool with your friends!` : t`Share this list of pools with your friends`}
        />
      </BodyWrapper>
      {typeof data?.pagination.totalRecords === 'number' && (
        <Pagination
          onPageChange={setPage}
          totalCount={data?.pagination.totalRecords}
          currentPage={page}
          pageSize={ITEM_PER_PAGE}
        />
      )}
    </PageWrapper>
  )
}
export default PositionsList
