import { shortenAddress } from '@kyber/utils/crypto'
import { type ReactNode, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BagIcon } from 'assets/svg/kyber/ic_bag.svg'
import CopyHelper from 'components/Copy'
import SegmentedControl, { type SegmentedControlOption } from 'components/SegmentedControl'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import { formatApr, formatUsd, getPoolLiquidityUsd } from 'pages/Earns/PoolDetail/Information/utils'
import ActiveAprChart, { type AprPeriod } from 'pages/Earns/PoolDetail/components/ActiveAprChart'
import { type Pool } from 'pages/Earns/PoolDetail/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const APR_PERIOD_OPTIONS: readonly SegmentedControlOption<AprPeriod>[] = [
  { label: '24H', value: '24H' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
]

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

const EllipsisText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

type InformationTabProps = {
  pool: Pool
}

type TopMetricItem = {
  label: string
  value: ReactNode
}

const getRewardApr = (pool: Pool) => {
  const directRewardApr = (pool.kemEGApr || 0) + (pool.kemLMApr || 0) + (pool.bonusApr || 0)
  if (directRewardApr) return directRewardApr

  return (pool.poolStats?.kemEGApr24h || 0) + (pool.poolStats?.kemLMApr24h || 0) + (pool.poolStats?.bonusApr || 0)
}

const getAverageApr = (pool: Pool, aprInterval: AprPeriod) => {
  if (aprInterval === '24H') {
    return pool.poolStats?.allApr24h ?? pool.allApr ?? pool.poolStats?.apr24h ?? pool.poolStats?.apr
  }

  return aprInterval === '7D' ? pool.poolStats?.allApr7d : pool.poolStats?.allApr30d
}

const getMaxApr = (pool: Pool) =>
  pool.maxAprInfo
    ? Number(pool.maxAprInfo.apr) + Number(pool.maxAprInfo.kemEGApr) + Number(pool.maxAprInfo.kemLMApr)
    : undefined

const InformationTab = ({ pool }: InformationTabProps) => {
  const theme = useTheme()
  const [aprInterval, setAprInterval] = useState<AprPeriod>('7D')

  const tokenPrices = useTokenPrices(
    pool.tokens.map(token => token.address),
    pool.chainId,
  )

  const poolStats = pool.poolStats
  const activeApr = pool.allApr ?? poolStats?.allApr24h ?? poolStats?.apr24h ?? poolStats?.apr
  const averageApr = getAverageApr(pool, aprInterval)
  const maxApr = getMaxApr(pool)
  const rewardApr = getRewardApr(pool)
  const liquidityUsdValue = getPoolLiquidityUsd(pool, tokenPrices)

  const tvlValue = formatUsd(pool.tvl ?? poolStats?.tvl ?? Number(pool.reserveUsd))
  const volumeValue = formatUsd(pool.volume ?? poolStats?.volume24h)
  const feesValue = formatUsd(pool.earnFee ?? poolStats?.fees24h)
  const liquidityValue = formatUsd(liquidityUsdValue)

  const rewardsValue = (
    <HStack align="center" gap={4}>
      <Text as="span" color={theme.text} fontWeight={500}>
        {pool.egUsd ? formatUsd(pool.egUsd) : formatApr(rewardApr)}
      </Text>
      {pool.programs?.length || rewardApr ? <BagIcon height={20} width={20} /> : null}
    </HStack>
  )

  const poolAddressValue = pool.address ? (
    <HStack align="center" gap={4}>
      <Text as="span" color={theme.text} fontWeight={500}>
        {shortenAddress(pool.address, 4)}
      </Text>
      <CopyHelper color={theme.subText} margin="0" size={14} toCopy={pool.address} />
    </HStack>
  ) : (
    '--'
  )

  const topMetrics: TopMetricItem[] = [
    { label: 'TVL', value: tvlValue },
    { label: '24h Volume', value: volumeValue },
    { label: '24h Fees', value: feesValue },
    { label: 'Rewards', value: rewardsValue },
    { label: 'Liquidity', value: liquidityValue },
    { label: 'Pool Address', value: poolAddressValue },
  ]

  return (
    <Stack gap={20}>
      <MetricsStrip>
        {topMetrics.map(metric => (
          <Stack gap={4} key={metric.label} minWidth={0}>
            <EllipsisText color={theme.subText} fontSize={14}>
              {metric.label}
            </EllipsisText>
            <EllipsisText color={theme.text} fontWeight={500}>
              {metric.value}
            </EllipsisText>
          </Stack>
        ))}
      </MetricsStrip>

      <Stack gap={16}>
        <Stack gap={8}>
          <AprSummaryRow width="100%">
            <HStack gap={16} rowGap={12} wrap="wrap">
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

            <SegmentedControl onChange={setAprInterval} options={APR_PERIOD_OPTIONS} value={aprInterval} />
          </AprSummaryRow>

          <HStack align="center" gap={8} wrap="wrap">
            <Text color={theme.text} fontWeight={500}>
              Earning / Active TVL
            </Text>
            <Text color={theme.subText} fontSize={14}>
              (Active APR)
            </Text>
          </HStack>
        </Stack>

        <ActiveAprChart aprInterval={aprInterval} />
      </Stack>
    </Stack>
  )
}

export default InformationTab
