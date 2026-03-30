import { useMedia } from 'react-use'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'

const RoutePreviewSkeleton = () => {
  return (
    <HStack width="100%" align="center" justify="space-between" gap={24}>
      <PositionSkeleton width={240} height={66} />
      <PositionSkeleton width={120} height={36} />
      <PositionSkeleton width={240} height={66} />
    </HStack>
  )
}

const PoolInformationSkeleton = () => {
  const theme = useTheme()

  return (
    <Stack width="100%" gap={20} p={16} borderRadius={12} background={theme.background}>
      <Stack gap={12}>
        <HStack gap={24} wrap="wrap">
          <PositionSkeleton width={96} height={18} />
          <PositionSkeleton width={96} height={18} />
          <PositionSkeleton width={96} height={18} />
        </HStack>

        <HStack gap={16} wrap="wrap">
          {Array.from({ length: 4 }).map((_, index) => (
            <Stack key={index} flex="1 1 160px" gap={10} p={12} borderRadius={16} background={theme.buttonGray}>
              <PositionSkeleton width={80} height={16} />
              <PositionSkeleton width={120} height={16} />
            </Stack>
          ))}
        </HStack>
      </Stack>

      <Stack gap={16}>
        <Stack gap={12}>
          <PositionSkeleton width={320} height={16} />
          <PositionSkeleton width={180} height={18} />
        </Stack>

        <PoolChartSkeleton />
      </Stack>
    </Stack>
  )
}

const PoolHeaderSkeleton = () => {
  return (
    <HStack align="center" gap={12} wrap="wrap" width="100%">
      <PositionSkeleton width={34.5} height={34.5} />
      <HStack align="center">
        <PositionSkeleton width={28} height={28} />
        <PositionSkeleton width={28} height={28} />
      </HStack>
      <PositionSkeleton width={160} height={28} />
      <PositionSkeleton width={160} height={32} />
      <PositionSkeleton width={60} height={32} />
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
      </PoolDetailWrapper>
    )
  }

  return (
    <PoolDetailWrapper>
      <PoolHeaderSkeleton />

      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack flex="1 1 480px" maxWidth="480px" minWidth={0} gap={16}>
          <AddLiquidityWidgetSkeleton />
        </Stack>

        <Stack flex="1 1 480px" gap={24} minWidth={0}>
          <RoutePreviewSkeleton />
          <PoolInformationSkeleton />
        </Stack>
      </HStack>
    </PoolDetailWrapper>
  )
}

export default PoolDetailPageSkeleton
