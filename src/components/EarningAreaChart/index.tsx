import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Area, AreaChart, Customized, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { EMPTY_FUNCTION } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { TimePeriod } from 'pages/MyEarnings/MyEarningsOverTimePanel/TimePeriodSelect'
import KyberLogo from 'pages/TrueSightV2/components/chart/KyberLogo'
import { EarningStatsTick } from 'types/myEarnings'
import { formatDisplayNumber } from 'utils/numbers'

import TooltipContent from './TooltipContent'

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
        <text
          x={x}
          y={y}
          dx={index ? undefined : 20}
          dy={-10}
          fontSize={12}
          fontWeight={500}
          fill={theme.subText}
          textAnchor="middle"
        >
          {formatDisplayNumber({ value, style: 'currency', fractionDigits: 3 })}
        </text>
      )}
    </>
  )
}

type Props = {
  period: TimePeriod
  setHoverValue?: React.Dispatch<React.SetStateAction<number | null>>
  data: EarningStatsTick[]
}
const EarningAreaChart: React.FC<Props> = ({ data, setHoverValue = EMPTY_FUNCTION, period }) => {
  const theme = useTheme()
  const [containerWidth, setContainerWidth] = useState(0)
  const shouldShowLabel = containerWidth > 400

  return (
    <ResponsiveContainer height="100%" width="100%" onResize={width => setContainerWidth(width)}>
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
        <XAxis
          angle={-30}
          dataKey="date"
          fontSize="12px"
          axisLine={false}
          tickLine={false}
          stroke={theme.subText}
          interval={data.length == 7 ? 0 : data.length == 30 ? 1 : undefined}
        />
        <YAxis
          fontSize="12px"
          axisLine={false}
          tickLine={false}
          stroke={theme.subText}
          tickFormatter={(value: any, _index: number) =>
            formatDisplayNumber({ value, style: 'currency', fractionDigits: 2 })
          }
          width={54}
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
          label={shouldShowLabel ? <CustomizedLabel period={period} /> : undefined}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default EarningAreaChart
