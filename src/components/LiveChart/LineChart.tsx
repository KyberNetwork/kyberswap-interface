import React, { PureComponent, useEffect, Dispatch, SetStateAction } from 'react'
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { format, fromUnixTime } from 'date-fns'
import styled from 'styled-components'
import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
const AreaChartWrapper = styled(AreaChart)`
  svg {
    overflow-x: visible;
  }
`
const getDateFormat = (timeFrame: LiveDataTimeframeEnum) => {
  switch (timeFrame) {
    case LiveDataTimeframeEnum.DAY:
      return 'p'
    case LiveDataTimeframeEnum.WEEK:
      return 'p MMM d'
    case LiveDataTimeframeEnum.MONTH:
      return 'p MMM d'
    case LiveDataTimeframeEnum.YEAR:
      return 'p MMM d'
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
  const { payload, points } = props
  if (payload) {
    return (
      <>
        <text x={points[0].x + 5} y={12} fill="#6C7284" fontSize={12} textAnchor="start">
          {format(payload[0].payload.time, 'p MMM d (O)')}
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
}

const LineChart = ({ data, setHoverValue, color }: LineChartProps) => {
  console.log(data)
  return (
    <div>
      <ResponsiveContainer width={480} height={260}>
        {data && data.length > 0 ? (
          <AreaChartWrapper
            data={data}
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
              tickFormatter={time => {
                return typeof time === 'number' ? format(fromUnixTime(time), 'p') : '0'
              }}
            />
            <YAxis dataKey="value" tickLine={false} axisLine={false} domain={['auto', 'auto']} hide />
            <Tooltip
              contentStyle={{ display: 'none' }}
              formatter={(tooltipValue: any, name: string, props: any) => (
                // eslint-disable-next-line react/prop-types
                <HoverUpdater payload={props.payload} setHoverValue={setHoverValue} />
              )}
              cursor={<CustomizedCursor />}
            />
            <Area type="monotone" dataKey="value" stroke={color} fill="url(#colorUv)" strokeWidth={2} />
          </AreaChartWrapper>
        ) : (
          <></>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default React.memo(LineChart)
