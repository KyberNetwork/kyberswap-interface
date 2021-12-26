import React, { useEffect, useMemo } from 'react'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import styled from 'styled-components'
import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
const AreaChartWrapper = styled(AreaChart)`
  svg {
    overflow-x: visible;
  }
`
const getDateFormat = (timeFrame: LiveDataTimeframeEnum | undefined) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.HOUR:
      return 'p'
    case LiveDataTimeframeEnum.DAY:
      return 'p'
    case LiveDataTimeframeEnum.WEEK:
      return 'p MMM d'
    case LiveDataTimeframeEnum.MONTH:
      return 'MMM d'
    case LiveDataTimeframeEnum.YEAR:
      return 'MMM d'
    default:
      return 'p MMM d'
  }
}

const HoverUpdater = ({
  payload,
  setHoverValue
}: {
  payload: any
  setHoverValue: React.Dispatch<React.SetStateAction<number>>
}) => {
  useEffect(() => {
    setHoverValue(payload.value)
  }, [payload.value, payload.time, setHoverValue])

  return null
}

const CustomizedCursor = (props: any) => {
  const { payload, points, timeFrame, width } = props
  const isTextAnchorStart = width - points[0].x > 100
  if (payload) {
    return (
      <>
        <text
          x={points[0].x + (isTextAnchorStart ? 5 : -5)}
          y={12}
          fill="#6C7284"
          fontSize={12}
          textAnchor={isTextAnchorStart ? 'start' : 'end'}
        >
          {format(payload[0].payload.time, getDateFormat(timeFrame) + ' (O)')}
        </text>
        <line x1={points[0].x} y1={0} x2={points[1].x} y2={points[1].y} stroke="#6C7284" width={2} />
      </>
    )
  } else {
    return <></>
  }
}

interface LineChartProps {
  data: any
  setHoverValue: React.Dispatch<React.SetStateAction<number>>
  color: string
  timeFrame?: LiveDataTimeframeEnum
}

const LineChart = ({ data, setHoverValue, color, timeFrame }: LineChartProps) => {
  const formattedData = useMemo(() => {
    return data.filter((item: any) => !!item.value)
  }, [data])
  const dataMax = useMemo(() => Math.max(...formattedData.map((item: any) => parseFloat(item.value))), [formattedData])
  const dataMin = useMemo(() => Math.min(...formattedData.map((item: any) => parseFloat(item.value))), [formattedData])
  return (
    <ResponsiveContainer minHeight={200}>
      {formattedData && formattedData.length > 0 ? (
        <AreaChartWrapper
          data={formattedData}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5
          }}
          onMouseLeave={() => setHoverValue(0)}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            fontSize={'12px'}
            fontWeight={600}
            tickLine={false}
            axisLine={false}
            domain={[formattedData[0]?.time || 'auto', data[formattedData.length - 1]?.time || 'auto']}
            interval="preserveStartEnd"
            tickFormatter={time => {
              return typeof time === 'number' ? format(new Date(time), getDateFormat(timeFrame)) : '0'
            }}
          />
          <YAxis
            dataKey="value"
            tickLine={false}
            axisLine={false}
            domain={[dataMin || 'auto', dataMax || 'auto']}
            hide
          />
          <Tooltip
            contentStyle={{ display: 'none' }}
            formatter={(tooltipValue: any, name: string, props: any) => (
              // eslint-disable-next-line react/prop-types
              <HoverUpdater payload={props.payload} setHoverValue={setHoverValue} />
            )}
            cursor={<CustomizedCursor timeFrame={timeFrame} />}
          />
          <Area type="monotone" dataKey="value" stroke={color} fill="url(#colorUv)" strokeWidth={2} />
        </AreaChartWrapper>
      ) : (
        <></>
      )}
    </ResponsiveContainer>
  )
}

export default React.memo(LineChart)
