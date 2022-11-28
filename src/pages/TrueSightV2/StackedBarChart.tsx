import { rgba } from 'polished'
import { Text } from 'rebass'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import { ContentType } from 'recharts/types/component/Tooltip'
import styled, { ThemeConsumer } from 'styled-components'

import useTheme from 'hooks/useTheme'

const data = [
  {
    date: 'Nov 21',
    buy: 2610,
    sell: 2590,
  },
  {
    date: 'Nov 22',
    buy: 3000,
    sell: 1398,
  },
  {
    date: 'Nov 23',
    buy: 7900,
    sell: 7000,
  },
  {
    date: 'Nov 24',
    buy: 2780,
    sell: 3908,
  },
  {
    date: 'Nov 25',
    buy: 1890,
    sell: 4800,
  },
  {
    date: 'Nov 26',
    buy: 2390,
    sell: 3800,
  },
  {
    date: 'Nov 27',
    buy: 3490,
    sell: 4300,
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
export default function StakedBarChart() {
  const theme = useTheme()

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart width={500} height={300} data={data}>
        <XAxis
          fontSize="12px"
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fill: theme.subText, fontWeight: 400 }}
        />
        <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          wrapperStyle={{ outline: 'none' }}
          position={{ y: 120 }}
          animationDuration={100}
          content={TooltipCustom}
        />
        <Bar dataKey="sell" stackId="a" fill={rgba(theme.red, 0.4)} />
        <Bar dataKey="buy" stackId="a" fill={rgba(theme.primary, 0.4)} />
      </BarChart>
    </ResponsiveContainer>
  )
}
