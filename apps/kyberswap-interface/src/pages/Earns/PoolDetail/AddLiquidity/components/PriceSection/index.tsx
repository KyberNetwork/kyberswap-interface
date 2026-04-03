import { Pool, PoolType } from '@kyber/schema'

import { HStack, Stack } from 'components/Stack'
import LiquidityChart from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/LiquidityChart'
import PriceInfo from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/PriceInfo'
import PriceInput, { PriceInputType } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/PriceInput'
import RangePresetSelector from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/RangePresetSelector'

interface PriceSectionProps {
  context: {
    chainId: number
    poolType: PoolType
    pool: Pool
  }
  value: {
    poolPrice: number | null
    revertPrice: boolean
    minPrice: string | null
    maxPrice: string | null
    tickLower: number | null
    tickUpper: number | null
  }
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onRevertPriceToggle?: () => void
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

const PriceSection = ({
  context,
  value,
  onTrackEvent,
  onRevertPriceToggle,
  onTickLowerChange,
  onTickUpperChange,
}: PriceSectionProps) => {
  return (
    <Stack gap={16}>
      <PriceInfo
        pool={context.pool}
        poolPrice={value.poolPrice}
        revertPrice={value.revertPrice}
        onRevertPriceToggle={onRevertPriceToggle}
      />

      <Stack gap={20}>
        <LiquidityChart
          pool={context.pool}
          poolPrice={value.poolPrice}
          minPrice={value.minPrice}
          maxPrice={value.maxPrice}
          revertPrice={value.revertPrice}
          tickLower={value.tickLower}
          tickUpper={value.tickUpper}
          onTickLowerChange={onTickLowerChange}
          onTickUpperChange={onTickUpperChange}
        />

        <RangePresetSelector
          chainId={context.chainId}
          poolType={context.poolType}
          pool={context.pool}
          poolPrice={value.poolPrice}
          revertPrice={value.revertPrice}
          tickLower={value.tickLower}
          tickUpper={value.tickUpper}
          onTrackEvent={onTrackEvent}
          onTickLowerChange={onTickLowerChange}
          onTickUpperChange={onTickUpperChange}
        />
      </Stack>

      <HStack gap={12}>
        <PriceInput
          type={PriceInputType.MinPrice}
          chainId={context.chainId}
          poolType={context.poolType}
          pool={context.pool}
          poolPrice={value.poolPrice}
          revertPrice={value.revertPrice}
          tickLower={value.tickLower}
          tickUpper={value.tickUpper}
          minPrice={value.minPrice}
          maxPrice={value.maxPrice}
          onTrackEvent={onTrackEvent}
          onTickLowerChange={onTickLowerChange}
          onTickUpperChange={onTickUpperChange}
        />
        <PriceInput
          type={PriceInputType.MaxPrice}
          chainId={context.chainId}
          poolType={context.poolType}
          pool={context.pool}
          poolPrice={value.poolPrice}
          revertPrice={value.revertPrice}
          tickLower={value.tickLower}
          tickUpper={value.tickUpper}
          minPrice={value.minPrice}
          maxPrice={value.maxPrice}
          onTrackEvent={onTrackEvent}
          onTickLowerChange={onTickLowerChange}
          onTickUpperChange={onTickUpperChange}
        />
      </HStack>
    </Stack>
  )
}

export default PriceSection
