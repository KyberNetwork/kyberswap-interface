import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import useTheme from 'hooks/useTheme'
import { EarningStatsTick } from 'types/myEarnings'

import TooltipContent from './TooltipContent'

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
  setHoverValue?: React.Dispatch<React.SetStateAction<number | null>>
  data: EarningStatsTick[]
}
const EarningAreaChart: React.FC<Props> = ({ data, setHoverValue = noop }) => {
  const theme = useTheme()

  return (
    <ResponsiveContainer height="100%" width="100%">
      <AreaChart
        data={data}
        margin={{
          top: 20,
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
        <Area type="monotone" dataKey="totalValue" stroke={theme.primary} fill="url(#colorUv)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default EarningAreaChart
