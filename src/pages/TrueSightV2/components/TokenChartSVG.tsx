import { useMemo } from 'react'

import useTheme from 'hooks/useTheme'

const transformValue = (value: number, [from0, from1]: number[], [to0, to1]: number[]) => {
  return ((value - from0) / (from1 - from0)) * (to1 - to0)
}

export default function TokenChart({ data }: { data?: Array<{ value: number; timestamp: number }> }) {
  const theme = useTheme()
  const formattedData: Array<{ value: number; timestamp: number }> = useMemo(() => {
    if (!data) return []
    const now = Math.floor(Date.now() / 86400000) * 86400
    const tempData = []
    for (let i = 0; i < 7; i++) {
      const dindex = data.findIndex(item => item.timestamp === now - 86400 * i)
      if (dindex >= 0) {
        tempData.push(data[dindex])
      } else {
        tempData.push({ timestamp: now - 86400 * i, value: 0 })
      }
    }
    return tempData
  }, [data])

  if (!formattedData || formattedData.length === 0) return <></>

  const maxData = Math.max(...formattedData.map(item => item.value))
  const minData = Math.min(...formattedData.map(item => item.value))
  const transformedValues = formattedData.map(item =>
    transformValue(item.value, [maxData * 1.1, minData * 0.91], [1, 41]),
  )

  const color = transformedValues[0] > transformedValues[6] ? theme.primary : theme.red
  return (
    <>
      <svg width="142" height="41" viewBox="0 0 142 41" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d={`M1 40V${transformedValues[0]}L24.3333 ${transformedValues[1]}L47.6667 ${transformedValues[2]}L71 ${transformedValues[3]}L94.3333 ${transformedValues[4]}L117.667 ${transformedValues[5]}L141 ${transformedValues[6]}V40H1Z`}
          fill="url(#paint0_linear_4105_68065)"
        />
        <path
          d={`M1 ${transformedValues[0]}L24.3452 ${transformedValues[1]}L47.7616 ${transformedValues[2]}L71.0356 ${transformedValues[3]}L94.3808 ${transformedValues[4]}L117.726 ${transformedValues[5]}L141 ${transformedValues[6]}`}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="1.5" cy={transformedValues[0]} r="1.5" fill={color} />
        <circle cx="24.5" cy={transformedValues[1]} r="1.5" fill={color} />
        <circle cx="47.5" cy={transformedValues[2]} r="1.5" fill={color} />
        <circle cx="70.5" cy={transformedValues[3]} r="1.5" fill={color} />
        <circle cx="94.5" cy={transformedValues[4]} r="1.5" fill={color} />
        <circle cx="116.5" cy={transformedValues[5]} r="1.5" fill={color} />
        <circle cx="140.5" cy={transformedValues[6]} r="1.5" fill={color} />

        <defs>
          <linearGradient id="paint0_linear_4105_68065" x1="71" y1="1" x2="71" y2="41" gradientUnits="userSpaceOnUse">
            <stop stopColor={color} stopOpacity="0.4" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}
