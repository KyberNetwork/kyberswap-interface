import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { PoolDetail as PoolDetailData } from 'services/zapEarn'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { NoteCard } from 'pages/Earns/PoolDetail/styled'
import { formatPoolInfoCurrency, formatPoolInfoPercent } from 'pages/Earns/PoolDetail/utils/poolInformation'
import { EarnPool } from 'pages/Earns/types'

const POOL_INFO_TABS = ['Pool Information', 'Earning', 'Analytics'] as const

const SurfaceCardShell = styled(Stack)`
  border-radius: 16px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.tabActive};
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`

const MetricCardShell = styled(Stack)`
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
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
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.subText)};
  background: ${({ $active }) => ($active ? 'rgba(49, 203, 158, 0.2)' : 'rgba(255, 255, 255, 0.04)')};
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
`

interface PoolInformationProps {
  pool?: EarnPool
  poolDetail?: PoolDetailData
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
        <Text m={0} color={theme.subText} fontSize={12} lineHeight="1.4">
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

const PoolInformation = ({ pool, poolDetail, chainName, dexName }: PoolInformationProps) => {
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<(typeof POOL_INFO_TABS)[number]>(POOL_INFO_TABS[0])

  const poolContent = useMemo(
    () => (
      <>
        <Stack gap={12}>
          <SectionCaption color={theme.text}>Pool Wiring</SectionCaption>
          <HStack align="stretch" gap={12} wrap="wrap">
            <WiringCard label="Pool Address" value={pool?.address || poolDetail?.address || '--'} />
            <WiringCard label="Protocol And Chain" value={[dexName, chainName].filter(Boolean).join(' · ') || '--'} />
          </HStack>
        </Stack>

        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="TVL"
            value={formatPoolInfoCurrency(pool?.tvl || Number(poolDetail?.reserveUsd))}
            description="Explorer TVL with detail fallback."
          />
          <MetricCard
            label="24H Volume"
            value={formatPoolInfoCurrency(pool?.volume)}
            description="From explorer listing data."
          />
          <MetricCard label="Pool Type" value={poolDetail?.type || '--'} description="From `usePoolDetailQuery`." />
          <MetricCard
            label="Swap Fee"
            value={
              pool?.feeTier !== undefined
                ? `${pool.feeTier}%`
                : poolDetail?.swapFee !== undefined
                ? `${poolDetail.swapFee}%`
                : '--'
            }
            description="Displayed in the header and route summary."
          />
        </HStack>

        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="Tick Spacing"
            value={poolDetail?.positionInfo?.tickSpacing ?? '--'}
            description="Needed for concentrated liquidity price range controls."
          />
          <MetricCard
            label="Current Tick"
            value={poolDetail?.positionInfo?.tick ?? '--'}
            description="Used to determine in-range and price visualization."
          />
          <MetricCard
            label="Reserve USD"
            value={formatPoolInfoCurrency(Number(poolDetail?.reserveUsd))}
            description="Raw reserve value from pool detail endpoint."
          />
          <MetricCard
            label="Amplified TVL"
            value={formatPoolInfoCurrency(Number(poolDetail?.amplifiedTvl))}
            description="Useful for amplified pools when provided."
          />
        </HStack>
      </>
    ),
    [chainName, dexName, pool, poolDetail, theme.text],
  )

  const earningContent = useMemo(
    () => (
      <>
        <HStack align="stretch" gap={12} wrap="wrap">
          <MetricCard
            label="Est. Pool APR"
            value={formatPoolInfoPercent(pool?.allApr)}
            description="Total APR from pool explorer."
            valueColor={theme.primary}
          />
          <MetricCard
            label="LP APR"
            value={formatPoolInfoPercent(pool?.lpApr)}
            description="Base LP fee APR."
            valueColor={theme.primary}
          />
          <MetricCard
            label="Reward APR"
            value={formatPoolInfoPercent((pool?.kemEGApr || 0) + (pool?.kemLMApr || 0) + (pool?.bonusApr || 0))}
            description="EG, LM, and bonus APR combined."
            valueColor={theme.primary}
          />
          <MetricCard
            label="24H Earn Fees"
            value={formatPoolInfoCurrency(pool?.earnFee)}
            description="Explorer-side earning fee snapshot."
          />
        </HStack>
        <NoteCard>
          Reward sections, distributions, and farming cycle progress still need to be connected if this page is intended
          to match the full widget or position detail experience.
        </NoteCard>
      </>
    ),
    [pool, theme.primary],
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
        <HStack justify="space-between" align="center" gap={12} wrap="wrap" width="100%">
          <Text m={0} color={theme.text} fontSize={18} fontWeight={600}>
            Pool Information
          </Text>
          <HStack align="center" gap={8} wrap="wrap">
            {POOL_INFO_TABS.map(tab => (
              <TabButton key={tab} type="button" $active={tab === activeTab} onClick={() => setActiveTab(tab)}>
                {tab}
              </TabButton>
            ))}
          </HStack>
        </HStack>
      </SurfaceCard>

      <SurfaceCard>
        <Text m={0} color={theme.text} fontSize={18} fontWeight={600} minWidth="100px">
          {activeTab}
        </Text>
        <Text m={0} color={theme.subText} fontSize={14} lineHeight="1.5">
          Three-tab detail surface for pool information, earning context, and analytics.
        </Text>
        {content}
      </SurfaceCard>
    </Stack>
  )
}

export default PoolInformation
