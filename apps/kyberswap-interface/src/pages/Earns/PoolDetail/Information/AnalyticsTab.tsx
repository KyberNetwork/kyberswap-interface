import { useState } from 'react'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow } from 'services/zapEarn'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import LiquidityFlowsChart from 'pages/Earns/PoolDetail/components/LiquidityFlowsChart'
import PoolPriceChart from 'pages/Earns/PoolDetail/components/PoolPriceChart'
import { usePoolDetailContext } from 'pages/Earns/PoolDetail/context'

import { formatAnalyticsNumber, formatAnalyticsUsd } from './utils'

const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonGray};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: repeat(2, minmax(0, 1fr));
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
  `}
`

const AnalyticsTab = () => {
  const theme = useTheme()
  const { pool } = usePoolDetailContext()

  const [priceWindow, setPriceWindow] = useState<PoolAnalyticsWindow>('7d')
  const [liquidityFlowsWindow, setLiquidityFlowsWindow] = useState<PoolAnalyticsWindow>('7d')
  const [currentTvl, setCurrentTvl] = useState<number | undefined>()

  const handleLiquidityFlowsWindowChange = (value: PoolAnalyticsWindow) => {
    setCurrentTvl(undefined)
    setLiquidityFlowsWindow(value)
  }

  let totalTvl = pool.tvl ?? pool.poolStats?.tvl

  if (totalTvl === undefined && pool.reserveUsd !== undefined) {
    const parsedReserveUsd = Number(pool.reserveUsd)

    totalTvl = Number.isNaN(parsedReserveUsd) ? undefined : parsedReserveUsd
  }

  const metrics = [
    { label: 'TVL', value: formatAnalyticsUsd(totalTvl) },
    { label: 'Current TVL', value: formatAnalyticsUsd(currentTvl ?? totalTvl) },
    { label: 'Liquidity Provider', value: formatAnalyticsNumber(pool.liquidity) },
  ]

  return (
    <Stack gap={20}>
      <MetricsStrip>
        {metrics.map(metric => (
          <Stack gap={4} key={metric.label} minWidth={0}>
            <Text color={theme.subText} fontSize={14}>
              {metric.label}
            </Text>
            <Text color={theme.text} fontWeight={500}>
              {metric.value}
            </Text>
          </Stack>
        ))}
      </MetricsStrip>

      <PoolPriceChart onSelectWindow={setPriceWindow} window={priceWindow} />

      <LiquidityFlowsChart
        onCurrentTvlChange={setCurrentTvl}
        onSelectWindow={handleLiquidityFlowsWindowChange}
        window={liquidityFlowsWindow}
      />
    </Stack>
  )
}

export default AnalyticsTab
