import dayjs from 'dayjs'
import { commify } from 'ethers/lib/utils'
import { rgba } from 'polished'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Customized,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Row, { RowBetween } from 'components/Row'
import {
  ChartingLibraryWidgetOptions,
  EntityId,
  IChartingLibraryWidget,
  LanguageCode,
  ResolutionString,
} from 'components/TradingViewChart/charting_library'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { NUMBER_OF_HOLDERS, NUMBER_OF_TRANSFERS } from 'pages/TrueSightV2/hooks/sampleData'
import {
  useCexesLiquidationQuery,
  useNetflowToCEXQuery,
  useNetflowToWhaleWalletsQuery,
  useNumberOfHoldersQuery,
  useTradingVolumeQuery,
  useTransferInformationQuery,
} from 'pages/TrueSightV2/hooks/useTruesightV2Data'
import { testParams } from 'pages/TrueSightV2/pages/SingleToken'
import { TechnicalAnalysisContext } from 'pages/TrueSightV2/pages/TechnicalAnalysis'
import { ChartTab, INetflowToWhaleWallets, ISRLevel, ITradingVolume, KyberAITimeframe } from 'pages/TrueSightV2/types'
import { useUserLocale } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { shortenAddress } from 'utils'

import { ContentWrapper } from '..'
import KyberLogo from './KyberLogo'
import { useDatafeed } from './datafeed'

const CHART_RED_COLOR = '#773242'
const CHART_GREEN_COLOR = '#246250'

const ChartWrapper = styled(ContentWrapper)`
  flex: 1;
  min-height: 0;
`

const LegendWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  z-index: 10;
  user-select: none;

  > * {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left:0;
    justify-content: center;
    > * {
      flex: 1;
    }
  `}
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
    filter: brightness(1.4);
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
const Element = styled.div<{ active?: boolean; count?: number }>`
  padding: 6px 12px;
  width: calc(100% / ${({ count }) => count || 1});
  z-index: 2;
  display: flex;
  justify-content: center;
  text-transform: uppercase;
  ${({ active, theme }) => active && `color: ${theme.text};`}
  :hover {
    filter: brightness(1.2);
  }
`

const ActiveElement = styled.div<{ left?: number; width?: number }>`
  width: 25%;
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

export const TimeFrameLegend = ({
  selected,
  timeframes,
  onSelect,
}: {
  selected: string
  timeframes: KyberAITimeframe[]
  onSelect: (timeframe: KyberAITimeframe) => void
}) => {
  const refs = useRef<any>({})
  if (timeframes?.length < 1) return null
  return (
    <TimeFrameWrapper>
      {timeframes.map((t: KyberAITimeframe, index: number) => {
        return (
          <Element
            key={index}
            ref={el => {
              refs.current[t] = el
            }}
            onClick={() => onSelect?.(t)}
            active={selected === t}
            count={timeframes.length}
          >
            {t}
          </Element>
        )
      })}
      <ActiveElement left={refs.current?.[selected]?.offsetLeft} width={refs.current?.[selected]?.offsetWidth} />
    </TimeFrameWrapper>
  )
}

const TooltipWrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack + 'F3'};
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  :active {
    border: none;
  }
