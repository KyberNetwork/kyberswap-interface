import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { LiquidityChartSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/PriceSection/LiquidityChart'
import { TokenAmountInputSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

export default function AddLiquidityWidgetSkeleton() {
  const theme = useTheme()

  return (
    <Stack width="100%" gap={16} p={16} borderRadius={12} background={theme.background}>
      <Stack gap={12}>
        <Stack gap={10}>
          <HStack align="center" justify="space-between">
            <PositionSkeleton width={120} height={18} />
            <PositionSkeleton width={32} height={32} />
          </HStack>

          <TokenAmountInputSkeleton />
        </Stack>

        <HStack justify="space-between" height={40}>
          <PositionSkeleton width={80} height={16} style={{ marginTop: 16 }} />
          <PositionSkeleton width={160} height={16} />
        </HStack>
      </Stack>

      <Stack gap={16}>
        <PositionSkeleton width="100%" height={42} />
        <LiquidityChartSkeleton />
      </Stack>

      <Stack gap={40}>
        <Stack gap={12}>
          <PositionSkeleton width="100%" height={40} />
          <PositionSkeleton width="100%" height={40} />
          <PositionSkeleton width="100%" height={40} />
        </Stack>

        <HStack justify="space-between" gap={12} p={12} borderRadius={24} background={theme.buttonGray}>
          <PositionSkeleton width={160} height={44} />
          <PositionSkeleton width={160} height={44} />
        </HStack>
      </Stack>
    </Stack>
  )
}
