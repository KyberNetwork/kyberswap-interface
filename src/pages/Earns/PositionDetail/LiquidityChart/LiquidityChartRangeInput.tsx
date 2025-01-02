import { format } from 'd3'
import { useCallback, useMemo } from 'react'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

import { Chart } from './components/Chart'
import { InfoBox } from './components/InfoBox'
import Loader from './components/Loader'
import { Bound, ChartEntry, TickDataRaw, ZOOM_LEVELS, ZoomLevels } from './types'

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 13rem;
  gap: 1rem;
  width: 100%;
  margin-top: 8px;
`

const ChartWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76%;
`

export default function LiquidityChartRangeInput({
  feeAmount,
  ticksAtLimit = {},
  price,
  priceLower,
  priceUpper,
  isLoading,
  error,
  zoomLevel,
  formattedData,
  isUninitialized,
  revertPrice,
}: {
  tickCurrent?: number
  liquidity?: bigint
  isLoading?: boolean
  error?: Error
  feeAmount?: number
  ticks?: TickDataRaw[]
  ticksAtLimit?: { [bound in Bound]?: boolean }
  price?: number
  priceLower?: string
  priceUpper?: string
  zoomLevel?: ZoomLevels
  formattedData: ChartEntry[] | undefined
  isUninitialized: boolean
  revertPrice: boolean
}) {
  const theme = useTheme()
  const isSorted = !revertPrice

  const brushDomain: [number, number] | undefined = useMemo(() => {
    if (!priceLower || !priceUpper) return undefined

    const leftPrice = !revertPrice ? priceLower : 1 / parseFloat(priceUpper)
    const rightPrice = !revertPrice ? priceUpper : 1 / parseFloat(priceLower)

    if (leftPrice && rightPrice) {
      const sortedPrices = [
        parseFloat(leftPrice.toString().replace(/,/g, '')),
        parseFloat(rightPrice.toString().replace(/,/g, '')),
      ].sort((a, b) => a - b)
      return sortedPrices.length === 2 ? (sortedPrices as [number, number]) : undefined
    }
    return undefined
  }, [priceLower, priceUpper, revertPrice])

  // console.log('brushDomain', brushDomain)

  const onBrushDomainChangeEnded = useCallback((_domain: [number, number], _mode: string | undefined) => {}, [])

  const brushLabelValue = useCallback(
    (d: 'w' | 'e', x: number) => {
      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },
    [isSorted, price, ticksAtLimit],
  )

  return (
    <Container>
      {isUninitialized ? (
        <InfoBox message={'Your position will appear here.'} icon={<div></div>} />
      ) : isLoading ? (
        <InfoBox icon={<Loader size="40px" stroke={theme.text} />} />
      ) : error ? (
        <InfoBox message={'Liquidity data not available.'} icon={<div></div>} />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox message={'There is no liquidity data.'} icon={<div></div>} />
      ) : (
        <ChartWrapper>
          <Chart
            key={`${feeAmount ?? 2500}`}
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={zoomLevel ?? ZOOM_LEVELS[feeAmount as keyof typeof ZOOM_LEVELS]}
            ticksAtLimit={ticksAtLimit}
          />
        </ChartWrapper>
      )}
    </Container>
  )
}
