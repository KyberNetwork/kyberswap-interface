import { t } from '@lingui/macro'
import { Flex } from 'rebass'
import {
  Bar,
  BarChart,
  LabelList,
  Legend as RechartsLegend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import useTheme from 'hooks/useTheme'
import { EarningStatsAtTime } from 'types/myEarnings'

import Legend from './Legend'
import TooltipContent from './TooltipContent'
import { formatUSDValue } from './utilts'

type Props = {
  data: EarningStatsAtTime[]
}

type KeyOfDataEntry = keyof Pick<EarningStatsAtTime, 'pool' | 'farm'>

type DisplayConfig = Record<
  KeyOfDataEntry,
  {
    legend: string
    color: string
  }
>

export const displayConfig: DisplayConfig = {
  pool: {
    legend: t`Pool Rewards`,
    color: '#3498db',
  },
  farm: {
    legend: t`Farm Rewards`,
    color: '#1abc9c',
  },
}

const renderLegend = () => {
  return (
    <Flex
      width="100%"
      justifyContent="center"
      sx={{
        gap: '16px',
      }}
    >
      <Legend color={displayConfig['farm'].color} label={displayConfig['farm'].legend} />
      <Legend color={displayConfig['pool'].color} label={displayConfig['pool'].legend} />
    </Flex>
  )
}

type TooltipProps = {
  payload: Array<{
    payload: EarningStatsAtTime
  }>
}
const renderTooltip = (props: any) => {
  const payload = (props as TooltipProps).payload
  const dataEntry = payload[0]?.payload // they are all the same

  if (!dataEntry) {
    return null
  }

  return <TooltipContent dataEntry={dataEntry} />
}

const EarningBarChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme()

  return (
    <ResponsiveContainer>
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 20,
        }}
      >
        <XAxis dataKey="date" fontSize="12px" axisLine={false} tickLine={false} stroke={theme.subText} />
        <YAxis fontSize="12px" axisLine={false} tickLine={false} stroke={theme.subText} />
        <Tooltip content={renderTooltip} cursor={false} />
        <RechartsLegend content={renderLegend} />
        <Bar dataKey="pool.totalValue" stackId="a" fill={displayConfig.pool.color} />
        <Bar dataKey="farm.totalValue" stackId="a" fill={displayConfig.farm.color}>
          <LabelList
            dataKey="total"
            position="top"
            fill={theme.subText}
            color={theme.subText}
            fontSize="14px"
            fontWeight={500}
            formatter={(value: number) => formatUSDValue(value)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default EarningBarChart
