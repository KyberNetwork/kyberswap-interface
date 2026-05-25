import { useMedia } from 'react-use'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { LiquidityChartSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/LiquidityChart'
import { TokenAmountInputSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'
import { MEDIA_WIDTHS } from 'theme'

const AddLiquidityWidgetSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Stack className="w-full gap-4 rounded-xl bg-background p-4">
      <Stack className="gap-3">
        <HStack className="items-center justify-between">
          <Skeleton width={120} height={19} />
          <Skeleton width={32} height={32} circle />
        </HStack>

        <TokenAmountInputSkeleton />

        <Stack className="gap-3">
          <HStack className="justify-end">
            <Skeleton width={160} height={14.5} />
          </HStack>
          <Skeleton width={220} height={17} />
        </Stack>
      </Stack>

      <Stack className="gap-4">
        <Skeleton width="100%" height={42} />
        <LiquidityChartSkeleton />
        <Skeleton width="100%" height={36} />
        <HStack className="w-full gap-6">
          <Stack className="min-w-0 flex-[1_1_0]">
            <Skeleton width="100%" height={40} />
          </Stack>
          <Stack className="min-w-0 flex-[1_1_0]">
            <Skeleton width="100%" height={40} />
          </Stack>
        </HStack>
      </Stack>

      <Stack className="gap-[18.5px]">
        <Stack className="gap-4">
          <Skeleton width="100%" height={36} />
          <Skeleton width="100%" height={36} />
        </Stack>

        {!upToSmall && (
          <HStack className="justify-between gap-3 rounded-3xl bg-buttonGray p-3">
            <Skeleton width={160} height={44} />
            <Skeleton width={160} height={44} />
          </HStack>
        )}
      </Stack>
    </Stack>
  )
}

export default AddLiquidityWidgetSkeleton
