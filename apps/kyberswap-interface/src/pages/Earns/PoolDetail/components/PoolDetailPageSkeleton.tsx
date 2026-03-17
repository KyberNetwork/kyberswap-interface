import { PoolType, univ3Types } from '@kyber/schema'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import AddLiquidityWidgetSkeleton from 'pages/Earns/PoolDetail/AddLiquidity/components/AddLiquidityWidgetSkeleton'
import { PoolDetailWrapper } from 'pages/Earns/PoolDetail/styled'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { Exchange } from 'pages/Earns/constants'
import { ZAPIN_DEX_MAPPING } from 'pages/Earns/constants/dexMappings'

const HeaderRow = styled(HStack)`
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
`

const HeaderGroup = styled(HStack)`
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
`

const SideCard = styled(Stack)`
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
`

const TabRow = styled(HStack)`
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

interface PoolDetailPageSkeletonProps {
  exchange?: string
}

export default function PoolDetailPageSkeleton({ exchange }: PoolDetailPageSkeletonProps) {
  const poolType = exchange
    ? (ZAPIN_DEX_MAPPING[exchange as Exchange] as unknown as PoolType | undefined) ?? undefined
    : undefined
  const showPriceRange = Boolean(poolType && univ3Types.includes(poolType as any))

  return (
    <PoolDetailWrapper>
      <HeaderRow>
        <PositionSkeleton width={36} height={36} style={{ borderRadius: '50%' }} />

        <HeaderGroup>
          <HStack align="center" gap={0}>
            <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%' }} />
            <PositionSkeleton width={28} height={28} style={{ borderRadius: '50%', marginLeft: -8 }} />
            <PositionSkeleton width={16} height={16} style={{ borderRadius: '50%', marginLeft: -8, marginTop: 12 }} />
          </HStack>

          <PositionSkeleton width={180} height={28} />
          <PositionSkeleton width={148} height={32} />
          <PositionSkeleton width={96} height={32} />
        </HeaderGroup>
      </HeaderRow>

      <HStack align="flex-start" gap={24} wrap="wrap" width="100%">
        <Stack flex="1 1 480px" width="100%" maxWidth="480px" minWidth={0}>
          <AddLiquidityWidgetSkeleton showPriceRange={showPriceRange} />
        </Stack>

        <Stack flex="1 1 320px" gap={24} minWidth={0}>
          <SideCard gap={16}>
            <PositionSkeleton width={112} height={18} />
            <PositionSkeleton width="100%" height={72} style={{ borderRadius: 12 }} />
            <PositionSkeleton width={88} height={16} />
            <PositionSkeleton width="100%" height={72} style={{ borderRadius: 12 }} />
          </SideCard>

          <SideCard gap={20}>
            <TabRow>
              <PositionSkeleton width={110} height={16} />
              <PositionSkeleton width={12} height={16} />
              <PositionSkeleton width={88} height={16} />
              <PositionSkeleton width={12} height={16} />
              <PositionSkeleton width={96} height={16} />
            </TabRow>

            {[0, 1, 2, 3].map(item => (
              <HStack align="center" justify="space-between" key={item}>
                <PositionSkeleton width={132} height={16} />
                <PositionSkeleton width={88} height={16} />
              </HStack>
            ))}
          </SideCard>
        </Stack>
      </HStack>
    </PoolDetailWrapper>
  )
}
