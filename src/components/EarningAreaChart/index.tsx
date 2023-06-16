import { isMobile } from 'react-device-detect'
import { Area, AreaChart, Customized, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import useTheme from 'hooks/useTheme'
import { TimePeriod } from 'pages/MyEarnings/MyEarningsOverTimePanel/TimePeriodSelect'
import KyberLogo from 'pages/TrueSightV2/components/chart/KyberLogo'
import { EarningStatsTick } from 'types/myEarnings'

import TooltipContent from './TooltipContent'
import { formatUSDValue } from './utils'

const labelGapByTimePeriod: Record<TimePeriod, number> = {
  ['7D']: isMobile ? 2 : 1,
  ['1M']: isMobile ? 8 : 3,
  ['6M']: isMobile ? 40 : 20,
  ['1Y']: isMobile ? 90 : 30,
}

const CustomizedLabel = (props: any) => {
  const theme = useTheme()
  const { x, y, value, index, period } = props
  const show = (index + 1) % (labelGapByTimePeriod[period as TimePeriod] || 1) === 0
  return (
    <>
      {show && (
        <text x={x} y={y} dy={-10} fontSize={12} fontWeight={500} fill={theme.subText} textAnchor="middle">
          {formatUSDValue(value)}
        </text>
      )}
    </>
  )
}

const formatter = (value: string) => {
  const num = Number(value)

  const formatter = Intl.NumberFormat('en-US', {
    notation: num > 1000 ? 'compact' : 'standard',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 2,
  })

  return formatter.format(num)
}

const noop = () => {
  // empty
}

type Props = {
  period: TimePeriod
  setHoverValue?: React.Dispatch<React.SetStateAction<number | null>>
  data: EarningStatsTick[]
}
const EarningAreaChart: React.FC<Props> = ({ data, setHoverValue = noop, period }) => {
  const theme = useTheme()

  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart
        data={data}
        margin={{
          top: 20,
          right: 25,
        }}
        onMouseLeave={() => setHoverValue(null)}
      >
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" fontSize="12px" axisLine={false} tickLine={false} stroke={theme.subText} />
        <YAxis
          fontSize="12px"
          axisLine={false}
          tickLine={false}
          stroke={theme.subText}
          tickFormatter={(value: any, _index: number) => formatter(String(value))}
          width={48}
        />
        <Customized component={KyberLogo} />
        <Tooltip
          content={(props: any) => {
            const payload = props.payload as Array<{
              payload: EarningStatsTick
            }>
            const dataEntry = payload?.[0]?.payload // they are all the same

            if (!dataEntry) {
              return null
            }

            return <TooltipContent dataEntry={dataEntry} setHoverValue={setHoverValue} />
          }}
          cursor={true}
        />
        <Area
          type="monotone"
          dataKey="totalValue"
          stroke={theme.primary}
          fill="url(#colorUv)"
          strokeWidth={2}
          label={<CustomizedLabel period={period} />}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default EarningAreaChart
