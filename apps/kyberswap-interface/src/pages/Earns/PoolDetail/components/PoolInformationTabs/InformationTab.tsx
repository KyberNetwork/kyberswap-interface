import { shortenAddress } from '@kyber/utils/dist/crypto'
import { type ReactNode, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { formatPoolInfoCurrency, formatPoolInfoPercent } from 'pages/Earns/PoolDetail/utils/poolInformation'
import DropdownMenu, { MenuOption } from 'pages/Earns/components/DropdownMenu'
import { formatDisplayNumber } from 'utils/numbers'

const APR_PERIOD_OPTIONS = [
  { label: '24H', value: '24H' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
] as const

const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: repeat(3, minmax(0, 1fr));
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    padding: 14px 16px;
  `}
`

const MetricColumn = styled(Stack)`
  min-width: 0;
  gap: 6px;
`

const MetricLabel = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 1.2;
`

const MetricValue = styled.div`
  color: ${({ theme }) => theme.text};
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const AprSummaryRow = styled(HStack)`
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-width: 100%;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
    gap: 14px 20px;
    min-width: 100%;
  `}
`

const AprSummaryItem = styled(HStack)`
  align-items: baseline;
  gap: 10px;
`

const ActiveAprItem = styled(HStack)`
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const AprSummaryLabel = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 1.2;
`

const AprSummaryValue = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.text};
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
`

const SectionHeaderRow = styled(HStack)`
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

const SectionTitleGroup = styled(HStack)`
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
`

const SectionTitle = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.25;
`

const SectionSubtitle = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
  font-size: 18px;
  line-height: 1.25;
`

const IntervalSelector = styled(HStack)`
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

const IntervalButton = styled.button<{ $active: boolean }>`
  border: 0;
  min-width: 64px;
  height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.08)' : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 56px;
    height: 36px;
    padding: 0 14px;
    font-size: 14px;
  `}
