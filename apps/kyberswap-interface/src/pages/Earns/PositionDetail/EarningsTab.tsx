import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import {
  DonutChartContainer,
  EarningChartContainer,
  TimeSelector,
  TimeSelectorItem,
} from 'pages/Earns/PositionDetail/styles'
import { ParsedPosition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

type TimePeriod = '24H' | '7D' | '30D'

const CHART_COLORS = {
  lpFee: '#0060af',
  lmRewards: '#37ac9b',
  egSharing: '#ddd671',
  bonus: '#a07cdf',
}

const EARNING_KEYS = [
  { key: 'lpFee', label: 'LP Fee', color: CHART_COLORS.lpFee },
  { key: 'lmRewards', label: 'FF LM Rewards', color: CHART_COLORS.lmRewards },
  { key: 'egSharing', label: 'FF EG Sharing', color: CHART_COLORS.egSharing },
  { key: 'bonus', label: 'Bonus', color: CHART_COLORS.bonus },
]

// Sample data
const SAMPLE_EARNING_DATA = [
  { date: 'Nov 19', lpFee: 1200, lmRewards: 800, egSharing: 520, bonus: 300, total: 2820 },
  { date: 'Nov 20', lpFee: 1850, lmRewards: 1250, egSharing: 950, bonus: 600, total: 5965 },
  { date: 'Nov 21', lpFee: 2650, lmRewards: 600, egSharing: 650, bonus: 1650, total: 7286 },
  { date: 'Nov 22', lpFee: 1800, lmRewards: 2100, egSharing: 450, bonus: 600, total: 6001 },
  { date: 'Nov 23', lpFee: 1200, lmRewards: 2000, egSharing: 600, bonus: 1300, total: 6620 },
  { date: 'Nov 24', lpFee: 2450, lmRewards: 800, egSharing: 2200, bonus: 700, total: 7612 },
  { date: 'Nov 25', lpFee: 1950, lmRewards: 800, egSharing: 1100, bonus: 1750, total: 7345 },
]

const SAMPLE_APR_DATA = [
  { date: 'Nov 19', apr: 35 },
  { date: 'Nov 20', apr: 42 },
  { date: 'Nov 21', apr: 55 },
  { date: 'Nov 22', apr: 48 },
  { date: 'Nov 23', apr: 72 },
  { date: 'Nov 24', apr: 65 },
  { date: 'Nov 25', apr: 62 },
]

const DONUT_DATA = [
  { name: 'LP Fee', value: 2400, color: CHART_COLORS.lpFee },
  { name: 'FF LM Rewards', value: 820, color: CHART_COLORS.lmRewards },
  { name: 'FF EG Sharing', value: 600, color: CHART_COLORS.egSharing },
  { name: 'Bonus', value: 180, color: CHART_COLORS.bonus },
]

// Styled tooltip wrappers
const CustomTooltipWrapper = styled.div`
  background: rgba(49, 49, 49, 0.92);
  border-radius: 8px;
  padding: 8px 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 18px;
`

const TooltipDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`

const LegendDot = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const DonutCenterLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
`

// Custom bar chart tooltip
const BarChartTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <CustomTooltipWrapper>
      <TooltipRow>
        <Text color="#fafafa" fontSize={12} fontWeight={500}>
          {formatDisplayNumber(data.total, { style: 'currency', significantDigits: 3 })}
        </Text>
        <Text color="#737373" fontSize={12}>
          {t`Total Earn`}
        </Text>
      </TooltipRow>
      {EARNING_KEYS.map(({ key, label: keyLabel, color }) => (
        <TooltipRow key={key}>
          <TooltipDot color={color} />
          <Text color="#fafafa" fontSize={12}>
            {formatDisplayNumber(data[key], { style: 'currency', significantDigits: 3 })}
          </Text>
          <Text color="#737373" fontSize={12}>
            {keyLabel}
          </Text>
        </TooltipRow>
      ))}
    </CustomTooltipWrapper>
  )
}

// Custom APR chart tooltip
const AprChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <CustomTooltipWrapper>
      <Text color="#737373" fontSize={12}>
        {label}, 2026
      </Text>
      <Text color="#fafafa" fontSize={12} fontWeight={500}>
        {payload[0]?.value?.toFixed(2)}%
      </Text>
    </CustomTooltipWrapper>
  )
}

// Custom bar label showing total on top
const BarTopLabel = (props: any) => {
  const { x, y, width, value } = props
  if (!value) return null
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill="#737373" fontSize={12}>
      {formatDisplayNumber(value, { style: 'currency', significantDigits: 3 })}
    </text>
  )
}

