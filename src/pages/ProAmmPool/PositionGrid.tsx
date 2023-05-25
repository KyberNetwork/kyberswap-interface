import { gql, useQuery } from '@apollo/client'
import { Interface } from 'ethers/lib/utils'
import memoizeOne from 'memoize-one'
import React, { CSSProperties, ComponentType, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeGrid as FixedSizeGridRW, GridChildComponentProps, areEqual } from 'react-window'
import styled from 'styled-components'

import TickReaderABI from 'constants/abis/v2/ProAmmTickReader.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useMulticallContract } from 'hooks/useContract'
import { useKyberSwapConfig } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

import PositionListItem from './PositionListItem'

const FixedSizeGrid = styled(FixedSizeGridRW)`
  overflow-x: hidden !important;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 4px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
    margin: 8px 0;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border};
    border-radius: 999px;
  }
`
export const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(392px, auto) minmax(392px, auto) minmax(392px, auto);
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
    max-width: 832px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    max-width: 392px;
  `};
`

const tickReaderInterface = new Interface(TickReaderABI.abi)

const queryPositionLastCollectedTimes = gql`
  query positions($ids: [String]!) {
    positions(where: { id_in: $ids }) {
      id
      createdAtTimestamp
      lastCollectedFeeAt
      lastHarvestedFarmRewardAt
    }
  }
`

function PositionGrid({
  positions,
  refe,
  activeFarmAddress,
}: {
  positions: PositionDetails[]
  refe?: React.MutableRefObject<any>
  activeFarmAddress: string[]
}) {
  const { isEVM, networkInfo, chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()
  const { elasticClient } = useKyberSwapConfig(chainId)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  // raw
  const [feeRewards, setFeeRewards] = useState<{
    [tokenId: string]: [string, string]
  }>(() => positions.reduce((acc, item) => ({ ...acc, [item.tokenId.toString()]: ['0', '0'] }), {}))

  const positionIds = useMemo(() => positions.map(pos => pos.tokenId.toString()), [positions])
  const { data } = useQuery(queryPositionLastCollectedTimes, {
    client: elasticClient,
    variables: {
      ids: positionIds,
    },
    fetchPolicy: 'cache-first',
    skip: !isEVM || !positionIds.length,
  })

  const liquidityTimes = useMemo(
    () =>
      data?.positions.reduce((acc: { [id: string]: number }, item: { id: string; lastCollectedFeeAt: string }) => {
        return {
          ...acc,
          [item.id]: Date.now() / 1000 - Number(item.lastCollectedFeeAt), // seconds
        }
      }, {}),
    [data?.positions],
  )

  const farmingTimes = useMemo(
    () =>
      data?.positions.reduce(
        (acc: { [id: string]: number }, item: { id: string; lastHarvestedFarmRewardAt?: string }) => {
          return {
            ...acc,
            [item.id]: item?.lastHarvestedFarmRewardAt ? Date.now() / 1000 - Number(item.lastHarvestedFarmRewardAt) : 0, // seconds
          }
        },
        {},
      ),
    [data?.positions],
  )

  const createdAts = useMemo(
    () =>
      data?.positions.reduce((acc: { [id: string]: number }, item: { id: string; createdAtTimestamp: string }) => {
        return {
          ...acc,
          [item.id]: Number(item.createdAtTimestamp), // seconds
        }
      }, {}),
    [data],
  )

  const getPositionFee = useCallback(async () => {
    if (!multicallContract) return
    const fragment = tickReaderInterface.getFunction('getTotalFeesOwedToPosition')
    const callParams = positions.map(item => {
      return {
        target: (networkInfo as EVMNetworkInfo).elastic.tickReader,
        callData: tickReaderInterface.encodeFunctionData(fragment, [
          (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
          item.poolId,
          item.tokenId,
        ]),
      }
    })

    const { returnData } = await multicallContract?.callStatic.tryBlockAndAggregate(false, callParams)
    setFeeRewards(
      returnData.reduce(
        (
          acc: { [tokenId: string]: [string, string] },
          item: { success: boolean; returnData: string },
          index: number,
        ) => {
          if (item.success) {
            const tmp = tickReaderInterface.decodeFunctionResult(fragment, item.returnData)
            return {
              ...acc,
              [positions[index].tokenId.toString()]: [tmp.token0Owed.toString(), tmp.token1Owed.toString()],
            }
          }
          return { ...acc, [positions[index].tokenId.toString()]: ['0', '0'] }
        },
        {} as { [tokenId: string]: [string, string] },
      ),
    )
  }, [multicallContract, positions, networkInfo])

  useEffect(() => {
    getPositionFee()
  }, [getPositionFee])

  const itemData = createItemData(
    positions,
    activeFarmAddress,
    liquidityTimes,
    farmingTimes,
    feeRewards,
    createdAts,
    refe,
  )

  const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3
  return (
    <FixedSizeGrid
      style={{ width: '100%', height: 'calc(100vh - 200px)' }}
      width={10000}
      columnCount={columnCount}
      rowCount={Math.ceil(positions.length / columnCount)}
      height={0}
      columnWidth={upToSmall ? 368 : 392}
      rowHeight={630}
      itemData={itemData}
    >
      {Row as ComponentType<GridChildComponentProps<unknown>>}
    </FixedSizeGrid>
  )
}

interface RowData {
  positions: PositionDetails[]
  refe?: React.MutableRefObject<any>
  activeFarmAddress: string[]
  liquidityTimes: { [key: string]: number }
  farmingTimes: { [key: string]: number }
  feeRewards: { [key: string]: [string, string] }
  createdAts: { [key: string]: number }
}

const createItemData = memoizeOne(
  (positions, activeFarmAddress, liquidityTimes, farmingTimes, feeRewards, createdAts, refe) => ({
    positions,
    activeFarmAddress,
    liquidityTimes,
    farmingTimes,
    feeRewards,
    createdAts,
    refe,
  }),
)

const Row = memo(
  ({
    data,
    rowIndex,
    columnIndex,
    style,
  }: {
    rowIndex: number
    columnIndex: number
    style: CSSProperties
    data: RowData
  }) => {
    const { positions, refe, feeRewards, liquidityTimes, farmingTimes, createdAts, activeFarmAddress } = data
    const styles = {
      ...style,
      left: columnIndex === 0 ? style.left : Number(style.left) + columnIndex * 24,
      right: columnIndex === 3 ? style.right : Number(style.right) + columnIndex * 24,
    }

    const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
    const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
    const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3

    const index = rowIndex * columnCount + columnIndex
    const p = positions[index]
    if (!p) return <div />

    return (
      <div style={styles} key={p.tokenId.toString()}>
        <PositionListItem
          refe={refe}
          positionDetails={p}
          rawFeeRewards={feeRewards[p.tokenId.toString()] || ['0', '0']}
          liquidityTime={liquidityTimes?.[p.tokenId.toString()]}
          farmingTime={farmingTimes?.[p.tokenId.toString()]}
          createdAt={createdAts?.[p.tokenId.toString()]}
          hasUserDepositedInFarm={!!p.stakedLiquidity}
          hasActiveFarm={activeFarmAddress.includes(p.poolId.toLowerCase())}
        />
      </div>
    )
  },
  areEqual,
)

Row.displayName = 'RowItem'

export default PositionGrid