`

export const ANIMATION_DELAY = 500
export const ANIMATION_DURATION = 1000

const formatNum = (num: number, fixed = 1): string => {
  const negative = num < 0
  const absNum = Math.abs(num)
  let formattedNum = ''
  if (absNum > 1000000) {
    formattedNum = (+(absNum / 1000000).toFixed(fixed)).toString() + 'M'
  } else if (absNum > 1000) {
    formattedNum = (+(absNum / 1000).toFixed(fixed)).toString() + 'K'
  } else {
    formattedNum = (+absNum.toFixed(fixed)).toString()
  }

  return (negative ? '-' : '') + formattedNum
}

export const NumberofTradesChart = () => {
  const theme = useTheme()
  const { address } = useParams()
  const [timeframe, setTimeframe] = useState(KyberAITimeframe.ONE_MONTH)
  const [showSell, setShowSell] = useState(true)
  const [showBuy, setShowBuy] = useState(true)
  const [showTotalTrade, setShowTotalTrade] = useState(true)

  const [from, to, timerange] = useMemo(() => {
    const now = Math.floor(Date.now() / 60000) * 60
    const timerange =
      {
        [KyberAITimeframe.ONE_DAY]: 3600,
        [KyberAITimeframe.ONE_WEEK]: 86400,
        [KyberAITimeframe.ONE_MONTH]: 86400,
        [KyberAITimeframe.THREE_MONTHS]: 86400,
      }[timeframe as string] || 86400
    const from =
      now -
      ({
        [KyberAITimeframe.ONE_DAY]: 86400,
        [KyberAITimeframe.ONE_WEEK]: 604800,
        [KyberAITimeframe.ONE_MONTH]: 2592000,
        [KyberAITimeframe.THREE_MONTHS]: 7776000,
      }[timeframe as string] || 604800)
    return [from, now, timerange]
  }, [timeframe])
  const { data } = useTradingVolumeQuery({ tokenAddress: address, params: { from, to } })

  const formattedData = useMemo(() => {
    if (!data) return []
    const datatemp: ITradingVolume[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const index = data.findIndex(item => item.timestamp === t)
      if (index >= 0) {
        datatemp.push({ ...data[index], sell: -data[index].sell })
      } else {
        datatemp.push({ timestamp: t, buy: 0, buyVolume: 0, sell: 0, sellVolume: 0, totalVolume: 0, totalTrade: 0 })
      }
    }
    return datatemp
  }, [data, timerange, from, to])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <>
      <ChartWrapper>
        <LegendWrapper>
          {above768 && (
            <>
              <LegendButton
                text="Buys"
                iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                enabled={showBuy}
                onClick={() => setShowBuy(prev => !prev)}
              />
              <LegendButton
                text="Sells"
                iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                enabled={showSell}
                onClick={() => setShowSell(prev => !prev)}
              />
              <LegendButton
                text="Total Trade"
                iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
                enabled={showTotalTrade}
                onClick={() => setShowTotalTrade(prev => !prev)}
              />
            </>
          )}
          <TimeFrameLegend
            selected={timeframe}
            onSelect={setTimeframe}
            timeframes={[
              KyberAITimeframe.ONE_DAY,
              KyberAITimeframe.ONE_WEEK,
              KyberAITimeframe.ONE_MONTH,
              KyberAITimeframe.THREE_MONTHS,
            ]}
          />
        </LegendWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={500}
            height={400}
            data={formattedData}
            margin={{
              top: 50,
              left: 20,
              right: 20,
            }}
            stackOffset="sign"
          >
            <CartesianGrid
              vertical={false}
              strokeWidth={1}
              stroke={rgba(theme.border, 0.5)}
              shapeRendering="crispEdges"
            />
            <Customized component={KyberLogo} />
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
              tickFormatter={value =>
                dayjs(value * 1000).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')
              }
            />
            <YAxis
              fontSize="12px"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              width={20}
              tickFormatter={value => `${formatNum(value)}`}
            />
            <YAxis
              yAxisId="right"
              fontSize="12px"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              width={20}
              orientation="right"
              tickFormatter={value => `${formatNum(value)}`}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ outline: 'none' }}
              position={{ y: 120 }}
              animationDuration={100}
              content={props => {
                const payload = props.payload?.[0]?.payload
                if (!payload) return <></>
                return (
                  <TooltipWrapper>
                    <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                      {payload.timestamp && dayjs(payload.timestamp * 1000).format('MMM DD, YYYY')}
                    </Text>
                    <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                      Total Trades: <span style={{ color: theme.text }}>{formatNum(payload.totalTrade, 2)}</span>
                    </Text>
                    <RowBetween fontSize="12px" lineHeight="16px" color={theme.primary}>
                      <Text>Buys:</Text> <Text>{formatNum(payload.buy, 2)}</Text>
                    </RowBetween>
                    <RowBetween fontSize="12px" lineHeight="16px" color={theme.red}>
                      <Text>Sells:</Text> <Text>{formatNum(-payload.sell, 2)}</Text>
                    </RowBetween>
                  </TooltipWrapper>
                )
              }}
            />
            {showSell && (
              <Bar
                dataKey="sell"
                stackId="a"
                fill={rgba(theme.red, 0.6)}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
            )}
            {showBuy && (
              <Bar
                dataKey="buy"
                stackId="a"
                fill={rgba(theme.primary, 0.6)}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
            )}
            {showTotalTrade && (
              <Line
                yAxisId="right"
                dataKey="totalTrade"
                stroke={theme.text}
                width={2}
                dot={false}
                {...{
                  label: ({ x, y, value }: { x: number; y: number; value: number }) => {
                    return (
                      <text x={x} y={y} dy={-8} fontSize={12} fontWeight={500} fill={theme.text} textAnchor="middle">
                        {formatNum(value)}
                      </text>
                    )
                  },
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
      {!above768 && (
        <Row justify="center" gap="16px">
          <LegendButton
            text="Buys"
            iconStyle={{ backgroundColor: CHART_GREEN_COLOR }}
            enabled={showBuy}
            onClick={() => setShowBuy(prev => !prev)}
          />
          <LegendButton
            text="Sells"
            iconStyle={{ backgroundColor: CHART_RED_COLOR }}
            enabled={showSell}
            onClick={() => setShowSell(prev => !prev)}
          />
          <LegendButton
            text="Total Trade"
            iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
            enabled={showTotalTrade}
            onClick={() => setShowTotalTrade(prev => !prev)}
          />
        </Row>
      )}
    </>
  )
}

export const TradingVolumeChart = () => {
  const theme = useTheme()
  const { address } = useParams()
  const [timeframe, setTimeframe] = useState(KyberAITimeframe.ONE_MONTH)
  const [showSell, setShowSell] = useState(true)
  const [showBuy, setShowBuy] = useState(true)
  const [showTotalVolume, setShowTotalVolume] = useState(true)

  const [from, to, timerange] = useMemo(() => {
    const now = Math.floor(Date.now() / 60000) * 60
    const timerange =
      {
        [KyberAITimeframe.ONE_DAY]: 3600,
        [KyberAITimeframe.ONE_WEEK]: 86400,
        [KyberAITimeframe.ONE_MONTH]: 86400,
        [KyberAITimeframe.THREE_MONTHS]: 86400,
      }[timeframe as string] || 86400
    const from =
      now -
      ({
        [KyberAITimeframe.ONE_DAY]: 86400,
        [KyberAITimeframe.ONE_WEEK]: 604800,
        [KyberAITimeframe.ONE_MONTH]: 2592000,
        [KyberAITimeframe.THREE_MONTHS]: 7776000,
      }[timeframe as string] || 604800)
    return [from, now, timerange]
  }, [timeframe])
  const { data } = useTradingVolumeQuery({ tokenAddress: address, params: { from, to } })

  const formattedData = useMemo(() => {
    if (!data) return []
    const datatemp: ITradingVolume[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const index = data.findIndex(item => item.timestamp === t)
      if (index >= 0) {
        datatemp.push({ ...data[index], sellVolume: -data[index].sellVolume })
      } else {
        datatemp.push({ timestamp: t, buy: 0, buyVolume: 0, sell: 0, sellVolume: 0, totalVolume: 0, totalTrade: 0 })
      }
    }
    return datatemp
  }, [data, timerange, from, to])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <>
      <ChartWrapper>
        <LegendWrapper>
          {above768 && (
            <>
              <LegendButton
                text="Buys"
                iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                enabled={showBuy}
                onClick={() => setShowBuy(prev => !prev)}
              />
              <LegendButton
                text="Sells"
                iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                enabled={showSell}
                onClick={() => setShowSell(prev => !prev)}
              />
              <LegendButton
                text="Total Volume"
                iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
                enabled={showTotalVolume}
                onClick={() => setShowTotalVolume(prev => !prev)}
              />
            </>
          )}
          <TimeFrameLegend
            selected={timeframe}
            onSelect={setTimeframe}
            timeframes={[
              KyberAITimeframe.ONE_DAY,
              KyberAITimeframe.ONE_WEEK,
              KyberAITimeframe.ONE_MONTH,
              KyberAITimeframe.THREE_MONTHS,
            ]}
          />
        </LegendWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={500}
            height={400}
            data={formattedData}
            margin={{
              top: 50,
              left: 20,
              right: 20,
            }}
            stackOffset="sign"
          >
            <CartesianGrid
              vertical={false}
              strokeWidth={1}
              stroke={rgba(theme.border, 0.5)}
              shapeRendering="crispEdges"
            />
            <Customized component={KyberLogo} />
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
              tickFormatter={value =>
                dayjs(value * 1000).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')
              }
            />
            <YAxis
              fontSize="12px"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              width={40}
              tickFormatter={value => (value > 0 ? `$${formatNum(value)}` : `-$${formatNum(-value)}`)}
            />
            <YAxis
              yAxisId="right"
              fontSize="12px"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              width={40}
              orientation="right"
              tickFormatter={value => `$${formatNum(value)}`}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ outline: 'none' }}
              position={{ y: 120 }}
              animationDuration={100}
              content={props => {
                const payload = props.payload?.[0]?.payload
                if (!payload) return <></>
                return (
                  <TooltipWrapper>
                    <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                      {payload.timestamp && dayjs(payload.timestamp * 1000).format('MMM DD, YYYY')}
                    </Text>
                    <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                      Total Volume: <span style={{ color: theme.text }}>${formatNum(payload.totalVolume, 2)}</span>
                    </Text>
                    <RowBetween fontSize="12px" lineHeight="16px" color={theme.primary}>
                      <Text>Buys:</Text> <Text>${formatNum(payload.buyVolume, 2)}</Text>
                    </RowBetween>
                    <RowBetween fontSize="12px" lineHeight="16px" color={theme.red}>
                      <Text>Sells:</Text> <Text>${formatNum(-payload.sellVolume, 2)}</Text>
                    </RowBetween>
                  </TooltipWrapper>
                )
              }}
            />
            {showSell && (
              <Bar
                dataKey="sellVolume"
                stackId="a"
                fill={rgba(theme.red, 0.6)}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
            )}
            {showBuy && (
              <Bar
                dataKey="buyVolume"
                stackId="a"
                fill={rgba(theme.primary, 0.6)}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
            )}
            {showTotalVolume && (
              <Line
                yAxisId="right"
                dataKey="totalVolume"
                stroke={theme.text}
                width={2}
                dot={false}
                {...{
                  label: ({ x, y, value }: { x: number; y: number; value: number }) => {
                    return (
                      <text x={x} y={y} dy={-8} fontSize={12} fontWeight={500} fill={theme.text} textAnchor="middle">
                        ${formatNum(value)}
                      </text>
                    )
                  },
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
      {!above768 && (
        <Row justify="center" gap="16px">
          <LegendButton
            text="Buys"
            iconStyle={{ backgroundColor: CHART_GREEN_COLOR }}
            enabled={showBuy}
            onClick={() => setShowBuy(prev => !prev)}
          />
          <LegendButton
            text="Sells"
            iconStyle={{ backgroundColor: CHART_RED_COLOR }}
            enabled={showSell}
            onClick={() => setShowSell(prev => !prev)}
          />
          <LegendButton
            text="Total Volume"
            iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
            enabled={showTotalVolume}
            onClick={() => setShowTotalVolume(prev => !prev)}
          />
        </Row>
      )}
    </>
  )
}

export const NetflowToWhaleWallets = ({ tab }: { tab?: ChartTab }) => {
  const theme = useTheme()
  const { address } = useParams()
  const [timeframe, setTimeframe] = useState(KyberAITimeframe.ONE_MONTH)

  const [from, to, timerange] = useMemo(() => {
    const now = Math.floor(Date.now() / 60000) * 60
    const timerange =
      {
        [KyberAITimeframe.ONE_DAY]: 3600,
        [KyberAITimeframe.ONE_WEEK]: 86400,
        [KyberAITimeframe.ONE_MONTH]: 86400,
        [KyberAITimeframe.THREE_MONTHS]: 86400,
      }[timeframe as string] || 86400
    const from =
      now -
      ({
        [KyberAITimeframe.ONE_DAY]: 86400,
        [KyberAITimeframe.ONE_WEEK]: 604800,
        [KyberAITimeframe.ONE_MONTH]: 2592000,
        [KyberAITimeframe.THREE_MONTHS]: 7776000,
      }[timeframe as string] || 604800)
    return [from, now, timerange]
  }, [timeframe])

  const { data } = useNetflowToWhaleWalletsQuery({ tokenAddress: address || testParams.address, from, to })
  const { account } = useActiveWeb3React()
  const [showInflow, setShowInflow] = useState(true)
  const [showOutflow, setShowOutflow] = useState(true)
  const [showNetflow, setShowNetflow] = useState(true)

  const formattedData: (INetflowToWhaleWallets & {
    generalInflow: number
    generalOutflow: number
    tokenInflow: number
    tokenOutflow: number
  })[] = useMemo(() => {
    if (!data) return []
    const dataTemp: (INetflowToWhaleWallets & {
      generalInflow: number
      generalOutflow: number
      tokenInflow: number
      tokenOutflow: number
    })[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const filteredItems = data.filter(item => item.timestamp === t)
      if (filteredItems.length > 0) {
        dataTemp.push({
          whaleType: '',
          inflow: showInflow ? filteredItems?.reduce((s: number, i: INetflowToWhaleWallets) => s + i.inflow, 0) : 0,
          outflow: showOutflow
            ? -1 * filteredItems?.reduce((s: number, i: INetflowToWhaleWallets) => s + i.outflow, 0)
            : 0,
          netflow: showNetflow ? filteredItems?.reduce((s: number, i: INetflowToWhaleWallets) => s + i.netflow, 0) : 0,
          timestamp: t * 1000,
          generalInflow: filteredItems?.reduce(
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'general' ? s + i.inflow : s),
            0,
          ),
          generalOutflow: filteredItems?.reduce(
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'general' ? s + i.outflow : s),
            0,
          ),
          tokenInflow: filteredItems?.reduce(
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'token' ? s + i.inflow : s),
            0,
          ),
          tokenOutflow: filteredItems?.reduce(
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'token' ? s + i.outflow : s),
            0,
          ),
        })
      } else {
        dataTemp.push({
          timestamp: t * 1000,
          whaleType: '',
          inflow: 0,
          outflow: 0,
          netflow: 0,
          generalInflow: 0,
          generalOutflow: 0,
          tokenInflow: 0,
          tokenOutflow: 0,
        })
      }
    }
    return dataTemp
  }, [data, showInflow, showOutflow, showNetflow, from, to, timerange])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const percentage = useMemo(() => {
    return (
      100 /
      (Math.abs(
        Math.max(...formattedData.map(_ => _.netflow as number)) /
          Math.min(...formattedData.map(_ => _.netflow as number)),
      ) +
        1)
    )
  }, [formattedData])

  useEffect(() => {
    switch (tab) {
      case ChartTab.First: {
        setShowNetflow(true)
        setShowInflow(true)
        setShowOutflow(true)
        break
      }
      case ChartTab.Second: {
        setShowNetflow(true)
        setShowInflow(true)
        setShowOutflow(false)
        break
      }
      case ChartTab.Third: {
        setShowNetflow(true)
        setShowInflow(false)
        setShowOutflow(true)
        break
      }
    }
  }, [tab])

  return (
    <>
      <ChartWrapper>
        {account ? (
          <>
            <LegendWrapper>
              {above768 && (
                <>
                  {tab !== ChartTab.Third && (
                    <LegendButton
                      text="Inflow"
                      iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                      enabled={showInflow}
                      onClick={() => setShowInflow(prev => !prev)}
                    />
                  )}
                  {tab !== ChartTab.Second && (
                    <LegendButton
                      text="Outflow"
                      iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                      enabled={showOutflow}
                      onClick={() => setShowOutflow(prev => !prev)}
                    />
                  )}
                  <LegendButton
                    text="Netflow"
                    iconStyle={{
                      height: '4px',
                      width: '16px',
                      borderRadius: '8px',
                      backgroundColor: rgba(theme.primary, 0.8),
                    }}
                    enabled={showNetflow}
                    onClick={() => setShowNetflow(prev => !prev)}
                  />
                </>
              )}
              <TimeFrameLegend
                selected={timeframe}
                onSelect={setTimeframe}
                timeframes={[
                  KyberAITimeframe.ONE_DAY,
                  KyberAITimeframe.ONE_WEEK,
                  KyberAITimeframe.ONE_MONTH,
                  KyberAITimeframe.THREE_MONTHS,
                ]}
              />
            </LegendWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                width={500}
                height={300}
                data={formattedData}
                stackOffset="sign"
                margin={{ top: 50, left: 20, right: 20 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeWidth={1}
                  stroke={rgba(theme.border, 0.5)}
                  shapeRendering="crispEdges"
                />
                <Customized component={KyberLogo} />
                <XAxis
                  fontSize="12px"
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.subText, fontWeight: 400, fontSize: 10 }}
                  tickFormatter={value =>
                    dayjs(value).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm A, MMM DD' : 'MMM DD')
                  }
                />
                <YAxis
                  fontSize="12px"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.subText, fontWeight: 400 }}
                  width={40}
                  tickFormatter={value => `$${formatNum(value)}`}
                />
                <YAxis
                  yAxisId="right"
                  fontSize="12px"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.subText, fontWeight: 400 }}
                  width={40}
                  orientation="right"
                  tickFormatter={value => `$${formatNum(value)}`}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  wrapperStyle={{ outline: 'none' }}
                  position={{ y: 120 }}
                  animationDuration={100}
                  content={props => {
                    const payload = props.payload?.[0]?.payload
                    if (!payload) return <></>
                    return (
                      <TooltipWrapper>
                        <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                          {payload.timestamp && dayjs(payload.timestamp).format('MMM DD, YYYY')}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                          Netflow: <span style={{ color: theme.text }}>${formatNum(payload.netflow)}</span>
                        </Text>
                        <Row gap="16px">
                          <Column gap="4px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              Wallet
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                              General Whales
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                              Token Whales
                            </Text>
                          </Column>
                          <Column gap="4px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              Inflow
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                              ${formatNum(payload.generalInflow)}
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                              ${formatNum(payload.tokenInflow)}
                            </Text>
                          </Column>
                          <Column gap="4px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              Outflow
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                              ${formatNum(payload.generalOutflow)}
                            </Text>
                            <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                              ${formatNum(payload.tokenOutflow)}
                            </Text>
                          </Column>
                        </Row>
                      </TooltipWrapper>
                    )
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="100%" x2="0" y2="0">
                    <stop offset="0%" stopColor={theme.red} />
                    <stop offset={`${percentage}%`} stopColor={theme.red} />
                    <stop offset={`${percentage}%`} stopColor={theme.primary} />
                    <stop offset="100%" stopColor={theme.primary} />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="inflow"
                  stackId="a"
                  fill={rgba(theme.primary, 0.6)}
                  animationBegin={ANIMATION_DELAY}
                  animationDuration={ANIMATION_DURATION}
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="outflow"
                  stackId="a"
                  fill={rgba(theme.red, 0.6)}
                  animationBegin={ANIMATION_DELAY}
                  animationDuration={ANIMATION_DURATION}
                  radius={[5, 5, 0, 0]}
                />
                {showNetflow && (
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="netflow"
                    stroke="url(#gradient)"
                    strokeWidth={3}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <></>
        )}
      </ChartWrapper>
      {!above768 && (
        <Row justify="center" gap="16px">
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
            iconStyle={{
              height: '4px',
              width: '16px',
              borderRadius: '8px',
              backgroundColor: rgba(theme.primary, 0.8),
            }}
            enabled={showNetflow}
            onClick={() => setShowNetflow(prev => !prev)}
          />
        </Row>
      )}
    </>
  )
}

export const NetflowToCentralizedExchanges = ({ tab }: { tab?: ChartTab }) => {
  const { data } = useNetflowToCEXQuery('123')
  const [showInflow, setShowInflow] = useState(true)
  const [showOutflow, setShowOutflow] = useState(true)
  const [showNetflow, setShowNetflow] = useState(true)
  const [timeframe, setTimeframe] = useState('7D')
  const formattedData = useMemo(
    () =>
      data?.map((item: any) => {
        if (tab === ChartTab.Second) {
          return {
            inflow: showInflow ? item.inflow : undefined,
            netflow: showNetflow ? item.netflow : undefined,
            timestamp: item.timestamp,
          }
        }
        if (tab === ChartTab.Third) {
          return {
            outflow: showOutflow ? -item.outflow : undefined,
            netflow: showNetflow ? item.netflow : undefined,
            timestamp: item.timestamp,
          }
        }

        return {
          inflow: showInflow ? item.inflow : undefined,
          outflow: showOutflow ? -item.outflow : undefined,
          netflow: showNetflow ? item.netflow : undefined,
          timestamp: item.timestamp,
        }
      }),
    [data, showInflow, showOutflow, showNetflow, tab],
  )
  const theme = useTheme()
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <>
      <ChartWrapper>
        <LegendWrapper>
          {above768 && (
            <>
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
                iconStyle={{
                  height: '4px',
                  width: '16px',
                  borderRadius: '8px',
                  backgroundColor: rgba(theme.primary, 0.8),
                }}
                enabled={showNetflow}
                onClick={() => setShowNetflow(prev => !prev)}
              />
            </>
          )}
          <TimeFrameLegend
            selected={timeframe}
            onSelect={setTimeframe}
            timeframes={[
              KyberAITimeframe.ONE_DAY,
              KyberAITimeframe.ONE_WEEK,
              KyberAITimeframe.ONE_MONTH,
              KyberAITimeframe.THREE_MONTHS,
            ]}
          />
        </LegendWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            width={500}
            height={300}
            data={formattedData}
            stackOffset="sign"
            margin={{ top: 40, right: 30 }}
          >
            <CartesianGrid vertical={false} strokeWidth={1} stroke={rgba(theme.border, 0.5)} />
            <Customized component={KyberLogo} />
            <XAxis
              fontSize="12px"
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              tickFormatter={value => dayjs(value).format('MMM DD')}
            />
            <YAxis
              fontSize="12px"
              tickLine={false}
              axisLine={false}
              tick={{ fill: theme.subText, fontWeight: 400 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ outline: 'none' }}
              position={{ y: 120 }}
              animationDuration={100}
              content={props => {
                const payload = props.payload?.[0]?.payload
                if (!payload) return <></>
                return (
                  <TooltipWrapper>
                    <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                      {payload.timestamp && dayjs(payload.timestamp).format('MMM DD, YYYY')}
                    </Text>
                    <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                      Netflow: <span style={{ color: theme.text }}>${formatNum(payload.netflow)}</span>
                    </Text>
                    <Row gap="16px">
                      <Column gap="4px">
                        <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                          Wallet
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          Binance
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          Coinbase
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          OKX
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          Kucoin
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          Kraken
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                          Crypto.com
                        </Text>
                      </Column>
                      <Column gap="4px">
                        <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                          Inflow
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                          ${formatNum(payload.inflow)}
                        </Text>
                      </Column>
                      <Column gap="4px">
                        <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                          Outflow
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                        <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                          ${formatNum(payload.outflow)}
                        </Text>
                      </Column>
                    </Row>
                  </TooltipWrapper>
                )
              }}
            />
            <Bar
              dataKey="inflow"
              stackId="a"
              fill={rgba(theme.primary, 0.6)}
              animationBegin={ANIMATION_DELAY}
              animationDuration={ANIMATION_DURATION}
            />
            <Bar
              dataKey="outflow"
              stackId="a"
              fill={rgba(theme.red, 0.6)}
              animationBegin={ANIMATION_DELAY}
              animationDuration={ANIMATION_DURATION}
            />
            <Line type="linear" dataKey="netflow" stroke={theme.primary} strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
      {!above768 && (
        <Row justify="center" gap="16px">
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
            iconStyle={{
              height: '4px',
              width: '16px',
              borderRadius: '8px',
              backgroundColor: rgba(theme.primary, 0.8),
            }}
            enabled={showNetflow}
            onClick={() => setShowNetflow(prev => !prev)}
          />
        </Row>
      )}
    </>
  )
}

export const NumberofTransfers = ({ tab }: { tab: ChartTab }) => {
  const theme = useTheme()
  const { address } = useParams()
  const { data } = useTransferInformationQuery(address)
  const [timeframe, setTimeframe] = useState('7D')
  const filteredData = useMemo(() => {
    const d = address ? data : NUMBER_OF_TRANSFERS
    switch (timeframe) {
      case '1D':
      case '7D':
        return d && d.length >= 8 ? d?.slice(d.length - 8, d.length - 1) : d
      default:
        return d
    }
  }, [data, timeframe, address])

  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend
          selected={timeframe}
          onSelect={setTimeframe}
          timeframes={[
            KyberAITimeframe.ONE_DAY,
            KyberAITimeframe.ONE_WEEK,
            KyberAITimeframe.ONE_MONTH,
            KyberAITimeframe.THREE_MONTHS,
          ]}
        />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={400}
          data={filteredData}
          margin={{
            top: 40,
            right: 0,
            left: 25,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeWidth={1} stroke={rgba(theme.border, 0.5)} />
          <Customized component={KyberLogo} />
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis
            fontSize="12px"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => `$${formatNum(value)}`}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 120 }}
            animationDuration={100}
            content={props => {
              const payload = props.payload?.[0]?.payload
              if (!payload) return <></>
              return (
                <TooltipWrapper>
                  <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                    {payload.timestamp && dayjs(payload.timestamp).format('MMM DD, YYYY')}
                  </Text>
                  <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                    {tab === ChartTab.Second ? 'Total Volume' : 'Total Transfers'}:{' '}
                    <span style={{ color: theme.text }}>{formatNum(payload.count)}</span>
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={theme.primary}
            fill="url(#colorUv)"
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const NumberofHolders = () => {
  const theme = useTheme()
  const { address } = useParams()
  const { data } = useNumberOfHoldersQuery(address)
  const [timeframe, setTimeframe] = useState('7D')
  const filteredData = useMemo(() => {
    const d = address ? data : NUMBER_OF_HOLDERS
    switch (timeframe) {
      case '1D':
      case '7D':
        return d && d.length >= 8 ? d?.slice(d.length - 8, d.length - 1) : d
      default:
        return d
    }
  }, [data, timeframe, address])

  return (
    <ChartWrapper>
      <LegendWrapper>
        <TimeFrameLegend
          selected={timeframe}
          onSelect={setTimeframe}
          timeframes={[
            KyberAITimeframe.ONE_WEEK,
            KyberAITimeframe.ONE_MONTH,
            KyberAITimeframe.THREE_MONTHS,
            KyberAITimeframe.SIX_MONTHS,
          ]}
        />
      </LegendWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          width={500}
          height={400}
          data={filteredData}
          margin={{
            top: 40,
            right: 0,
            left: 20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.primary} stopOpacity={0.8} />
              <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeWidth={1} stroke={rgba(theme.border, 0.5)} />
          <Customized component={KyberLogo} />
          <XAxis
            fontSize="12px"
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
          />
          <YAxis
            fontSize="12px"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => formatNum(value)}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            position={{ y: 120 }}
            animationDuration={100}
            content={props => {
              const payload = props.payload?.[0]?.payload
              if (!payload) return <></>
              return (
                <TooltipWrapper>
                  <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                    {payload.timestamp && dayjs(payload.timestamp).format('MMM DD, YYYY')}
                  </Text>
                  <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                    Holders: <span style={{ color: theme.text }}>{formatNum(payload.count)}</span>
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={theme.primary}
            fill="url(#colorUv)"
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

const data01 = [
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 400 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 300 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 300 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 200 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 278 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 200 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 100 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
  { name: '0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651', value: 189 },
]

const COLORS = ['#00a2f7', '#31CB9E', '#FFBB28', '#F3841E', '#FF537B', '#27AE60', '#78d5ff', '#8088E5']
const CustomLabel = ({ x, y, cx, cy, name }: any) => {
  let customY = y
  if (Math.abs(cx - x) < 30) {
    customY = cy - y > 0 ? y - 8 : y + 8
  }
  return (
    <text x={x} y={customY} textAnchor={x > cx ? 'start' : 'end'} fill="#31CB9E" fontSize={12}>
      {name}
    </text>
  )
}
export const HoldersChartWrapper = () => {
  const theme = useTheme()
  const above1000 = useMedia('(min-width:1000px)')

  const formattedData = useMemo(
    () =>
      above1000
        ? data01
        : data01.map(item => {
            return { ...item, name: shortenAddress(1, item.name) }
          }),
    [above1000],
  )

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={100} height={100} margin={{ top: 20, right: 90, bottom: 20, left: 90 }}>
          <Customized component={KyberLogo} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            wrapperStyle={{ outline: 'none' }}
            animationDuration={100}
            content={props => {
              const payload = props.payload?.[0]?.payload
              if (!payload) return <></>
              return (
                <TooltipWrapper>
                  <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                    Supply Owned: {(payload.value / 30).toFixed(2)}%
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Pie
            dataKey="value"
            label={CustomLabel}
            nameKey="name"
            data={formattedData}
            innerRadius="40%"
            outerRadius="80%"
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] + 'e0'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

export const LiquidOnCentralizedExchanges = () => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [timeframe, setTimeframe] = useState<string>('7D')
  const { data } = useCexesLiquidationQuery(timeframe)
  console.log('🚀 ~ file: index.tsx:1247 ~ LiquidOnCentralizedExchanges ~ data:', data)
  const [showLong, setShowLong] = useState(true)
  const [showShort, setShowShort] = useState(true)
  const [showPrice, setShowPrice] = useState(true)

  const formattedData = useMemo(() => {
    return []
    // if (!data) return
    // const dateData = new Map()
    // const dateNow = Date.now()
    // data
    //   .filter((i: any) => {
    //     switch (timeframe) {
    //       case '1D':
    //         return i.createTime > dateNow - 1000 * 60 * 60 * 24
    //       case '7D':
    //         return i.createTime > dateNow - (dateNow % (60000 * 60 * 24)) - 60000 * 60 * 24 * 6
    //       case '1M':
    //         return i.createTime > dateNow - 1000 * 60 * 60 * 24 * 30
    //       default:
    //         return false
    //     }
    //   })
    //   .forEach((i: any) => {
    //     const dateTime = i.createTime - (i.createTime % (timeframe === '1D' ? 60000 * 60 : 60000 * 60 * 24))
    //     const dateValue = dateData.get(dateTime)
    //     dateData.set(dateTime, {
    //       buyVolUsd: i.buyVolUsd + dateValue?.buyVolUsd || 0,
    //       sellVolUsd: -i.sellVolUsd + dateValue?.sellVolUsd || 0,
    //       timestamp: dateTime,
    //       price: dateValue?.price ? (dateValue.price + i.price) / 2 : i.price,
    //       list: i.list.map((ex: any) => {
    //         return {
    //           exchangeName: ex.exchangeName,
    //           buyVolUsd:
    //             ex.buyVolUsd + dateValue?.list?.find((e2: any) => e2.exchangeName === ex.exchangeName)?.buyVolUsd || 0,
    //           sellVolUsd:
    //             ex.sellVolUsd + dateValue?.list?.find((e2: any) => e2.exchangeName === ex.exchangeName)?.sellVolUsd ||
    //             0,
    //         }
    //       }),
    //     })
    //   })
    // return Array.from(dateData.values())
  }, [])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <ChartWrapper>
      {account ? (
        <>
          <LegendWrapper>
            {above768 && (
              <>
                <LegendButton
                  text="Long"
                  iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                  enabled={showLong}
                  onClick={() => setShowLong(prev => !prev)}
                />
                <LegendButton
                  text="Short"
                  iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                  enabled={showShort}
                  onClick={() => setShowShort(prev => !prev)}
                />
                <LegendButton
                  text="Price"
                  iconStyle={{
                    height: '4px',
                    width: '16px',
                    borderRadius: '8px',
                    backgroundColor: rgba(theme.blue, 0.8),
                  }}
                  enabled={showPrice}
                  onClick={() => setShowPrice(prev => !prev)}
                />
              </>
            )}
            <TimeFrameLegend
              selected={timeframe}
              onSelect={setTimeframe}
              timeframes={[KyberAITimeframe.ONE_DAY, KyberAITimeframe.ONE_WEEK, KyberAITimeframe.ONE_MONTH]}
            />
          </LegendWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              width={500}
              height={500}
              data={formattedData}
              stackOffset="sign"
              margin={{ left: 20, right: 20, top: 50 }}
            >
              <CartesianGrid
                vertical={false}
                strokeWidth={1}
                stroke={rgba(theme.border, 0.5)}
                shapeRendering="crispEdges"
              />
              <Customized component={KyberLogo} />
              <XAxis
                fontSize="12px"
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                tickFormatter={value => dayjs(value).format(timeframe === '1D' ? 'HH:mm a,MMM DD ' : 'MMM DD')}
              />
              <YAxis
                yAxisId="left"
                fontSize="12px"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                width={40}
                orientation="left"
                tickFormatter={value => formatNum(value)}
              />
              <YAxis
                yAxisId="right"
                fontSize="12px"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                width={40}
                orientation="right"
                tickFormatter={value => formatNum(value)}
                domain={[(dataMin: any) => dataMin * 0.99, (dataMax: any) => dataMax * 1.01]}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                wrapperStyle={{ outline: 'none' }}
                position={{ y: 120 }}
                animationDuration={100}
                content={props => {
                  const payload = props.payload?.[0]?.payload
                  if (!payload) return <></>
                  return (
                    <TooltipWrapper>
                      <Text fontSize="10px" lineHeight="12px" color={theme.subText}>
                        {payload.timestamp && dayjs(payload.timestamp).format('MMM DD, YYYY')}
                      </Text>
                      <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                        Price: <span style={{ color: theme.text }}>${commify(+payload.price.toFixed(2))}</span>
                      </Text>
                      <Row gap="12px">
                        <Column gap="4px">
                          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                            Site
                          </Text>
                          {payload.list.map((i: any) => (
                            <Text key={i.exchangeName} fontSize="12px" lineHeight="16px" color={theme.text}>
                              {i.exchangeName}
                            </Text>
                          ))}
                        </Column>
                        <Column gap="4px" style={{ alignItems: 'flex-end' }}>
                          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                            Long
                          </Text>
                          {payload.list.map((i: any) => (
                            <Text key={i.exchangeName + 'long'} fontSize="12px" lineHeight="16px" color={theme.primary}>
                              {formatNum(i.buyVolUsd)}
                            </Text>
                          ))}
                        </Column>
                        <Column gap="4px" style={{ alignItems: 'flex-end' }}>
                          <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                            Short
                          </Text>
                          {payload.list.map((i: any) => (
                            <Text key={i.exchangeName + 'short'} fontSize="12px" lineHeight="16px" color={theme.red}>
                              {formatNum(i.sellVolUsd)}
                            </Text>
                          ))}
                        </Column>
                      </Row>
                    </TooltipWrapper>
                  )
                }}
              />
              {showLong && (
                <Bar
                  dataKey="buyVolUsd"
                  stackId="a"
                  fill={rgba(theme.primary, 0.6)}
                  animationBegin={ANIMATION_DELAY}
                  animationDuration={ANIMATION_DURATION}
                  yAxisId="left"
                />
              )}
              {showShort && (
                <Bar
                  dataKey="sellVolUsd"
                  stackId="a"
                  fill={rgba(theme.red, 0.6)}
                  animationBegin={ANIMATION_DELAY}
                  animationDuration={ANIMATION_DURATION}
                  yAxisId="left"
                />
              )}
              {showPrice && (
                <Line yAxisId="right" type="linear" dataKey="price" stroke={theme.blue} strokeWidth={3} dot={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </>
      ) : (
        <></>
      )}
    </ChartWrapper>
  )
}

// const LOCALSTORAGE_STATE_NAME = 'proChartState'

const ProLiveChartWrapper = styled.div<{ fullscreen: boolean }>`
  height: ${isMobile ? '100%' : 'calc(100% - 0px)'};
  ${({ theme }) => `border: 1px solid ${theme.background};`}
  overflow: hidden;
  box-shadow: 0px 4px 16px rgb(0 0 0 / 4%);
  border-radius: ${isMobile ? '0' : '10px'};

  ${({ fullscreen }) =>
    fullscreen &&
    !isMobile &&
    `
    background-color: rgb(0,0,0,0.5);
    position: fixed;
    top: 0;
    left: 0;
    padding-top: 82px;
    height: 100%!important;
    width: 100%!important;
    border-radius: 0;
    margin:0;
  `}
