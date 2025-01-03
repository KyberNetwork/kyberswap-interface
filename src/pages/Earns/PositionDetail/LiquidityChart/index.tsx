import { usePoolDetailQuery } from 'services/poolService'

import LiquidityChartRangeInput from './LiquidityChartRangeInput'
import { useDensityChartData } from './hooks'

const LiquidityChart = ({
  chainId,
  poolAddress,
  price,
  minPrice,
  maxPrice,
  revertPrice,
}: {
  chainId: number
  poolAddress: string
  price: number
  minPrice: number
  maxPrice: number
  revertPrice: boolean
}) => {
  const { data: pool } = usePoolDetailQuery({ chainId, ids: poolAddress })
  const chartData = useDensityChartData({ pool, revertPrice })

  const isUninitialized = !pool || Object.keys(pool).length === 0
  const tickSpacing = isUninitialized ? undefined : pool.positionInfo.tickSpacing
  const fee = isUninitialized ? undefined : pool.swapFee * 10_000

  if (!tickSpacing) return null

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      isUninitialized={isUninitialized}
      feeAmount={fee}
      price={price ? parseFloat(price.toFixed(8)) : undefined}
      priceLower={minPrice.toString() || undefined}
      priceUpper={maxPrice.toString() || undefined}
      formattedData={chartData}
      isLoading={false}
      error={undefined}
      revertPrice={revertPrice}
    />
  )
}

export default LiquidityChart
