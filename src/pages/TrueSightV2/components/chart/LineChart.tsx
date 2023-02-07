import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

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

export default function LineChart() {
  const theme = useTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        width={500}
        height={400}
        data={data}
        margin={{
          top: 40,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis fontSize="12px" dataKey="date" tickLine={false} axisLine={false} />
        <YAxis fontSize="12px" tickLine={false} axisLine={false} />
        <Area type="monotone" dataKey="buy" stroke={theme.primary} fill="url(#colorUv)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
