import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { LiquidityChartSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/LiquidityChart'
import { TokenAmountInputSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'

const AddLiquidityWidgetSkeleton = () => {
  return (
    <Stack className="w-full gap-4 rounded-xl bg-background p-4">
      <Stack className="gap-3">
        <HStack className="items-center justify-between">
          <Skeleton width={120} height={24} />
          <Skeleton width={32} height={32} circle />
        </HStack>

        <TokenAmountInputSkeleton />

        <Stack className="gap-3">
          <HStack className="justify-end">
            <Skeleton width={160} height={16} />
          </HStack>
          <Skeleton width={220} height={20} />
        </Stack>
      </Stack>

      <Stack className="gap-4">
        <Skeleton width="100%" height={42} />
        <Stack className="gap-[22px]">
          <LiquidityChartSkeleton />
          <Skeleton width="100%" height={36} />
        </Stack>
        <HStack className="w-full gap-6">
          <Stack className="min-w-0 flex-[1_1_0]">
            <Skeleton width="100%" height={44} />
          </Stack>
          <Stack className="min-w-0 flex-[1_1_0]">
            <Skeleton width="100%" height={44} />
          </Stack>
        </HStack>
      </Stack>

      <Stack className="gap-4">
        <Skeleton width="100%" height={38} />
        <Stack className="gap-3 rounded-xl border border-buttonGray p-2">
          <Skeleton width={160} height={20} />
          <Skeleton width={240} height={20} />
          <Skeleton width={160} height={20} />
        </Stack>
        <Skeleton width="100%" height={44} borderRadius={22} />
      </Stack>
    </Stack>
  )
}

export default AddLiquidityWidgetSkeleton
