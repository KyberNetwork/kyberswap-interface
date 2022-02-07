import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Pair } from '@dynamic-amm/sdk'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { getHealthFactor, getTradingFeeAPR } from 'utils/dmm'
import ListItem, { ItemCard } from './ListItem'
import PoolDetailModal from './PoolDetailModal'
import { AMP_HINT } from 'constants/index'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 18px 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.evenRow};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
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

interface PoolListProps {
  poolsList: (Pair | null)[]
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

const PoolList = ({ poolsList, subgraphPoolsData, userLiquidityPositions }: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')

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

  const pools = useMemo(() => {
    return [...poolsList].sort(listComparator)
  }, [poolsList, listComparator])

  // const poolsObject = poolsList.reduce((acc: { [p: string]: number }, value) => {
  //   if (value === null) return acc
  //
  //   const key = value.token0.address + '-' + value.token1.address
  //   return {
  //     ...acc,
  //     [key]: (acc[key] ?? 0) + 1
  //   }
  // }, {})

  // console.log(`poolsObject`, Object.keys(poolsObject).length)

  const [activePairId, setActivePairId] = useState(
    '0xc1c93D475dc82Fe72DBC7074d55f5a734F8cEEAE-0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
  )

  console.log(`I'm here: `)

  return (
    <div>
      {renderHeader()}
      {pools.map(pool => {
        if (pool) {
          return above1000 ? (
            <ListItem
              key={pool.address}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData[pool.address.toLowerCase()]}
              myLiquidity={transformedUserLiquidityPositions[pool.address.toLowerCase()]}
              active={activePairId === pool.token0.address + '-' + pool.token1.address}
            />
          ) : (
            <ItemCard
              key={pool.address}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData[pool.address.toLowerCase()]}
              myLiquidity={transformedUserLiquidityPositions[pool.address.toLowerCase()]}
              active={activePairId === pool.token0.address + '-' + pool.token1.address}
            />
          )
        }

        return null
      })}
      <PoolDetailModal />
    </div>
  )
}

export default PoolList
