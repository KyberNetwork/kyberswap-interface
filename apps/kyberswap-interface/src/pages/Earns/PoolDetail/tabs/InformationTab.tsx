import { formatAprNumber } from '@kyber/utils'
import { shortenAddress } from '@kyber/utils/crypto'
import { type ReactNode, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import InformationAprChart, { type AprPeriod } from 'pages/Earns/PoolDetail/tabs/InformationAprChart'
import { type Pool } from 'pages/Earns/PoolDetail/types'
import { formatDisplayNumber } from 'utils/numbers'

const APR_PERIOD_OPTIONS = [
  { label: '24H', value: '24H' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
] as const

const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonGray};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: repeat(3, minmax(0, 1fr));
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
  `}
`

const AprSummaryRow = styled(HStack)`
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
    gap: 12px 16px;
  `}
`

const IntervalSelector = styled.div`
  display: grid;
  position: relative;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
`

const IntervalActivePill = styled.div<{ $activeIndex: number }>`
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  width: calc((100% - 2px) / 3);
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  transform: translateX(calc(100% * ${({ $activeIndex }) => $activeIndex}));
  transition: transform 200ms ease, background 200ms ease;
  pointer-events: none;
`

const IntervalButton = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: 1;
  min-width: 48px;
  padding: 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 200ms ease, background 200ms ease;

  :hover {
    background: ${({ theme, $active }) => ($active ? 'transparent' : theme.buttonGray)};
  }
`

type InformationTabProps = {
  pool?: Pool
}

type TopMetricItem = {
  label: string
  value: ReactNode
}

const EllipsisText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const formatCurrency = (value?: number) => formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })

const formatNumber = (value?: number) => formatDisplayNumber(value, { significantDigits: 6 })

const formatApr = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

const getRewardApr = (pool?: Pool) => {
  if (!pool) return undefined

  const directRewardApr = (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + (pool.bonusApr || 0)
  if (directRewardApr) return directRewardApr

  return (pool.poolStats?.kemEGApr24h || 0) + (pool.poolStats?.kemLMApr24h || 0) + (pool.poolStats?.bonusApr || 0)
}

const getAverageApr = (pool: Pool | undefined, aprInterval: AprPeriod) => {
  if (aprInterval === '24H') {
    return pool?.poolStats?.allApr24h ?? pool?.allApr ?? pool?.poolStats?.apr24h ?? pool?.poolStats?.apr
  }

  return aprInterval === '7D' ? pool?.poolStats?.allApr7d : pool?.poolStats?.allApr30d
}

const getMaxApr = (pool?: Pool) =>
  pool?.maxAprInfo
    ? Number(pool.maxAprInfo.apr) + Number(pool.maxAprInfo.kemEGApr) + Number(pool.maxAprInfo.kemLMApr)
    : undefined

const InformationTab = ({ pool }: InformationTabProps) => {
  const theme = useTheme()
  const [aprInterval, setAprInterval] = useState<AprPeriod>('7D')
  const intervalActiveIndex = APR_PERIOD_OPTIONS.findIndex(option => option.value === aprInterval)
  const poolStats = pool?.poolStats

  const rewardApr = getRewardApr(pool)
  const activeApr = pool?.allApr ?? poolStats?.allApr24h ?? poolStats?.apr24h ?? poolStats?.apr
  const averageApr = getAverageApr(pool, aprInterval)
  const maxApr = getMaxApr(pool)

  const topMetrics: TopMetricItem[] = [
    {
      label: 'TVL',
      value: formatCurrency(pool?.tvl ?? poolStats?.tvl ?? Number(pool?.reserveUsd)),
    },
    {
      label: '24h Volume',
      value: formatCurrency(pool?.volume ?? poolStats?.volume24h),
    },
    {
      label: '24h Fees',
      value: formatCurrency(pool?.earnFee ?? poolStats?.fees24h),
    },
    {
      label: 'Rewards',
      value: (
        <HStack align="center" gap={4}>
          <Text as="span" color={theme.text} fontWeight={500}>
            {pool?.egUsd ? formatCurrency(pool.egUsd) : formatApr(rewardApr)}
          </Text>
          {pool?.programs?.length || rewardApr ? <BagIcon width={20} height={20} /> : null}
        </HStack>
      ),
    },
    {
      label: 'Liquidity Provider',
      value: formatNumber(pool?.liquidity),
    },
    {
      label: 'Pool Address',
      value: pool?.address ? (
        <HStack align="center" gap={4}>
          <Text as="span" color={theme.text} fontWeight={500}>
            {shortenAddress(pool.address, 4)}
          </Text>
          <CopyHelper color={theme.subText} margin="0" size={14} toCopy={pool.address} />
        </HStack>
      ) : (
        '--'
      ),
    },
  ]

  return (
    <Stack gap={16}>
      <MetricsStrip>
        {topMetrics.map(metric => (
          <Stack key={metric.label} gap={4} minWidth={0}>
            <EllipsisText color={theme.subText} fontSize={14}>
              {metric.label}
            </EllipsisText>
            <EllipsisText color={theme.text} fontWeight={500}>
              {metric.value}
            </EllipsisText>
          </Stack>
        ))}
      </MetricsStrip>

      <AprSummaryRow width="100%">
        <IntervalSelector>
          <IntervalActivePill $activeIndex={Math.max(intervalActiveIndex, 0)} />
          {APR_PERIOD_OPTIONS.map(option => (
            <IntervalButton
              $active={aprInterval === option.value}
              key={option.value}
              onClick={() => setAprInterval(option.value)}
              type="button"
            >
              {option.label}
            </IntervalButton>
          ))}
        </IntervalSelector>
        <HStack align="center" gap={16} wrap="wrap">
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Active APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatApr(activeApr)}
            </Text>
          </HStack>
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Average APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatApr(averageApr)}
            </Text>
          </HStack>
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Max APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatApr(maxApr)}
            </Text>
          </HStack>
        </HStack>
      </AprSummaryRow>

      <HStack align="center" gap={8} wrap="wrap" pl="8px">
        <Text color={theme.text} fontWeight={500}>
          Earning / Active TVL
        </Text>
        <Text color={theme.subText} fontSize={14} fontWeight={500}>
          (Active APR)
        </Text>
      </HStack>

      <InformationAprChart aprInterval={aprInterval} pool={pool} />
    </Stack>
  )
}

export default InformationTab
