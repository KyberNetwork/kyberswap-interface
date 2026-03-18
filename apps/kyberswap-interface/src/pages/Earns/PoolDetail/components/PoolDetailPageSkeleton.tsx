import { useMedia } from 'react-use'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { MEDIA_WIDTHS } from 'theme'

const RoutePreviewSkeleton = () => {
  return (
    <HStack width="100%" alignItems="center" justifyContent="space-between">
      <PositionSkeleton width={240} height={68} />
      <PositionSkeleton width={120} height={36} />
      <PositionSkeleton width={240} height={68} />
    </HStack>
  )
}

const PoolInformationSkeleton = () => {
  const theme = useTheme()

  return (
    <Stack width="100%" gap={16} p={16} borderRadius={12} background={theme.background}>
      <HStack gap={24} wrap="wrap">
        <PositionSkeleton width={96} height={16} />
        <PositionSkeleton width={96} height={16} />
        <PositionSkeleton width={96} height={16} />
      </HStack>

      <HStack gap={16} wrap="wrap">
        {Array.from({ length: 4 }).map((_, index) => (
          <Stack key={index} flex="1 1 160px" gap={12} p={12} borderRadius={16} background={theme.buttonGray}>
            <PositionSkeleton width={80} height={16} />
            <PositionSkeleton width={120} height={16} />
          </Stack>
        ))}
      </HStack>

      <HStack align="center" justify="space-between" gap={16} wrap="wrap">
        <PositionSkeleton width={120} height={24} />
        <PositionSkeleton width={320} height={16} />
      </HStack>

      <HStack align="center" justify="space-between" gap={16} wrap="wrap">
        <PositionSkeleton width={160} height={18} />
        <PositionSkeleton width={120} height={36} />
      </HStack>

      <PositionSkeleton width="100%" height={360} />
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

        <Stack flex="1 1 320px" gap={24} minWidth={0}>
          <RoutePreviewSkeleton />
          <PoolInformationSkeleton />
        </Stack>
      </HStack>
    </PoolDetailWrapper>
  )
}

export default PoolDetailPageSkeleton
