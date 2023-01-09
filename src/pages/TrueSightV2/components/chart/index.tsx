import dayjs from 'dayjs'
import { rgba } from 'polished'
import React, { useMemo, useRef, useState } from 'react'
import { Text } from 'rebass'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import styled, { css } from 'styled-components'

import Icon from 'components/Icons/Icon'
import { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import {
  useNetflowToCEX,
  useNetflowToWhaleWallets,
  useNumberOfHolders,
  useNumberOfTrades,
  useTradingVolume,
} from 'pages/TrueSightV2/hooks/useTokenDetailsData'

import { ContentWrapper } from '..'
import HoldersPieChart from './HoldersPieChart'
import LineChart from './LineChart'
import SignedBarChart from './SignedBarChart'

const ChartWrapper = styled(ContentWrapper)`
  padding: 10px 0;
  border-radius: 20px;
  height: 400px;
`

const LegendWrapper = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  z-index: 10;
  user-select: none;

  > * {
    cursor: pointer;
  }
`

const LegendButtonWrapper = styled.div<{ enabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.1s ease-out;
  :active {
    transform: scale(1.06);
  }
  :hover {
    filter: brightness(1.5);
  }
  ${({ enabled }) =>
    enabled
      ? css`
          opacity: 1;
        `
      : css`
          opacity: 0.5;
        `};
`

const LegendButton = ({
  enabled,
  onClick,
  text,
  iconStyle,
}: {
  enabled?: boolean
  onClick?: () => void
  text?: string
  iconStyle?: React.CSSProperties
}) => {
  const theme = useTheme()
  return (
    <LegendButtonWrapper enabled={enabled} onClick={onClick}>
      <div
        style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.primary, ...iconStyle }}
      />
      <Text fontSize={12} fontWeight={500}>
        {text || 'Legend text'}
      </Text>
    </LegendButtonWrapper>
  )
}

const ShortLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.primary }} />
      <Text fontSize={12} fontWeight={500}>
        Short
      </Text>
    </RowFit>
  )
}

const LongLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '16px', width: '16px', borderRadius: '8px', backgroundColor: theme.red }} />
      <Text fontSize={12} fontWeight={500}>
        Long
      </Text>
    </RowFit>
  )
}

const PriceLegend = ({ enabled, onClick }: { enabled?: boolean; onClick?: () => void }) => {
  const theme = useTheme()
  return (
    <RowFit gap="4px" style={{ cursor: 'pointer' }}>
      <div style={{ height: '4px', width: '16px', borderRadius: '8px', backgroundColor: theme.blue }} />
      <Text fontSize={12} fontWeight={500}>
        Price
      </Text>
    </RowFit>
  )
}

const TimeFrameWrapper = styled.div`
  height: 28px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  position: relative;
  background-color: ${({ theme }) => theme.buttonBlack};
  border: 2px solid ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
`
const Element = styled.div<{ active?: boolean }>`
  padding: 6px 12px;
  z-index: 2;
  ${({ active, theme }) => active && `color: ${theme.text};`}
  :hover {
    filter: brightness(1.2);
  }
`

const ActiveElement = styled.div<{ left?: number; width?: number }>`
  width: 40px;
  height: 24px;
  border-radius: 20px;
  position: absolute;
  left: 0;
  background-color: ${({ theme }) => theme.tableHeader};
  z-index: 1;
  transition: all 0.2s ease;
  :hover {
    filter: brightness(1.2);
  }

  ${({ left, width }) => css`
    transform: translateX(${left ?? 0}px);
    width: ${width || 40}px;
  `}
`

