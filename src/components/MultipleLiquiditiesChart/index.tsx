import { Currency, Price, Token } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { format, index } from 'd3'
import { saturate } from 'polished'
import { CSSProperties, ReactNode, useCallback, useMemo, useState } from 'react'
import { BarChart2, Inbox } from 'react-feather'
import { batch } from 'react-redux'
import { Text } from 'rebass'
import styled from 'styled-components'

import { AutoColumn, ColumnCenter } from 'components/Column'
import WarningIcon from 'components/LiveChart/WarningIcon'
import Loader from 'components/Loader'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { useProAmmDerivedAllMintInfo, useProAmmMintState } from 'state/mint/proamm/hooks'
import { Bound } from 'state/mint/proamm/type'

import { Chart } from './Chart'
import { useDensityChartData } from './hooks'
import { ZoomLevels } from './types'

const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.STABLE]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.LOWEST]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
}

const ChartWrapper = styled.div`
  position: relative;

  justify-content: center;
  align-content: center;
`

function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <ColumnCenter style={{ height: '100%', justifyContent: 'center' }}>
      {icon}
      {message && (
        <Text padding={10} marginTop="20px" textAlign="center">
          {message}
        </Text>
      )}
    </ColumnCenter>
  )
}

export default function MultipleLiquiditiesChart({
  rotated,
  positions,
  positionIndex,
  ticksAtLimits,
}: {
  rotated: boolean
  positions: Position[]
  positionIndex: number
  ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  }
}) {
  const pIndex = positionIndex >= positions.length ? positions.length - 1 : positionIndex
  const currentPosition = positions[pIndex]
  const [tokenA, tokenB] = rotated
    ? [positions[0].amount1.currency, positions[0].amount0.currency]
    : [positions[0].amount0.currency, positions[0].amount1.currency]

  const theme = useTheme()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  return 0
  // const tokenAColor = useColor(tokenA?.wrapped)
  // const tokenBColor = useColor(tokenB?.wrapped)

  // const isSorted = tokenA && tokenB && tokenA?.wrapped.sortsBefore(tokenB?.wrapped)

  // const { isLoading, isUninitialized, isError, formattedData } = useDensityChartData({
  //   currencyA: tokenA,
  //   currencyB: tokenB,
  //   feeAmount: positions[0].pool.fee,
  // })

  // const brushDomain: [number, number] | undefined = useMemo(() => {
  //   return leftPrice && rightPrice
  //     ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
  //     : undefined
  // }, [leftPrice, rightPrice])

  // const brushLabelValue = useCallback(
  //   (d: 'w' | 'e', x: number) => {
  //     if (!price) return ''

  //     if (d === 'w' && ticksAtLimits[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
  //     if (d === 'e' && ticksAtLimits[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

  //     const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

  //     return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
  //   },
  //   [isSorted, price, ticksAtLimits],
  // )

  // const viewBoxWidth = useMemo(() => {
  //   if (!height) return 400
  //   if (ref?.clientWidth) return ref.clientWidth * 0.8
  //   return 400
  // }, [height, ref])

  // return (
  //   <AutoColumn ref={newRef => setRef(newRef)} gap="md" style={{ minHeight: '237px', ...style }}>
  //     {isUninitialized ? (
  //       <InfoBox
  //         message={<Trans>Your position will appear here.</Trans>}
  //         icon={<Inbox size={56} stroke={theme.text} />}
  //       />
  //     ) : isLoading ? (
  //       <InfoBox icon={<Loader size="40px" stroke={theme.subText} />} />
  //     ) : isError ? (
  //       <InfoBox message={<Trans>Liquidity data not available.</Trans>} icon={<WarningIcon />} />
  //     ) : !formattedData?.length || !price ? (
  //       <InfoBox
  //         message={<Trans>There is no liquidity data.</Trans>}
  //         icon={<BarChart2 size={56} stroke={theme.subText} />}
  //       />
  //     ) : (
  //       <ChartWrapper>
  //         <Chart
  //           data={{ series: formattedData, current: price }}
  //           dimensions={{ viewBoxWidth, height }}
  //           margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
  //           styles={{
  //             area: {
  //               selection: theme.blue1,
  //             },
  //             brush: {
  //               handle: {
  //                 west: saturate(0.1, tokenAColor) ?? theme.red1,
  //                 east: saturate(0.1, tokenBColor) ?? theme.blue1,
  //               },
  //             },
  //           }}
  //           brushLabels={brushLabelValue}
  //           brushDomain={brushDomain}
  //           zoomLevels={ZOOM_LEVELS[feeAmount ?? FeeAmount.MEDIUM]}
  //           ticksAtLimits={ticksAtLimits}
  //         />
  //       </ChartWrapper>
  //     )}
  //   </AutoColumn>
  // )
}
