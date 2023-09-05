import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { Text } from 'rebass'

import Column from 'components/Column'
import useTheme from 'hooks/useTheme'

import { formatTokenPrice } from '../utils'
import SimpleTooltip from './SimpleTooltip'

const transformValue = (value: number, [from0, from1]: number[], [to0, to1]: number[]) => {
  return ((value - from0) / (from1 - from0 || 1)) * (to1 - to0)
}

const PathHandleHover = ({
  x,
  active,
  onMouseOver,
}: {
  x: number | string
  active: boolean
  onMouseOver: (e: any) => void
}) => {
  return (
    <path d={`M${x},0 v50`} stroke={active ? '#ffffff90' : '#ffffff00'} strokeWidth={1} onMouseOver={onMouseOver} />
  )
}
export default function TokenChart({
  data,
  width,
  index,
}: {
  data?: Array<{ value: number; timestamp: number }>
  width?: string
  index: number | string
}) {
  const theme = useTheme()
  const ref = useRef<SVGSVGElement>(null)
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null)
  const [{ x, y }, setXY] = useState({ x: 0, y: 0 })
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
    return tempData.sort((a, b) => a.timestamp - b.timestamp)
  }, [data])

  if (!formattedData || formattedData.length === 0) return <></>

  const maxData = Math.max(...formattedData.map(item => item.value))
  const minData = Math.min(...formattedData.map(item => item.value))
  const transformedValues = formattedData.map(item =>
    transformValue(item.value, [maxData * 1.1, minData * 0.91], [1, 41]),
  )

  const color = transformedValues[0] >= transformedValues[6] ? theme.primary : theme.red

  const handleMouseHover = (e: any, index: number) => {
    setHoveringIndex(index)
    if (!!ref.current?.getBoundingClientRect?.()) {
      setXY({ x: e.clientX, y: ref.current.getBoundingClientRect().y + 5 })
    }
  }

  return (
    <>
      <svg
        width={width || '142'}
        height="41"
        viewBox="0 0 142 41"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={() => {
          setHoveringIndex(null)
          setXY({ x: 0, y: 0 })
        }}
        ref={ref}
        preserveAspectRatio="none"
      >
        <path
          d={`M1 40V${transformedValues[0]}L24.3333 ${transformedValues[1]}L47.6667 ${transformedValues[2]}L71 ${transformedValues[3]}L94.3333 ${transformedValues[4]}L117.667 ${transformedValues[5]}L141 ${transformedValues[6]}V40H1Z`}
          fill={`url(#paint0_linear_4105_68065${index})`}
        />
        <path
          d={`M1 ${transformedValues[0]}L24.3452 ${transformedValues[1]}L47.7616 ${transformedValues[2]}L71.0356 ${transformedValues[3]}L94.3808 ${transformedValues[4]}L117.726 ${transformedValues[5]}L141 ${transformedValues[6]}`}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="1.5" cy={transformedValues[0]} r={hoveringIndex === 0 ? '3' : '1.5'} fill={color} />
        <circle cx="24.3" cy={transformedValues[1]} r={hoveringIndex === 1 ? '3' : '1.5'} fill={color} />
        <circle cx="47.6" cy={transformedValues[2]} r={hoveringIndex === 2 ? '3' : '1.5'} fill={color} />
        <circle cx="71" cy={transformedValues[3]} r={hoveringIndex === 3 ? '3' : '1.5'} fill={color} />
        <circle cx="94.3" cy={transformedValues[4]} r={hoveringIndex === 4 ? '3' : '1.5'} fill={color} />
        <circle cx="117.7" cy={transformedValues[5]} r={hoveringIndex === 5 ? '3' : '1.5'} fill={color} />
        <circle cx="140.5" cy={transformedValues[6]} r={hoveringIndex === 6 ? '3' : '1.5'} fill={color} />
        <PathHandleHover x="1.5" active={hoveringIndex === 0} onMouseOver={e => handleMouseHover(e, 0)} />
        <PathHandleHover x="24.3" active={hoveringIndex === 1} onMouseOver={e => handleMouseHover(e, 1)} />
        <PathHandleHover x="47.6" active={hoveringIndex === 2} onMouseOver={e => handleMouseHover(e, 2)} />
        <PathHandleHover x="71" active={hoveringIndex === 3} onMouseOver={e => handleMouseHover(e, 3)} />
        <PathHandleHover x="94.3" active={hoveringIndex === 4} onMouseOver={e => handleMouseHover(e, 4)} />
        <PathHandleHover x="117.7" active={hoveringIndex === 5} onMouseOver={e => handleMouseHover(e, 5)} />
        <PathHandleHover x="140.5" active={hoveringIndex === 6} onMouseOver={e => handleMouseHover(e, 6)} />

        <defs>
          <linearGradient
            id={`paint0_linear_4105_68065${index}`}
            x1="71"
            y1="1"
            x2="71"
            y2="41"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={color} stopOpacity="0.4" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {hoveringIndex !== null && (
        <SimpleTooltip
          x={x}
          y={y}
          text={
            <Column style={{ color: theme.subText, fontSize: '12px', lineHeight: '16px' }} gap="2px">
              <Text>
                {/* {hoveringItem?.created_at && dayjs(hoveringItem?.created_at * 1000).format('DD/MM/YYYY hh:mm A')} */}
                {dayjs(formattedData[hoveringIndex]?.timestamp * 1000).format('DD/MM/YYYY hh:mm A')}
              </Text>
              <Text>
                <Trans>Token Price</Trans>:{' '}
                <span style={{ color: theme.text }}>{'$' + formatTokenPrice(formattedData[hoveringIndex].value)}</span>
              </Text>
            </Column>
          }
        />
      )}
    </>
  )
}
