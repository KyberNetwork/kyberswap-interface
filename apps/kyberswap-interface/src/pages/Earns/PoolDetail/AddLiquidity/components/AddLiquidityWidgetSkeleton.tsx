import { useMedia } from 'react-use'

import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { LiquidityChartSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/LiquidityChart'
import { TokenAmountInputSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'
import { MEDIA_WIDTHS } from 'theme'

const AddLiquidityWidgetSkeleton = () => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Stack width="100%" gap={16} p={16} borderRadius={12} background={theme.background}>
      <Stack gap={12}>
        <HStack align="center" justify="space-between">
          <Skeleton width={120} height={19} />
          <Skeleton width={32} height={32} circle />
        </HStack>

        <TokenAmountInputSkeleton />

        <Stack gap={12}>
          <HStack justify="flex-end">
            <Skeleton width={160} height={14.5} />
          </HStack>
          <Skeleton width={220} height={17} />
        </Stack>
      </Stack>

      <Stack gap={16}>
        <Skeleton width="100%" height={42} />
        <LiquidityChartSkeleton />
        <Skeleton width="100%" height={36} />
        <HStack gap={24} width="100%">
          <Stack flex="1 1 0" minWidth={0}>
            <Skeleton width="100%" height={40} />
          </Stack>
          <Stack flex="1 1 0" minWidth={0}>
            <Skeleton width="100%" height={40} />
          </Stack>
        </HStack>
      </Stack>

      <Stack gap={18.5}>
        <Stack gap={16}>
          <Skeleton width="100%" height={36} />
          <Skeleton width="100%" height={36} />
        </Stack>

        {!upToSmall && (
          <HStack justify="space-between" gap={12} p={12} borderRadius={24} background={theme.buttonGray}>
            <Skeleton width={160} height={44} />
            <Skeleton width={160} height={44} />
          </HStack>
        )}
      </Stack>
    </Stack>
  )
}

export default AddLiquidityWidgetSkeleton