`

type AprPeriod = (typeof APR_PERIOD_OPTIONS)[number]['value']

interface InformationTabProps {
  pool?: Pool
}

interface TopMetricItem {
  label: string
  value: ReactNode
}

const APR_PERIOD_MENU_OPTIONS: MenuOption[] = APR_PERIOD_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

const formatNumericValue = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'

const InformationTab = ({ pool }: InformationTabProps) => {
  const theme = useTheme()
  const [aprPeriod, setAprPeriod] = useState<AprPeriod>('7D')
  const [interval, setInterval] = useState<AprPeriod>('7D')

  const rewardApr =
    pool &&
    (pool.kemEGApr || 0) +
      (pool.kemLMApr || 0) +
      (pool.bonusApr || 0) +
      ((pool.kemEGApr || pool.kemLMApr || pool.bonusApr ? 0 : pool.poolStats?.kemEGApr24h || 0) +
        (pool.poolStats?.kemLMApr24h || 0) +
        (pool.poolStats?.bonusApr || 0))
  const activeApr = pool?.allApr ?? pool?.poolStats?.allApr24h ?? pool?.poolStats?.apr24h ?? pool?.poolStats?.apr
  const maxRangeApr = pool?.maxAprInfo
    ? Number(pool.maxAprInfo.apr) + Number(pool.maxAprInfo.kemEGApr) + Number(pool.maxAprInfo.kemLMApr)
    : undefined
  const averageApr =
    aprPeriod === '24H'
      ? pool?.poolStats?.allApr24h ?? pool?.allApr ?? pool?.poolStats?.apr24h ?? pool?.poolStats?.apr
      : aprPeriod === '7D'
      ? pool?.poolStats?.allApr7d
      : pool?.poolStats?.allApr30d
  const maxApr = maxRangeApr

  const topMetrics = useMemo<TopMetricItem[]>(
    () => [
      {
        label: 'TVL',
        value: formatPoolInfoCurrency(pool?.tvl ?? pool?.poolStats?.tvl ?? Number(pool?.reserveUsd)),
      },
      {
        label: '24h Volume',
        value: formatPoolInfoCurrency(pool?.volume ?? pool?.poolStats?.volume24h),
      },
      {
        label: '24h Fees',
        value: formatPoolInfoCurrency(pool?.earnFee ?? pool?.poolStats?.fees24h),
      },
      {
        label: 'Rewards',
        value: (
          <HStack align="center" gap={4}>
            <Text as="span" color={theme.text} fontSize={16} fontWeight={600} lineHeight="1.3" m={0}>
              {pool?.egUsd ? formatPoolInfoCurrency(pool.egUsd) : formatPoolInfoPercent(rewardApr)}
            </Text>
            {pool?.programs?.length || rewardApr ? <BagIcon width={20} height={20} /> : null}
          </HStack>
        ),
      },
      {
        label: 'Liquidity Provider',
        value: formatNumericValue(pool?.liquidity),
      },
      {
        label: 'Pool Address',
        value: pool?.address ? (
          <HStack align="center" gap={4}>
            <Text as="span" color={theme.text} fontSize={16} fontWeight={600} lineHeight="1.3" m={0}>
              {shortenAddress(pool.address, 4)}
            </Text>
            <CopyHelper color={theme.subText} margin="0" size={14} toCopy={pool.address} />
          </HStack>
        ) : (
          '--'
        ),
      },
    ],
    [
      pool?.address,
      pool?.earnFee,
      pool?.egUsd,
      pool?.liquidity,
      pool?.poolStats?.fees24h,
      pool?.poolStats?.tvl,
      pool?.poolStats?.volume24h,
      pool?.programs,
      pool?.reserveUsd,
      pool?.tvl,
      pool?.volume,
      rewardApr,
      theme.subText,
      theme.text,
    ],
  )

  return (
    <Stack gap={16}>
      <MetricsStrip>
        {topMetrics.map(metric => (
          <MetricColumn key={metric.label}>
            <MetricLabel>{metric.label}</MetricLabel>
            <MetricValue>{metric.value}</MetricValue>
          </MetricColumn>
        ))}
      </MetricsStrip>

      <AprSummaryRow>
        <DropdownMenu
          background="rgba(255, 255, 255, 0.05)"
          flatten
          options={APR_PERIOD_MENU_OPTIONS}
          value={aprPeriod}
          width={42}
          onChange={value => setAprPeriod(value as AprPeriod)}
        />
        <HStack align="center" gap={12}>
          <ActiveAprItem>
            <AprSummaryItem>
              <AprSummaryLabel>Active APR</AprSummaryLabel>
              <AprSummaryValue>{formatPoolInfoPercent(activeApr)}</AprSummaryValue>
            </AprSummaryItem>
          </ActiveAprItem>
          <AprSummaryItem>
            <AprSummaryLabel>Average APR</AprSummaryLabel>
            <AprSummaryValue>{formatPoolInfoPercent(averageApr)}</AprSummaryValue>
          </AprSummaryItem>
          <AprSummaryItem>
            <AprSummaryLabel>Max APR</AprSummaryLabel>
            <AprSummaryValue>{formatPoolInfoPercent(maxApr)}</AprSummaryValue>
          </AprSummaryItem>
        </HStack>
      </AprSummaryRow>

      <SectionHeaderRow>
        <SectionTitleGroup>
          <SectionTitle>Earning / Active TVL</SectionTitle>
          <SectionSubtitle>(Active APR)</SectionSubtitle>
        </SectionTitleGroup>

        <IntervalSelector>
          {APR_PERIOD_OPTIONS.map(option => (
            <IntervalButton
              $active={interval === option.value}
              key={option.value}
              onClick={() => setInterval(option.value)}
              type="button"
            >
              {option.label}
            </IntervalButton>
          ))}
        </IntervalSelector>
      </SectionHeaderRow>
    </Stack>
  )
}

export default InformationTab
