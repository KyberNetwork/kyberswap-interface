import { rgba } from 'polished'
import { Text } from 'rebass'
import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'

const data = [
  {
    name: 'Nov 19',
    uv: 4000,
    pv: -2400,
    amt: 1600,
  },
  {
    name: 'Nov 20',
    uv: 3000,
    pv: -1398,
    amt: 1920,
  },
  {
    name: 'Nov 21',
    uv: 2000,
    pv: -1800,
    amt: 200,
  },
  {
    name: 'Nov 22',
    uv: 2780,
    pv: -3908,
    amt: -1200,
  },
  {
    name: 'Nov 23',
    uv: 1890,
    pv: -4800,
    amt: -2181,
  },
  {
    name: 'Nov 24',
    uv: 2390,
    pv: -3800,
    amt: -2500,
  },
  {
    name: 'Nov 25',
    uv: 3490,
    pv: -2300,
    amt: 2100,
  },
]
const TooltipWrapper = styled.div`
  background-color: ${({ theme }) => theme.tableHeader};
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  border-radius: 4px;
  padding: 12px;
  font-size: 14px;
  position: relative;
  ::after {
    content: '';
    position: absolute;
    border-right: 6px solid transparent;
    border-left: 6px solid transparent;
    border-top: 6px solid ${({ theme }) => theme.tableHeader};
    bottom: -6px;
  }
  :active {
    border: none;
  }
`

const TooltipCustom = (props: TooltipProps<number, string>) => {
  const theme = useTheme()

  const payload = props.payload?.[0]?.payload
  if (payload) {
    return (
      <TooltipWrapper>
        <Text
          color={theme.subText}
          paddingBottom="10px"
          marginBottom="10px"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          Total Trades: <span style={{ color: theme.text }}>{payload.buy + payload.sell}</span>
        </Text>
        <Text color={theme.primary} marginBottom="8px">
          Buy: {payload.buy}
        </Text>
        <Text color={theme.red}>Buy: {payload.sell}</Text>
      </TooltipWrapper>
    )
  }
  return null
}

export default function SignedBarChart() {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        width={500}
        height={300}
        data={data}
        stackOffset="sign"
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis fontSize="12px" dataKey="name" tickLine={false} axisLine={false} />
        <YAxis fontSize="12px" tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          wrapperStyle={{ outline: 'none' }}
          position={{ y: 60 }}
          animationDuration={100}
          content={TooltipCustom}
        />
        <ReferenceLine y={0} stroke="#000" />
        <Bar dataKey="pv" fill={rgba(theme.red, 0.4)} stackId="stack" />
        <Bar dataKey="uv" fill={rgba(theme.primary, 0.4)} stackId="stack" />
        <Line dataKey="amt" type="linear" stroke={theme.primary} strokeWidth={4} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
