import { useMedia } from 'react-use'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import { MEDIA_WIDTHS } from 'theme'

const RoutePreviewSkeleton = () => {
  return (
    <HStack width="100%" align="center" justify="space-between" gap={24}>
      <Skeleton width={240} height={66} />
      <Skeleton width={160} height={95} />
      <Skeleton width={240} height={66} />
    </HStack>
  )
}

const PoolInformationSkeleton = () => {
  const theme = useTheme()

  return (
    <Stack width="100%" gap={20} p={16} borderRadius={12} background={theme.background}>
      <Stack gap={30}>
        <HStack gap={24} wrap="wrap">
          <Skeleton width={96} height={24} />
          <Skeleton width={96} height={24} />
          <Skeleton width={96} height={24} />
        </HStack>

        <HStack gap={12} wrap="wrap">
          {Array.from({ length: 5 }).map((_, index) => (
            <Stack key={index} flex="1 1 160px" gap={8} p={16} borderRadius={16} background={theme.buttonGray}>
              <Skeleton width={80} height={16} />
              <Skeleton width={120} height={17} />
            </Stack>
          ))}
        </HStack>
      </Stack>

      <Stack gap={16}>
        <Stack gap={12}>
          <Skeleton width={200} height={18} />
          <Skeleton width={320} height={20} />
        </Stack>

        <PoolChartSkeleton type="line" />
      </Stack>
    </Stack>
  )
}

const PoolHeaderSkeleton = () => {
  return (
    <HStack align="center" gap={12} wrap="wrap" width="100%">
      <Skeleton width={36} height={36} circle />
      <HStack align="center">
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

      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack flex="1 1 480px" gap={24} minWidth={0}>
          <PoolInformationSkeleton />
          <RoutePreviewSkeleton />
        </Stack>

        <Stack flex="1 1 480px" gap={16} maxWidth="480px" minWidth={0}>
          <AddLiquidityWidgetSkeleton />
        </Stack>
      </HStack>
    </PoolDetailWrapper>
  )
}

export default PoolDetailPageSkeleton
