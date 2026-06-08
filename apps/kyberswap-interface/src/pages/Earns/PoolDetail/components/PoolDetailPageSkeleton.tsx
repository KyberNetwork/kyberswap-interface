import { useMedia } from 'react-use'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { MEDIA_WIDTHS } from 'theme'

const RoutePreviewSkeleton = () => {
  return (
    <HStack className="w-full items-center justify-between gap-6">
      <Skeleton width={240} height={66} />
      <Skeleton width={160} height={95} />
      <Skeleton width={240} height={66} />
    </HStack>
  )
}

const PoolInformationSkeleton = () => {
  return (
    <Stack className="w-full gap-5 rounded-xl bg-background p-4">
      <Stack className="gap-8">
        <HStack className="flex-wrap gap-6">
          <Skeleton width={96} height={24} />
          <Skeleton width={96} height={24} />
          <Skeleton width={96} height={24} />
        </HStack>

        <HStack className="flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Stack key={index} className="flex-[1_1_160px] gap-2 rounded-2xl bg-buttonGray p-4">
              <Skeleton width={80} height={16} />
              <Skeleton width={120} height={16} />
            </Stack>
          ))}
        </HStack>
      </Stack>

      <Stack className="gap-4">
        <Stack className="gap-3">
          <Skeleton width={200} height={16} />
          <Skeleton width={320} height={20} />
        </Stack>

        <PoolChartSkeleton type="line" />
      </Stack>
    </Stack>
  )
}

const PoolHeaderSkeleton = () => {
  return (
    <HStack className="w-full flex-wrap items-center gap-3">
      <Skeleton width={36} height={36} circle />
      <HStack className="items-center">
        <Skeleton width={28} height={28} circle />
        <Skeleton width={28} height={28} circle />
      </HStack>
      <Skeleton width={160} height={28} />
      <Skeleton width={160} height={28} />
    </HStack>
  )
}

const PoolDetailPageSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  if (upToSmall) {
    return (
      <PoolDetailWrapper>
        <PoolHeaderSkeleton />
        <AddLiquidityWidgetSkeleton />
        <PoolInformationSkeleton />
        <RoutePreviewSkeleton />
      </PoolDetailWrapper>
    )
  }

  return (
    <PoolDetailWrapper>
      <PoolHeaderSkeleton />

      <HStack className="w-full flex-wrap items-start gap-6">
        <Stack className="min-w-0 flex-[1_1_480px] gap-6">
          <PoolInformationSkeleton />
          <RoutePreviewSkeleton />
        </Stack>

        <Stack className="min-w-0 max-w-[480px] flex-[1_1_480px] gap-4">
          <AddLiquidityWidgetSkeleton />
        </Stack>
      </HStack>
    </PoolDetailWrapper>
  )
}

export default PoolDetailPageSkeleton
