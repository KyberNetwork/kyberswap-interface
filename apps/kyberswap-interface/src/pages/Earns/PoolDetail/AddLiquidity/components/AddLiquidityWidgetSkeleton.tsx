import { Skeleton } from '@kyber/ui'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import AddLiquiditySettings from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquiditySettings'
import { LiquidityChartSkeleton } from 'pages/Earns/PoolDetail/AddLiquidity/components/price-range/LiquidityChart'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'

const FormStack = styled(Stack)`
  width: 100%;
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(20, 20, 22, 0.98) 0%, rgba(16, 16, 18, 0.98) 100%);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    border-radius: 18px;
  `}
`

const HeaderTitle = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
`

const GradientCard = styled(Stack)`
  width: 100%;
  padding: 12px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(32, 32, 36, 0.92) 0%, rgba(23, 23, 27, 0.92) 100%);
`

const TokenCard = styled(GradientCard)`
  min-height: 116px;
`

const PriceInfoCard = styled(GradientCard)`
  min-height: 44px;
  justify-content: center;
`

const AprCard = styled(GradientCard)`
  min-height: 40px;
  justify-content: center;
`

const SummaryCard = styled(GradientCard)`
  min-height: 50px;
  justify-content: center;
`

const SegmentedShell = styled(HStack)`
  min-height: 44px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.02);
`

const InputShell = styled(HStack)`
  min-height: 72px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
`

interface AddLiquidityWidgetSkeletonProps {
  showPriceRange?: boolean
}

export default function AddLiquidityWidgetSkeleton({ showPriceRange = false }: AddLiquidityWidgetSkeletonProps) {
  return (
    <FormStack gap={16}>
      <Stack gap={20}>
        <HStack align="center" justify="space-between">
          <HeaderTitle>ADD LIQUIDITY</HeaderTitle>
          <AddLiquiditySettings />
        </HStack>

        <Stack gap={16}>
          {[0, 1].map(index => (
            <TokenCard gap={12} key={index}>
              <HStack align="center" justify="space-between">
                <HStack align="center" gap={8}>
                  <PositionSkeleton width={16} height={16} style={{ borderRadius: '50%' }} />
                  <PositionSkeleton width={56} height={14} />
                </HStack>
                <PositionSkeleton width={52} height={14} />
              </HStack>

              <HStack align="center" gap={12} justify="space-between">
                <Stack flex={1} minWidth={0} gap={8}>
                  <PositionSkeleton width="56%" height={30} />
                  <PositionSkeleton width={80} height={12} />
                </Stack>
                <HStack align="center" gap={8}>
                  <PositionSkeleton width={20} height={20} style={{ borderRadius: '50%' }} />
                  <PositionSkeleton width={74} height={16} />
                </HStack>
              </HStack>

              <HStack gap={8}>
                {[0, 1, 2, 3].map(item => (
                  <PositionSkeleton key={item} width={40} height={24} style={{ borderRadius: 999 }} />
                ))}
              </HStack>
            </TokenCard>
          ))}

          <HStack justify="flex-end">
            <PositionSkeleton width={180} height={14} />
          </HStack>

          <PositionSkeleton width={228} height={14} />
        </Stack>
      </Stack>

      {showPriceRange && (
        <>
          <PriceInfoCard>
            <HStack align="center" justify="space-between">
              <PositionSkeleton width={188} height={16} />
              <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%' }} />
            </HStack>
          </PriceInfoCard>

          <Stack gap={16}>
            <LiquidityChartSkeleton />

            <SegmentedShell gap={0}>
              {[0, 1, 2, 3].map(item => (
                <PositionSkeleton key={item} width="100%" height={36} style={{ borderRadius: 999, flex: 1 }} />
              ))}
            </SegmentedShell>
          </Stack>

          <HStack gap={12}>
            {[0, 1].map(item => (
              <InputShell key={item} align="stretch" gap={8} minWidth={0} p="8px" width="100%">
                <PositionSkeleton width={42} height={40} style={{ borderRadius: 8 }} />
                <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%', alignSelf: 'center' }} />
                <Stack align="center" flex={1} gap={4}>
                  <Skeleton style={{ width: '100%', height: '20px' }} />
                  <PositionSkeleton width={72} height={12} />
                </Stack>
                <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%', alignSelf: 'center' }} />
              </InputShell>
            ))}
          </HStack>

          <AprCard>
            <HStack align="center" gap={8}>
              <PositionSkeleton width={108} height={14} />
              <PositionSkeleton width={60} height={14} />
            </HStack>
          </AprCard>
        </>
      )}

      <Stack gap={8}>
        <SummaryCard>
          <HStack align="center" justify="space-between">
            <HStack align="center" gap={8}>
              <PositionSkeleton width={92} height={14} />
              <PositionSkeleton width={16} height={16} style={{ borderRadius: '50%' }} />
            </HStack>
            <PositionSkeleton width={48} height={14} />
          </HStack>
        </SummaryCard>

        <HStack gap={16}>
          <PositionSkeleton width="100%" height={44} style={{ borderRadius: 14, flex: 1 }} />
          <PositionSkeleton width="100%" height={44} style={{ borderRadius: 14, flex: 1 }} />
        </HStack>
      </Stack>
    </FormStack>
  )
}
