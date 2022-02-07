import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Pair } from '@dynamic-amm/sdk'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { getHealthFactor, getTradingFeeAPR } from 'utils/dmm'
import ListItemWrapper, { ItemCard } from './ListItem'
import PoolDetailModal from './PoolDetailModal'
import { AMP_HINT } from 'constants/index'
import useTheme from 'hooks/useTheme'

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 18px 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: ${({ theme }) => `0px 4px 16px ${theme.shadow}`};
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

const LoadMoreButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 8px;
  `};
`

const Pagination = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${({ theme }) => theme.oddRow};
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
`

const PaginationText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

interface PoolListProps {
  poolList: (Pair | null)[]
  subgraphPoolsData?: SubgraphPoolData[]
  userLiquidityPositions?: UserLiquidityPosition[]
}

const SORT_FIELD = {
  NONE: -1,
  LIQ: 0,
  VOL: 1,
  FEES: 2,
  ONE_YEAR_FL: 3
}

const ITEM_PER_PAGE = 5

const PoolList = ({ poolList, subgraphPoolsData, userLiquidityPositions }: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')
  const theme = useTheme()

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  const transformedSubgraphPoolsData: {
    [key: string]: SubgraphPoolData
  } = useMemo(() => {
    return (subgraphPoolsData || []).reduce((acc, data) => {
      return {
        ...acc,
        [data.id]: data
      }
    }, {})
  }, [subgraphPoolsData])

  userLiquidityPositions &&
    userLiquidityPositions.forEach(position => {
      transformedUserLiquidityPositions[position.pool.id] = position
    })

  // sorting
  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.LIQ)

  const listComparator = useCallback(
    (poolA: Pair | null, poolB: Pair | null): number => {
      if (sortedColumn === SORT_FIELD.NONE) {
        if (!poolA) {
          return 1
        }

        if (!poolB) {
          return -1
        }

        const poolAHealthFactor = getHealthFactor(poolA)
        const poolBHealthFactor = getHealthFactor(poolB)

        // Pool with better health factor will be prioritized higher
        if (poolAHealthFactor.greaterThan(poolBHealthFactor)) {
          return -1
        }

        if (poolAHealthFactor.lessThan(poolBHealthFactor)) {
          return 1
        }

        return 0
      }

      const poolASubgraphData = transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]
      const poolBSubgraphData = transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]

      const feeA = poolASubgraphData?.oneDayFeeUSD
        ? poolASubgraphData?.oneDayFeeUSD
        : poolASubgraphData?.oneDayFeeUntracked

      const feeB = poolBSubgraphData?.oneDayFeeUSD
        ? poolBSubgraphData?.oneDayFeeUSD
        : poolBSubgraphData?.oneDayFeeUntracked

      switch (sortedColumn) {
        case SORT_FIELD.LIQ:
          return parseFloat(poolA?.amp.toString() || '0') * parseFloat(poolASubgraphData?.reserveUSD) >
            parseFloat(poolB?.amp.toString() || '0') * parseFloat(poolBSubgraphData?.reserveUSD)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.VOL:
          const volumeA = poolASubgraphData?.oneDayVolumeUSD
            ? poolASubgraphData?.oneDayVolumeUSD
            : poolASubgraphData?.oneDayVolumeUntracked

          const volumeB = poolBSubgraphData?.oneDayVolumeUSD
            ? poolBSubgraphData?.oneDayVolumeUSD
            : poolBSubgraphData?.oneDayVolumeUntracked

          return parseFloat(volumeA) > parseFloat(volumeB)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.FEES:
          return parseFloat(feeA) > parseFloat(feeB) ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.ONE_YEAR_FL:
          const oneYearFLPoolA = getTradingFeeAPR(poolASubgraphData?.reserveUSD, feeA)
          const oneYearFLPoolB = getTradingFeeAPR(poolBSubgraphData?.reserveUSD, feeB)

          return oneYearFLPoolA > oneYearFLPoolB ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        default:
          break
      }

      return 0
    },
    [sortDirection, sortedColumn, transformedSubgraphPoolsData]
  )

  const renderHeader = () => {
    return above1000 ? (
      <TableHeader>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>
            <Trans>Token Pair</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>
            <Trans>Pool | AMP</Trans>
          </ClickableText>
          <InfoHelper text={AMP_HINT} />
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.LIQ)
              setSortDirection(sortedColumn !== SORT_FIELD.LIQ ? true : !sortDirection)
            }}
          >
            <Trans>AMP LIQUIDITY</Trans>
            <InfoHelper
              text={t`AMP factor x Liquidity in the pool. Amplified pools have higher capital efficiency and liquidity.`}
            />
            <span style={{ marginLeft: '0.25rem' }}>|</span>
            <span style={{ marginLeft: '0.25rem' }}>TVL</span>
            {sortedColumn === SORT_FIELD.LIQ ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.ONE_YEAR_FL)
              setSortDirection(sortedColumn !== SORT_FIELD.ONE_YEAR_FL ? true : !sortDirection)
            }}
          >
            <Trans>APR</Trans>
            {sortedColumn === SORT_FIELD.ONE_YEAR_FL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
          <InfoHelper text={t`Estimated return based on yearly fees of the pool`} />
        </Flex>
        <Flex alignItems="center">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
          >
            <Trans>Volume (24h)</Trans>
            {sortedColumn === SORT_FIELD.VOL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.FEES)
              setSortDirection(sortedColumn !== SORT_FIELD.FEES ? true : !sortDirection)
            }}
          >
            <Trans>Fee (24h)</Trans>
            {sortedColumn === SORT_FIELD.FEES ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>My liquidity</Trans>
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>Add liquidity</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const [currentPage, setCurrentPage] = useState(1)
  const maxPage =
    poolList.length % ITEM_PER_PAGE === 0
      ? poolList.length / ITEM_PER_PAGE
      : Math.floor(poolList.length / ITEM_PER_PAGE) + 1

  const sortedPoolList = useMemo(() => {
    return [...poolList].sort(listComparator)
  }, [poolList, listComparator])

  const sortedPoolObject = useMemo(() => {
    const res = new Map<string, Pair[]>()
    sortedPoolList.forEach(pair => {
      if (!pair) return
      const key = pair.token0.address + '-' + pair.token1.address
      const prevValue = res.get(key)
      res.set(key, (prevValue ?? []).concat(pair))
    })
    return res
  }, [sortedPoolList])

  const sortedAndPaginatedPoolObjectToList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEM_PER_PAGE
    const endIndex = currentPage * ITEM_PER_PAGE
    const res = Array.from(sortedPoolObject, ([, pools]) => pools[0]).slice(startIndex, endIndex)
    return res
  }, [currentPage, sortedPoolObject])

  const [expandFamiliarPoolKey, setExpandFamiliarPoolKey] = useState('')

  const onPrev = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const onNext = () => setCurrentPage(prev => Math.min(maxPage, prev + 1))

  const onUpdateExpandFamiliarPoolKey = (key: string) => {
    setExpandFamiliarPoolKey(prev => (prev === key ? '' : key))
  }

  return (
    <div>
      {renderHeader()}
      {sortedAndPaginatedPoolObjectToList.map(pool => {
        if (pool) {
          const poolKey = pool.token0.address + '-' + pool.token1.address
          return above1000 ? (
            <ListItemWrapper
              key={pool.address}
              poolObject={sortedPoolObject}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData}
              myLiquidity={transformedUserLiquidityPositions}
              isShowExpandFamiliarPools={expandFamiliarPoolKey === poolKey}
              onUpdateExpandFamiliarPoolKey={onUpdateExpandFamiliarPoolKey}
            />
          ) : (
            <ItemCard
              key={pool.address}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData}
              myLiquidity={transformedUserLiquidityPositions}
              isShowExpandFamiliarPools={expandFamiliarPoolKey === poolKey}
            />
          )
        }

        return null
      })}
      <Pagination>
        <ClickableText>
          <ArrowLeft size={16} color={theme.primary} onClick={onPrev} />
        </ClickableText>
        <PaginationText>
          Page {currentPage} of {maxPage}
        </PaginationText>
        <ClickableText>
          <ArrowRight size={16} color={theme.primary} onClick={onNext} />
        </ClickableText>
      </Pagination>
      <PoolDetailModal />
    </div>
  )
}

export default PoolList
