import { useScroll } from '@use-gesture/react'
import memoizeOne from 'memoize-one'
import React, { CSSProperties, ComponentType, forwardRef, memo, useMemo, useRef } from 'react'
import { useMedia } from 'react-use'
import { FixedSizeGrid, GridChildComponentProps, areEqual } from 'react-window'

import { MEDIA_WIDTHS } from 'theme'
import { PositionDetails } from 'types/position'

import PositionListItem from './PositionListItem'

const GRID_SCROLLBAR_CLASS =
  '!overflow-x-hidden ' +
  '[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:rounded-full ' +
  '[&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border'

function PositionGrid({ positions, refe }: { positions: PositionDetails[]; refe?: React.MutableRefObject<any> }) {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const feeRewards = useMemo(() => {
    return positions.reduce<{ [tokenId: string]: [string, string] }>((acc, item) => {
      return {
        ...acc,
        [item.tokenId.toString()]: ['0', '0'],
      }
    }, {})
  }, [positions])

  const itemData = createItemData(positions, {}, {}, feeRewards, {}, refe)

  const columnCount = upToSmall ? 1 : upToLarge ? 2 : 3
  return (
    <FixedSizeGrid
      className={GRID_SCROLLBAR_CLASS}
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

export const outerElementType = forwardRef<HTMLElement, DocumentPropsType>(
  ({ onScroll, children, className, ...rest }, forwardedRef) => {
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
      <div ref={containerRef} className={className} style={{ position: 'relative' }} {...(rest as any)}>
        {children}
      </div>
    )
  },
)

outerElementType.displayName = 'outerElementType'

export default PositionGrid