const EarningsTab = ({
  position: _position,
  initialLoading: _initialLoading,
}: {
  position?: ParsedPosition
  initialLoading?: boolean
}) => {
  const theme = useTheme()
  const [earningPeriod, setEarningPeriod] = useState<TimePeriod>('7D')
  const [aprPeriod, setAprPeriod] = useState<TimePeriod>('7D')

  const donutTotal = useMemo(() => DONUT_DATA.reduce((sum, d) => sum + d.value, 0), [])

  const aprStats = useMemo(
    () => ({
      active: 80.5,
      average: 60.5,
      max: 325.68,
    }),
    [],
  )

  return (
    <EarningChartContainer>
      {/* Header */}
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontSize={18} fontWeight={500} color={theme.text}>
          {t`Earning`}
        </Text>
        <TimeSelector>
          {(['24H', '7D', '30D'] as TimePeriod[]).map(period => (
            <TimeSelectorItem key={period} active={earningPeriod === period} onClick={() => setEarningPeriod(period)}>
              {period}
            </TimeSelectorItem>
          ))}
        </TimeSelector>
      </Flex>

      {/* Stacked Bar Chart */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SAMPLE_EARNING_DATA} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="none" stroke={rgba('#ffffff', 0.06)} vertical={false} />
            <XAxis dataKey="date" fontSize={10} stroke="#a9a9a9" axisLine={false} tickLine={false} />
            <YAxis
              fontSize={10}
              stroke="#a9a9a9"
              axisLine={false}
              tickLine={false}
              orientation="right"
              tickFormatter={val => {
                if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`
                return val.toString()
              }}
              domain={[0, 15000]}
              ticks={[0, 2500, 5000, 7500, 10000, 12500, 15000]}
              width={40}
            />
            <Tooltip content={<BarChartTooltip />} cursor={{ fill: rgba('#ffffff', 0.04) }} />
            <Bar dataKey="lpFee" stackId="earn" fill={CHART_COLORS.lpFee} />
            <Bar dataKey="lmRewards" stackId="earn" fill={CHART_COLORS.lmRewards} />
            <Bar dataKey="egSharing" stackId="earn" fill={CHART_COLORS.egSharing} />
            <Bar dataKey="bonus" stackId="earn" fill={CHART_COLORS.bonus} radius={[2, 2, 0, 0]}>
              {SAMPLE_EARNING_DATA.map((entry, index) => (
                <Cell key={index} />
              ))}
              {/* Labels on top of stacked bars */}
              <BarTopLabel />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Donut Chart + Legend */}
      <DonutChartContainer>
        <div style={{ position: 'relative', width: 164, height: 164, flexShrink: 0 }}>
          <PieChart width={164} height={164}>
            <Pie
              data={DONUT_DATA}
              cx={81}
              cy={81}
              innerRadius={54}
              outerRadius={78}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {DONUT_DATA.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <CustomTooltipWrapper>
                    <Text color="#fafafa" fontSize={12}>
                      {d?.name}: {formatDisplayNumber(d?.value, { style: 'currency', significantDigits: 4 })}
                    </Text>
                  </CustomTooltipWrapper>
                )
              }}
            />
          </PieChart>
          <DonutCenterLabel>
            <Text fontSize={14} color="#737373">
              {t`Total Earn`}
            </Text>
            <Text fontSize={16} fontWeight={500} color="#fafafa">
              {formatDisplayNumber(donutTotal, { style: 'currency', significantDigits: 4 })}
            </Text>
          </DonutCenterLabel>
        </div>

        <Flex flexDirection="column" sx={{ gap: '12px' }}>
          {DONUT_DATA.map(item => (
            <LegendRow key={item.name}>
              <LegendDot color={item.color} />
              <Text fontSize={14} color={theme.subText}>
                {item.name}
              </Text>
              <Text fontSize={16} color={theme.text}>
                {formatDisplayNumber(item.value, { style: 'currency', significantDigits: 4 })}
              </Text>
            </LegendRow>
          ))}
        </Flex>
      </DonutChartContainer>

      {/* APR Stats */}
      <Flex
        alignItems="center"
        justifyContent="flex-end"
        sx={{ gap: '32px', borderTop: `1px solid ${rgba(theme.white, 0.08)}`, paddingTop: '16px', marginTop: '8px' }}
        flexWrap="wrap"
      >
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Active APR`}
          </Text>
          <Text fontSize={14} fontWeight={500} color={theme.text}>
            {aprStats.active}%
          </Text>
        </Flex>
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Average APR`}
          </Text>
          <Text fontSize={14} fontWeight={500} color={theme.text}>
            {aprStats.average}%
          </Text>
        </Flex>
        <Flex alignItems="center" sx={{ gap: '8px' }}>
          <Text fontSize={14} color={theme.subText}>
            {t`Max APR`}
          </Text>
          <Text fontSize={14} fontWeight={500} color={theme.text}>
            {aprStats.max}%
          </Text>
        </Flex>
      </Flex>

      {/* APR Chart Header */}
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" sx={{ gap: '4px' }}>
          <Text fontSize={16} fontWeight={500} color={theme.text}>
            {t`Earning / Active TVL`}
          </Text>
          <Text fontSize={14} color="#737373">
            ({t`Active APR`})
          </Text>
        </Flex>
        <TimeSelector>
          {(['24H', '7D', '30D'] as TimePeriod[]).map(period => (
            <TimeSelectorItem
              key={period}
              active={aprPeriod === period}
              onClick={() => {
                setAprPeriod(period)
                setEarningPeriod(period)
              }}
            >
              {period}
            </TimeSelectorItem>
          ))}
        </TimeSelector>
      </Flex>

      {/* APR Line Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={SAMPLE_APR_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="aprAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.15} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="none" stroke={rgba('#ffffff', 0.06)} vertical={false} />
          <XAxis dataKey="date" fontSize={10} stroke="#a9a9a9" axisLine={false} tickLine={false} />
          <YAxis
            fontSize={10}
            stroke="#a9a9a9"
            axisLine={false}
            tickLine={false}
            orientation="right"
            tickFormatter={val => `${val}%`}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            width={40}
          />
          <Tooltip content={<AprChartTooltip />} cursor={{ stroke: rgba('#ffffff', 0.2), strokeDasharray: '4 4' }} />
          <Area
            type="monotone"
            dataKey="apr"
            stroke={theme.primary}
            fill="url(#aprAreaGradient)"
            strokeWidth={2}
            dot={{ r: 3, fill: theme.primary, stroke: 'none' }}
            activeDot={{ r: 5, fill: theme.primary, stroke: '#0f0f0f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </EarningChartContainer>
  )
}

export default EarningsTab
