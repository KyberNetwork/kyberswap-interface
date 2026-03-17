import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { formatPoolInfoCurrency, formatPoolInfoPercent } from 'pages/Earns/PoolDetail/utils/poolInformation'

const POOL_INFO_TABS = ['Pool Information', 'Earning', 'Analytics'] as const

const SurfaceCardShell = styled(Stack)`
  border: 1px solid ${({ theme }) => theme.tabActive};
  padding: 20px;
  border-radius: 16px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

const MetricCardShell = styled(Stack)`
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
`

const SectionCaption = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const LabelText = styled(Text)`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
`

const ValueText = styled(Text)`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
`

const WiringValueText = styled(Text)`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-word;
`

const TabButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.primary : theme.tabActive)};
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? 'rgba(49, 203, 158, 0.2)' : 'rgba(255, 255, 255, 0.04)')};
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  font-size: 13px;
  font-weight: 500;
  user-select: none;
`

interface PoolInformationProps {
  pool?: Pool
  chainName?: string
  dexName?: string
}

interface SurfaceCardProps {
  children: ReactNode
}

const SurfaceCard = ({ children }: SurfaceCardProps) => <SurfaceCardShell gap={16}>{children}</SurfaceCardShell>

interface MetricCardProps {
  label: string
  value: ReactNode
  description?: ReactNode
  valueColor?: string
  flex?: string
  valueStyle?: CSSProperties
}

const MetricCard = ({ label, value, description, valueColor, flex = '1 1 180px', valueStyle }: MetricCardProps) => {
  const theme = useTheme()

  return (
    <MetricCardShell gap={6} flex={flex} minWidth={0} p="14px 16px">
      <LabelText color={theme.subText}>{label}</LabelText>
      <ValueText color={valueColor || theme.text} style={valueStyle}>
        {value}
      </ValueText>
      {description ? (
        <Text color={theme.subText} fontSize={12} lineHeight="1.4" m={0}>
          {description}
        </Text>
      ) : null}
    </MetricCardShell>
  )
}

interface WiringCardProps {
  label: string
  value: ReactNode
}

const WiringCard = ({ label, value }: WiringCardProps) => {
  const theme = useTheme()

  return (
    <MetricCardShell gap={8} flex="1 1 260px" minWidth={0} p="14px 16px">
      <LabelText color={theme.subText}>{label}</LabelText>
      <WiringValueText color={theme.text}>{value}</WiringValueText>
    </MetricCardShell>
  )
}

