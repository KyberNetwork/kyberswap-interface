import { Pool, PoolType } from '@kyber/schema'

import { HStack, Stack } from 'components/Stack'
import LiquidityChart from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/LiquidityChart'
import PriceInfo from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/PriceInfo'
import PriceInput, { PriceInputType } from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/PriceInput'
import RangePresetSelector from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/RangePresetSelector'

interface PriceSectionProps {
  context?: {
    chainId: number
    poolType: PoolType
    pool: Pool
  }
  value?: {
    poolPrice: number | null
    revertPrice: boolean
    minPrice: string | null
    maxPrice: string | null
    tickLower: number | null
    tickUpper: number | null
    hasInitialTick: boolean
  }
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onRevertPriceToggle?: () => void
  onTickLowerChange?: (value: number) => void
  onTickUpperChange?: (value: number) => void
}

export default function PriceSection({
  context,
  value,
  onTrackEvent,
  onRevertPriceToggle,
  onTickLowerChange,
  onTickUpperChange,
}: PriceSectionProps) {
  if (!context || !value) return null

  return (
    <Stack gap={14}>
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
          hasInitialTick={value.hasInitialTick}
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
