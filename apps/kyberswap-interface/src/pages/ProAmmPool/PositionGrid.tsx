import { gql, useQuery } from '@apollo/client'
import { useScroll } from '@use-gesture/react'
import memoizeOne from 'memoize-one'
import React, { CSSProperties, ComponentType, forwardRef, memo, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeGrid as FixedSizeGridRW, GridChildComponentProps, areEqual } from 'react-window'
import styled from 'styled-components'

import { useActiveWeb3React } from 'hooks'
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

function PositionGrid({ positions, refe }: { positions: PositionDetails[]; refe?: React.MutableRefObject<any> }) {
  const { chainId } = useActiveWeb3React()
  const { elasticClient } = useKyberSwapConfig(chainId)

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const positionIds = useMemo(() => positions.map(pos => pos.tokenId.toString()), [positions])
  const { data } = useQuery(queryPositionLastCollectedTimes, {
    client: elasticClient,
    variables: {
      ids: positionIds,
    },
    fetchPolicy: 'cache-first',
    skip: !positionIds.length,
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

  // TODO: Temporary hardcoded fee to 0
  // const rewardRes = useSingleContractMultipleData(
  //   tickReaderContract,
  //   'getTotalFeesOwedToPosition',
  //   positions.map(item => [networkInfo.elastic.nonfungiblePositionManager, item.poolId, item.tokenId]),
  // )

  const feeRewards = useMemo(() => {
    return positions.reduce<{ [tokenId: string]: [string, string] }>((acc, item, _index) => {
      return {
        ...acc,
        [item.tokenId.toString()]: ['0', '0'],
        // rewardRes[index].result
        //   ? [
        //       rewardRes[index].result?.token0Owed?.toString() || '0',
        //       rewardRes[index].result?.token1Owed.toString() || '0',
        //     ]
        //   : ['0', '0'] ,
      }
    }, {})
  }, [positions])

  const itemData = createItemData(positions, liquidityTimes, farmingTimes, feeRewards, createdAts, refe)

  const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3
  return (
    <FixedSizeGrid
      width={10000}
      columnCount={columnCount}
      outerElementType={outerElementType}
      rowCount={Math.ceil(positions.length / columnCount)}
      height={1260}
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
  liquidityTimes: { [key: string]: number }
  farmingTimes: { [key: string]: number }
  feeRewards: { [key: string]: [string, string] }
  createdAts: { [key: string]: number }
}

const createItemData = memoizeOne((positions, liquidityTimes, farmingTimes, feeRewards, createdAts, refe) => ({
  positions,
  liquidityTimes,
  farmingTimes,
  feeRewards,
  createdAts,
  refe,
}))

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
    const { positions, refe, feeRewards, liquidityTimes, farmingTimes, createdAts } = data

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
        />
      </div>
    )
  },
  areEqual,
)

Row.displayName = 'RowItem'

const emptyFunction = (): void => {
  return
}

type DocumentPropsType = React.HTMLProps<HTMLElement>

export const outerElementType = forwardRef<HTMLElement, DocumentPropsType>(({ onScroll, children }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null)
  useScroll(
    () => {
      if (!(onScroll instanceof Function)) {
        return
      }

      const { clientWidth, clientHeight, scrollLeft, scrollTop, scrollHeight, scrollWidth } = document.documentElement

      onScroll({
        currentTarget: {
          clientHeight,
          clientWidth,
          scrollLeft,
          addEventListener: emptyFunction,
          removeEventListener: emptyFunction,
          dispatchEvent: () => false,
          scrollTop:
            scrollTop - (containerRef.current ? containerRef.current.getBoundingClientRect().top + scrollTop : 0),
          scrollHeight,
          scrollWidth,
        },
      } as unknown as React.UIEvent<HTMLElement>)
    },
    { target: window },
  )

  if (forwardedRef != null && !(forwardedRef instanceof Function)) {
    forwardedRef.current = document.documentElement
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {children}
    </div>
  )
})

outerElementType.displayName = 'outerElementType'

export default PositionGrid