const PoolInformation = ({ pool, chainName, dexName }: PoolInformationProps) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<(typeof POOL_INFO_TABS)[number]>(POOL_INFO_TABS[0])
  const rewardApr = pool
    ? (pool.kemEGApr || 0) +
      (pool.kemLMApr || 0) +
      (pool.bonusApr || 0) +
      ((pool.kemEGApr || pool.kemLMApr || pool.bonusApr ? 0 : pool.poolStats?.kemEGApr24h || 0) +
        (pool.poolStats?.kemLMApr24h || 0) +
        (pool.poolStats?.bonusApr || 0))
    : undefined

  const poolContent = useMemo(
    () => (
      <>
        <Stack gap={12}>
          <SectionCaption color={theme.text}>Pool Wiring</SectionCaption>
          <HStack align="stretch" gap={12} wrap="wrap">
            <WiringCard label="Pool Address" value={pool?.address || '--'} />
            <WiringCard label="Protocol And Chain" value={[dexName, chainName].filter(Boolean).join(' · ') || '--'} />
          </HStack>
        </Stack>

        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="TVL"
            value={formatPoolInfoCurrency(pool?.tvl ?? pool?.poolStats?.tvl ?? Number(pool?.reserveUsd))}
            description="Explorer TVL, with pool detail fallback."
          />
          <MetricCard
            label="24H Volume"
            value={formatPoolInfoCurrency(pool?.volume ?? pool?.poolStats?.volume24h)}
            description="Explorer 24h volume, with pool detail fallback."
          />
          <MetricCard label="Exchange" value={pool?.exchange || '--'} description="Returned by pool detail endpoint." />
          <MetricCard label="Pool Type" value={pool?.type || '--'} description="Returned by pool detail endpoint." />
          <MetricCard
            label="Swap Fee"
            value={
              pool?.swapFee !== undefined ? `${pool.swapFee}%` : pool?.feeTier !== undefined ? `${pool.feeTier}%` : '--'
            }
            description="Displayed in the header and route summary."
          />
        </HStack>

        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="Tick Spacing"
            value={pool?.positionInfo?.tickSpacing ?? '--'}
            description="Needed for concentrated liquidity price range controls."
          />
          <MetricCard
            label="Current Tick"
            value={pool?.positionInfo?.tick ?? '--'}
            description="Used to determine in-range and price visualization."
          />
          <MetricCard
            label="Reserve USD"
            value={formatPoolInfoCurrency(Number(pool?.reserveUsd))}
            description="Raw reserve value from pool detail endpoint."
          />
          <MetricCard
            label="Amplified TVL"
            value={formatPoolInfoCurrency(Number(pool?.amplifiedTvl))}
            description="Useful for amplified pools when provided."
          />
        </HStack>
      </>
    ),
    [chainName, dexName, pool, theme.text],
  )

  const earningContent = useMemo(
    () => (
      <>
        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="Est. Pool APR"
            value={formatPoolInfoPercent(pool?.allApr ?? pool?.poolStats?.allApr24h)}
            description="Explorer APR, with pool detail stats fallback."
            valueColor={theme.primary}
          />
          <MetricCard
            label="LP APR"
            value={formatPoolInfoPercent(pool?.lpApr ?? pool?.poolStats?.lpApr24h)}
            description="Explorer LP APR, with pool detail stats fallback."
            valueColor={theme.primary}
          />
          <MetricCard
            label="Reward APR"
            value={formatPoolInfoPercent(rewardApr)}
            description="Combined reward APR from both sources."
            valueColor={theme.primary}
          />
          <MetricCard
            label="24H Earn Fees"
            value={formatPoolInfoCurrency(pool?.earnFee ?? pool?.poolStats?.fees24h)}
            description="Explorer earn fees, with pool detail stats fallback."
          />
        </HStack>
        <NoteCard>Pool detail page now merges data from pool explorer and pool detail into one `pool` object.</NoteCard>
      </>
    ),
    [
      pool?.allApr,
      pool?.earnFee,
      pool?.lpApr,
      pool?.poolStats?.allApr24h,
      pool?.poolStats?.fees24h,
      pool?.poolStats?.lpApr24h,
      rewardApr,
      theme.primary,
    ],
  )

  const analyticsContent = useMemo(
    () => (
      <NoteCard>
        Charting and historical analytics still need a dedicated data source. `PoolDetail` now has the slot and metrics
        to host them cleanly.
      </NoteCard>
    ),
    [],
  )

  const content =
    activeTab === 'Pool Information' ? poolContent : activeTab === 'Earning' ? earningContent : analyticsContent

  return (
    <Stack gap={16} width="100%">
      <SurfaceCard>
        <HStack align="center" gap={12} justify="space-between" wrap="wrap" width="100%">
          <Text color={theme.text} fontSize={18} fontWeight={600} m={0}>
            Pool Information
          </Text>
          <HStack align="center" gap={8} wrap="wrap">
            {POOL_INFO_TABS.map(tab => (
              <TabButton $active={tab === activeTab} key={tab} onClick={() => setActiveTab(tab)} type="button">
                {tab}
              </TabButton>
            ))}
          </HStack>
        </HStack>
      </SurfaceCard>

      <SurfaceCard>
        <Text color={theme.text} fontSize={18} fontWeight={600} minWidth="100px" m={0}>
          {activeTab}
        </Text>
        <Text color={theme.subText} fontSize={14} lineHeight="1.5" m={0}>
          Three-tab detail surface for pool information, earning context, and analytics.
        </Text>
        {content}
      </SurfaceCard>
    </Stack>
  )
}

export default PoolInformation