`

const Loader = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.buttonBlack};
`

const LOCALSTORAGE_STATE_NAME = 'kyberAIProChartState'

export const Prochart = ({ isBTC }: { isBTC?: boolean }) => {
  const theme = useTheme()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tvWidget, setTvWidget] = useState<IChartingLibraryWidget | undefined>(undefined)
  const userLocale = useUserLocale()
  const datafeed = useDatafeed(isBTC || false)
  const { SRLevels, currentPrice, resolution, setResolution } = useContext(TechnicalAnalysisContext)

  const variablesRef = useRef({ resolution })
  useEffect(() => {
    if (!ref || !window.TradingView) {
      return
    }
    setLoading(true)

    const localStorageState = JSON.parse(localStorage.getItem(LOCALSTORAGE_STATE_NAME) || 'null')
    // set auto scale mode to true to fix wrong behavious of right axis price range
    if (localStorageState?.charts[0]?.panes[0]?.rightAxisesState[0]?.state?.m_isAutoScale === false) {
      localStorageState.charts[0].panes[0].rightAxisesState[0].state.m_isAutoScale = true
    }

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: 'BTC',
      datafeed: datafeed,
      interval: '1h' as ResolutionString,
      container: ref,
      library_path: '/charting_library/',
      disabled_features: [
        'header_symbol_search',
        'header_fullscreen_button',
        'header_compare',
        'header_saveload',
        'drawing_templates',
      ],
      enabled_features: [
        'study_templates',
        'create_volume_indicator_by_default',
        'use_localstorage_for_settings',
        'save_chart_properties_to_local_storage',
      ],
      fullscreen: false,
      autosize: true,
      studies_overrides: {},
      theme: theme.darkMode ? 'Dark' : 'Light',
      custom_css_url: '/charting_library/style.css',
      timeframe: '2w',
      time_frames: [
        { text: '2w', resolution: '1H' as ResolutionString, description: '2 Weeks' },
        { text: '1m', resolution: '4H' as ResolutionString, description: '1 Month' },
        { text: '6m', resolution: '1D' as ResolutionString, description: '6 Months' },
        { text: '2y', resolution: '4D' as ResolutionString, description: '2 Years' },
      ],
      locale: (userLocale ? userLocale.slice(0, 2) : 'en') as LanguageCode,
      auto_save_delay: 2,
      saved_data: localStorageState,
    }
    const tvWidget = new window.TradingView.widget(widgetOptions)

    tvWidget.onChartReady(() => {
      tvWidget.applyOverrides({
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': theme.darkMode ? theme.buttonBlack : theme.background,
        'mainSeriesProperties.priceLineColor': theme.blue,
        'mainSeriesProperties.candleStyle.upColor': theme.primary,
        'mainSeriesProperties.candleStyle.borderUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.wickUpColor': theme.primary,
        'mainSeriesProperties.candleStyle.downColor': theme.red,
        'mainSeriesProperties.candleStyle.borderDownColor': theme.red,
        'mainSeriesProperties.candleStyle.wickDownColor': theme.red,
        'mainSeriesProperties.priceAxisProperties.autoScale': true,
        'scalesProperties.textColor': theme.text,
      })
      tvWidget
        .activeChart()
        .createStudy('Stochastic RSI')
        .then(() => {
          tvWidget.activeChart().getPanes()[1].setHeight(120)
          setLoading(false)
        })
      tvWidget.activeChart().createStudy('Moving Average Exponential')
      setTvWidget(tvWidget)
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(
          null,
          r => {
            const resolution = { 60: '1h', 240: '4h', '1D': '1d' }[r as string] || '1h'
            if (resolution !== variablesRef.current?.resolution) {
              setResolution?.(resolution)
            }
          },
          false,
        )
    })

    return () => {
      if (tvWidget !== null) {
        tvWidget.remove()
        setTvWidget(undefined)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, ref, datafeed])

  const entityIds = useRef<(EntityId | null)[]>([])
  useEffect(() => {
    if (!tvWidget || !SRLevels || !currentPrice) return
    const subscriptionDataLoaded = tvWidget.activeChart()?.onDataLoaded()

    subscriptionDataLoaded?.subscribe(null, () => {
      entityIds.current?.forEach(entityId => {
        return entityId && tvWidget.activeChart().removeEntity(entityId)
      })
      entityIds.current = []
      SRLevels?.forEach((level: ISRLevel) => {
        const entityId = tvWidget.activeChart().createMultipointShape([{ time: level.timestamp, price: level.value }], {
          shape: 'horizontal_ray',
          lock: true,
          disableSelection: true,
          disableSave: true,
          overrides: {
            linecolor: currentPrice > level.value ? theme.primary : theme.red,
            linewidth: 2,
            linestyle: 2,
          },
        })
        entityIds.current.push(entityId)
      }, true)
    })
  }, [tvWidget, SRLevels, currentPrice, theme, setResolution])

  useEffect(() => {
    if (resolution && tvWidget?.activeChart().resolution() !== (resolution as ResolutionString)) {
      tvWidget?.activeChart().setResolution(resolution as ResolutionString)
    }
  }, [resolution, tvWidget])

  return (
    <ProLiveChartWrapper fullscreen={fullscreen} onClick={() => setFullscreen(false)}>
      {loading && (
        <Loader>
          <AnimatedLoader />
        </Loader>
      )}
      <div
        ref={newRef => setRef(newRef)}
        style={{ height: '100%', width: '100%', display: 'block' }}
        onClick={(e: any) => {
          e.stopPropagation()
        }}
      />
    </ProLiveChartWrapper>
  )
}

export const PriceChart = () => {
  return <Prochart></Prochart>
}
