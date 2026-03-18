import { shortenAddress } from '@kyber/utils/crypto'
import { type ReactNode, useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import CopyHelper from 'components/Copy'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import InformationAprChart, {
  type AprPeriod,
} from 'pages/Earns/PoolDetail/components/PoolInformationTabs/InformationAprChart'
import { Pool } from 'pages/Earns/PoolDetail/types'
import { formatPoolInfoCurrency, formatPoolInfoPercent } from 'pages/Earns/PoolDetail/utils'
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

const MetricColumn = styled(Stack)`
  min-width: 0;
  gap: 4px;
`

const MetricValue = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const AprSummaryRow = styled(HStack)`
  min-width: 100%;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 100%;
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
  background: ${({ theme }) => theme.buttonGray};
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
  padding: 8px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 200ms ease;

  :hover {
    background: ${({ theme }) => theme.background};
  }
`

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
  const intervalActiveIndex = APR_PERIOD_OPTIONS.findIndex(option => option.value === interval)

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
            <Text as="span" color={theme.text} fontWeight={500}>
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
            <Text as="span" color={theme.text} fontWeight={500}>
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
            <Text color={theme.subText} fontSize={14}>
              {metric.label}
            </Text>
            <MetricValue>{metric.value}</MetricValue>
          </MetricColumn>
        ))}
      </MetricsStrip>

      <AprSummaryRow>
        <DropdownMenu
          alignItems="stretch"
          background={theme.buttonGray}
          flatten
          options={APR_PERIOD_MENU_OPTIONS}
          width={42}
          value={aprPeriod}
          onChange={value => setAprPeriod(value as AprPeriod)}
        />
        <HStack align="center" gap={24}>
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Active APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatPoolInfoPercent(activeApr)}
            </Text>
          </HStack>
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Average APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatPoolInfoPercent(averageApr)}
            </Text>
          </HStack>
          <HStack align="baseline" gap={8}>
            <Text color={theme.subText} fontSize={14}>
              Max APR
            </Text>
            <Text color={theme.text} fontSize={14} fontWeight={500}>
              {formatPoolInfoPercent(maxApr)}
            </Text>
          </HStack>
        </HStack>
      </AprSummaryRow>

      <HStack align="center" justify="space-between" gap={16} wrap="wrap">
        <HStack align="baseline" gap={8} wrap="wrap">
          <Text color={theme.text} fontWeight={500}>
            Earning / Active TVL
          </Text>
          <Text color={theme.subText}>(Active APR)</Text>
        </HStack>

        <IntervalSelector>
          <IntervalActivePill $activeIndex={Math.max(intervalActiveIndex, 0)} />
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
      </HStack>

      <InformationAprChart interval={interval} pool={pool} />
    </Stack>
  )
}

export default InformationTab
