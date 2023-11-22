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
import { MouseoverTooltip, TextDotted } from 'components/Tooltip'
import { SORT_DIRECTION } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ElasticPoolDetail } from 'types/pool'

import ClassicGridItem from './ClassicPools/GridItem'
import ClassicListItem from './ClassicPools/ListItem'
import ElasticGridItem from './ElasticPools/GridItem'
import ElasticListItem from './ElasticPools/ListItem'
import { ITEM_PER_PAGE, POOL_TIMEFRAME, SORT_FIELD, poolTimeframeText } from './const'
import { TableHeader } from './styleds'

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
  /* grid-template-columns: 1fr 1fr 1fr; */
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    // grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    // grid-template-columns: 1fr;
  `};
`

function PoolList({
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
          <MouseoverTooltip
            text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm.`}
          >
            <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.TVL)}>
              <TextDotted>
                <Trans>TVL</Trans>
              </TextDotted>
              {sortBy === SORT_FIELD.TVL && sortArrow}
            </ClickableText>
          </MouseoverTooltip>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <MouseoverTooltip
            text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm.`}
          >
            <ClickableText
              onClick={() => handleSort(SORT_FIELD.APR)}
              style={{
                paddingRight: '14px', // leave some space for the money bag in the value rows
              }}
            >
              <TextDotted>
                <Trans>APR ({poolTimeframeText[timeframe]})</Trans>
              </TextDotted>
              {sortBy === SORT_FIELD.APR && sortArrow}
            </ClickableText>
          </MouseoverTooltip>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.VOLUME)}>
            <Trans>VOLUME ({poolTimeframeText[timeframe]})</Trans>
            {sortBy === SORT_FIELD.VOLUME && sortArrow}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.FEE)}>
            <Trans>FEES ({poolTimeframeText[timeframe]})</Trans>
            {sortBy === SORT_FIELD.FEE && sortArrow}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.MY_LIQUIDITY)}>
            <Trans>MY LIQUIDITY</Trans>
            {sortBy === SORT_FIELD.MY_LIQUIDITY && sortArrow}
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

  return (
    <PageWrapper>
      <BodyWrapper>
        {renderHeader()}
        {loading ? (
          <LocalLoader />
        ) : !poolsList.length ? (
          <Flex
            backgroundColor={theme.background}
            justifyContent="center"
            alignItems="center"
            sx={{ borderRadius: '20px', width: '100%', height: '400px' }}
          >
            <Text color={theme.subText}>
              <Trans>No Pools found</Trans>
            </Text>
          </Flex>
        ) : (
          <>
            {view === VIEW_MODE.LIST ? (
              poolsList.map(pool => {
                if (pool.protocol === 'elastic')
                  return <ElasticListItem key={pool.address} pool={pool} onShared={setSharedPoolId} />
                if (pool.protocol === 'classic')
                  return <ClassicListItem key={pool.id} pool={pool} onShared={setSharedPoolId} />

                return null
              })
            ) : (
              <Grid>
                {poolsList.map(pool => {
                  if (pool.protocol === 'elastic')
                    return (
                      <ElasticGridItem
                        key={pool.address}
                        pool={pool}
                        onShared={setSharedPoolId}
                        timeframe={timeframe}
                      />
                    )
                  if (pool.protocol === 'classic')
                    return (
                      <ClassicGridItem pool={pool} key={pool.id} timeframe={timeframe} onShared={setSharedPoolId} />
                    )

                  return null
                })}
              </Grid>
            )}
          </>
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
export default PoolList