const TimeFrameLegend = ({
  selected,
  timeframes,
  onSelect,
}: {
  selected: string
  timeframes: string[]
  onSelect: (timeframe: string) => void
}) => {
  const refs = useRef<any>({})
  if (timeframes?.length < 1) return null
  return (
    <TimeFrameWrapper>
      {timeframes.map((t: string, index: number) => {
        return (
          <Element
            key={index}
            ref={el => {
              refs.current[t] = el
            }}
            onClick={() => onSelect?.(t)}
            active={selected === t}
          >
            {t}
          </Element>
        )
      })}
      <ActiveElement left={refs.current?.[selected]?.offsetLeft} />
    </TimeFrameWrapper>
  )
}

const FullscreenButton = () => {
  const theme = useTheme()
  return (
    <div style={{ color: theme.subText }}>
      <Icon id="fullscreen" />
    </div>
  )
}

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

export const NumberofTradesChart = () => {
  const { data } = useNumberOfTrades('123')
  const [showSell, setShowSell] = useState(true)
  const [showBuy, setShowBuy] = useState(true)
  const [timeframe, setTimeframe] = useState('7D')
  const formattedData = useMemo(
    () =>
      data?.trades.map(item => {
        return {
          ...item,
          sell: showSell ? item.sell : undefined,
          buy: showBuy ? item.buy : undefined,
        }
      }),
    [data, showSell, showBuy],
  )
  const theme = useTheme()
  return (
    <ChartWrapper>
      <LegendWrapper>
        <LegendButton
          text="Buy"
          iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
          enabled={showBuy}
          onClick={() => setShowBuy(prev => !prev)}
        />
        <LegendButton
          text="Sell"
          iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
          enabled={showSell}
          onClick={() => setShowSell(prev => !prev)}
        />
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={500} height={300} data={formattedData} margin={{ top: 40, right: 30 }}>
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 120 }}
            animationDuration={100}
            content={TooltipCustom}
          />
          <Bar dataKey="sell" stackId="a" fill={rgba(theme.red, 0.6)} />
          <Bar dataKey="buy" stackId="a" fill={rgba(theme.primary, 0.6)} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const TradingVolumeChart = () => {
  const theme = useTheme()
  const { data } = useTradingVolume('124124')
  const [timeframe, setTimeframe] = useState('7D')
  const filteredData = useMemo(() => {
    switch (timeframe) {
      case '1D':
      case '7D':
        return data?.slice(data.length - 8, data.length - 1)
      default:
        return data
    }
  }, [data, timeframe])

  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={400}
          data={filteredData}
          margin={{
            top: 40,
            right: 40,
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
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
          <Area type="monotone" dataKey="volume" stroke={theme.primary} fill="url(#colorUv)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const NetflowToWhaleWallets = () => {
  const { data } = useNetflowToWhaleWallets('123')
  const [showInflow, setShowInflow] = useState(true)
  const [showOutflow, setShowOutflow] = useState(true)
  const [showNetflow, setShowNetflow] = useState(true)
  const [timeframe, setTimeframe] = useState('7D')
  const formattedData = useMemo(
    () =>
      data?.map(item => {
        return {
          ...item,
          inflow: showInflow ? item.inflow : undefined,
          outflow: showOutflow ? -item.outflow : undefined,
          netflow: showNetflow ? item.netflow : undefined,
        }
      }),
    [data, showInflow, showOutflow, showNetflow],
  )
  const theme = useTheme()
  return (
    <ChartWrapper>
      <LegendWrapper>
        <LegendButton
          text="Inflow"
          iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
          enabled={showInflow}
          onClick={() => setShowInflow(prev => !prev)}
        />
        <LegendButton
          text="Outflow"
          iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
          enabled={showOutflow}
          onClick={() => setShowOutflow(prev => !prev)}
        />
        <LegendButton
          text="Netflow"
          iconStyle={{ height: '4px', width: '16px', borderRadius: '8px', backgroundColor: rgba(theme.primary, 0.8) }}
          enabled={showNetflow}
          onClick={() => setShowNetflow(prev => !prev)}
        />
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart width={500} height={300} data={formattedData} stackOffset="sign" margin={{ top: 40, right: 30 }}>
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 120 }}
            animationDuration={100}
            content={TooltipCustom}
          />
          <Bar dataKey="inflow" stackId="a" fill={rgba(theme.primary, 0.6)} />
          <Bar dataKey="outflow" stackId="a" fill={rgba(theme.red, 0.6)} />
          <Line type="linear" dataKey="netflow" stroke={theme.primary} strokeWidth={3} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const NetflowToCentralizedExchanges = () => {
  const { data } = useNetflowToCEX('123')
  const [showInflow, setShowInflow] = useState(true)
  const [showOutflow, setShowOutflow] = useState(true)
  const [showNetflow, setShowNetflow] = useState(true)
  const [timeframe, setTimeframe] = useState('7D')
  const formattedData = useMemo(
    () =>
      data?.map(item => {
        return {
          ...item,
          inflow: showInflow ? item.inflow : undefined,
          outflow: showOutflow ? -item.outflow : undefined,
          netflow: showNetflow ? item.netflow : undefined,
        }
      }),
    [data, showInflow, showOutflow, showNetflow],
  )
  const theme = useTheme()
  return (
    <ChartWrapper>
      <LegendWrapper>
        <LegendButton
          text="Inflow"
          iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
          enabled={showInflow}
          onClick={() => setShowInflow(prev => !prev)}
        />
        <LegendButton
          text="Outflow"
          iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
          enabled={showOutflow}
          onClick={() => setShowOutflow(prev => !prev)}
        />
        <LegendButton
          text="Netflow"
          iconStyle={{ height: '4px', width: '16px', borderRadius: '8px', backgroundColor: rgba(theme.primary, 0.8) }}
          enabled={showNetflow}
          onClick={() => setShowNetflow(prev => !prev)}
        />
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '3D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart width={500} height={300} data={formattedData} stackOffset="sign" margin={{ top: 40, right: 30 }}>
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 120 }}
            animationDuration={100}
            content={TooltipCustom}
          />
          <Bar dataKey="inflow" stackId="a" fill={rgba(theme.primary, 0.6)} />
          <Bar dataKey="outflow" stackId="a" fill={rgba(theme.red, 0.6)} />
          <Line type="linear" dataKey="netflow" stroke={theme.primary} strokeWidth={3} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const NumberofTransfers = () => {
  const [timeframe, setTimeframe] = useState('7D')
  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <LineChart />
    </ChartWrapper>
  )
}

export const NumberofHolders = () => {
  const theme = useTheme()
  const { data } = useNumberOfHolders('124124')
  const [timeframe, setTimeframe] = useState('7D')
  const filteredData = useMemo(() => {
    switch (timeframe) {
      case '1D':
      case '7D':
        return data?.slice(data.length - 8, data.length - 1)
      default:
        return data
    }
  }, [data, timeframe])

  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M', '3M']} />
        <FullscreenButton />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={400}
          data={filteredData}
          margin={{
            top: 40,
            right: 40,
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
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis fontSize="12px" tickLine={false} axisLine={false} tick={{ fill: theme.subText, fontWeight: 400 }} />
          <Area type="monotone" dataKey="count" stroke={theme.primary} fill="url(#colorUv)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const HoldersChartWrapper = () => {
  return (
    <ChartWrapper>
      <HoldersPieChart />
    </ChartWrapper>
  )
}

export const LiquidOnCentralizedExchanges = ({ style }: { style?: React.CSSProperties }) => {
  const [timeframe, setTimeframe] = useState('7D')
  return (
    <ChartWrapper style={style}>
      <LegendWrapper>
        <ShortLegend />
        <LongLegend />
        <PriceLegend />
        <TimeFrameLegend selected={timeframe} onSelect={setTimeframe} timeframes={['1D', '7D', '1M']} />
        <FullscreenButton />
      </LegendWrapper>
      <SignedBarChart />
    </ChartWrapper>
  )
}
