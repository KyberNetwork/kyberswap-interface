import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import React, { ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import Divider from 'components/Divider'
import AnimatedLoader from 'components/Loader/AnimatedLoader'
import Row, { RowBetween } from 'components/Row'
import {
  ChartingLibraryWidgetOptions,
  EntityId,
  IChartingLibraryWidget,
  LanguageCode,
  ResolutionString,
} from 'components/TradingViewChart/charting_library'
import { getTradingViewTimeZone } from 'components/TradingViewChart/utils'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { KYBERAI_CHART_ID, NETWORK_TO_CHAINID } from 'pages/TrueSightV2/constants'
import { CHART_STATES_ACTION_TYPE, useChartStatesContext } from 'pages/TrueSightV2/hooks/useChartStatesReducer'
import {
  useCexesLiquidationQuery,
  useHolderListQuery,
  useNetflowToCEXQuery,
  useNetflowToWhaleWalletsQuery,
  useNumberOfHoldersQuery,
  useTradingVolumeQuery,
  useTransferInformationQuery,
} from 'pages/TrueSightV2/hooks/useKyberAIData'
import useKyberAITokenOverview from 'pages/TrueSightV2/hooks/useKyberAITokenOverview'
import { defaultExplorePageToken } from 'pages/TrueSightV2/pages/SingleToken'
import { TechnicalAnalysisContext } from 'pages/TrueSightV2/pages/TechnicalAnalysis'
import {
  ChartTab,
  IHolderList,
  ILiquidCEX,
  INetflowToCEX,
  INetflowToWhaleWallets,
  INumberOfHolders,
  INumberOfTransfers,
  ISRLevel,
  ITradingVolume,
  KyberAITimeframe,
} from 'pages/TrueSightV2/types'
import { formatLocaleStringNum, formatShortNum, formatTokenPrice } from 'pages/TrueSightV2/utils'
import { useUserLocale } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import TimeFrameLegend from '../TimeFrameLegend'
import KyberLogo from './KyberLogo'
import { useDatafeed } from './datafeed'

const CHART_RED_COLOR = '#773242'
const CHART_GREEN_COLOR = '#246250'

const LABEL_GAP_BY_TIMEFRAME: { [timeframe: string]: number } = {
  [KyberAITimeframe.ONE_DAY]: isMobile ? 4 : 2,
  [KyberAITimeframe.ONE_WEEK]: isMobile ? 2 : 1,
  [KyberAITimeframe.ONE_MONTH]: isMobile ? 4 : 2,
  [KyberAITimeframe.THREE_MONTHS]: isMobile ? 8 : 4,
  [KyberAITimeframe.SIX_MONTHS]: isMobile ? 12 : 6,
}

const CustomizedLabel = (props: any) => {
  const theme = useTheme()
  const { x, y, value, index, timeframe, dollarSign } = props
  const show = (index + 1) % (LABEL_GAP_BY_TIMEFRAME[timeframe as string] || 1) === 0
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <>
      {show && (
        <text x={x} y={y} dy={-10} fontSize={above768 ? 10 : 9} fontWeight={500} fill={theme.text} textAnchor="middle">
          {value !== 0 && `${dollarSign ? '$' : ''}${formatShortNum(value)}`}
        </text>
      )}
    </>
  )
}
const CustomizedPriceLabel = (props: any) => {
  const theme = useTheme()
  const { x, y, value, index, timeframe } = props
  const show = (index + 1) % (LABEL_GAP_BY_TIMEFRAME[timeframe as string] || 1) === 0
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <>
      {show && (
        <text x={x} y={y} dy={-10} fontSize={above768 ? 10 : 9} fontWeight={500} fill={theme.text} textAnchor="middle">
          {value !== 0 && `$${formatTokenPrice(value)}`}
        </text>
      )}
    </>
  )
}

const ContentWrapper = styled.div`
  content-visibility: auto;
  contain-intrinsic-height: auto;
`

const ChartWrapper = styled(ContentWrapper)`
  flex: 1;
  min-height: 0;
  position: relative;
`

export const LegendWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  z-index: 10;
  user-select: none;
  flex-wrap: wrap;
  max-width: 50%;

  > * {
    cursor: pointer;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left:0;
    justify-content: center;
    max-width: 100%;
    > * {
      flex: 1;
    }
  `}
`

export const InfoWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  gap: 40px;
  z-index: 10;
  user-select: none;
  font-size: 14px;
  line-height: 20px;
  padding-bottom: 16px;
  max-width: 50%;
  white-space: nowrap;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 10px;
    line-height: 14px;
    padding-bottom: 6px;
    top: 36px;
    gap: 20px;
    text-align: center;
    justify-content: center;
    width: 100%;
    max-width: 100%;
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`

export const ANIMATION_DELAY = 500
export const ANIMATION_DURATION = 1000

const StyledLoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`

const LoadingHandleWrapper = ({
  isLoading,
  hasData,
  children,
}: {
  isLoading: boolean
  hasData: boolean
  children: ReactNode
}) => {
  return (
    <ChartWrapper>
      {!hasData ? (
        <>
          <StyledLoadingWrapper>
            {isLoading ? (
              <AnimatedLoader />
            ) : (
              <Text fontSize="14px">
                <Trans>We couldn&apos;t find any information for this token</Trans>
              </Text>
            )}
          </StyledLoadingWrapper>
        </>
      ) : (
        <>{children}</>
      )}
    </ChartWrapper>
  )
}

const roundNumberUp = (number: number) => {
  const digit = Math.floor(Math.log10(number))
  return Math.ceil(number / Math.pow(10, digit)) * Math.pow(10, digit)
}

export const NumberofTradesChart = ({ noAnimation }: { noAnimation?: boolean }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.NUMBER_OF_TRADES, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    showOptions: ['showSell', 'showBuy', 'showTotalTrade'],
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH
  const showSell = state?.showOptions?.includes('showSell')
  const showBuy = state?.showOptions?.includes('showBuy')
  const showTotalTrade = state?.showOptions?.includes('showTotalTrade')

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
  const { data, isLoading } = useTradingVolumeQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    params: { from, to },
  })

  const dataRange = useMemo(() => {
    if (!data) return undefined
    let maxValue = 0

    data.forEach(item => {
      if (item.buy > maxValue) {
        maxValue = item.buy
      }
      if (item.sell > maxValue) {
        maxValue = item.sell
      }
    })

    return [-roundNumberUp(maxValue), roundNumberUp(maxValue)]
  }, [data])

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
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
  }, [data, timerange, from, to, dispatch])

  const totalStats: { timeframe: string; totalTrades: string; totalBuys: string; totalSells: string } = useMemo(() => {
    if (formattedData.length === 0) return { timeframe: '--', totalTrades: '--', totalBuys: '--', totalSells: '--' }

    const tf = `${dayjs(formattedData[0].timestamp * 1000).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )} - ${dayjs(formattedData[formattedData.length - 1].timestamp * 1000).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )}`

    return {
      timeframe: tf,
      totalTrades: formatLocaleStringNum(formattedData.reduce((a, b) => a + b.totalTrade, 0)),
      totalBuys: formatLocaleStringNum(formattedData.reduce((a, b) => a + b.buy, 0)),
      totalSells: formatLocaleStringNum(-formattedData.reduce((a, b) => a + b.sell, 0)),
    }
  }, [formattedData, timeframe])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <InfoWrapper>
        <Column gap="4px">
          <Text color={theme.subText}>Timeframe</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.timeframe}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Trades</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalTrades}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Buys</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalBuys}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Sells</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalSells}
          </Text>
        </Column>
      </InfoWrapper>
      <LegendWrapper>
        {above768 && (
          <>
            <LegendButton
              text="Buys"
              iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
              enabled={showBuy}
              onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showBuy' } })}
            />
            <LegendButton
              text="Sells"
              iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
              enabled={showSell}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showSell' } })
              }
            />
            <LegendButton
              text="Total Trades"
              iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
              enabled={showTotalTrade}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showTotalTrade' } })
              }
            />
          </>
        )}
        <TimeFrameLegend
          selected={timeframe}
          onSelect={timeframe => dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })}
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
          margin={
            above768
              ? {
                  top: 80,
                  left: 20,
                  right: 20,
                }
              : { top: 100, left: 10, right: 10, bottom: 10 }
          }
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
            fontSize={textFontSize}
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value =>
              dayjs(value * 1000).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')
            }
            minTickGap={12}
          />
          <YAxis
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={20}
            tickFormatter={value => `${formatShortNum(value)}`}
            domain={dataRange}
          />
          <YAxis
            yAxisId="right"
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={20}
            orientation="right"
            tickFormatter={value => `${formatShortNum(value)}`}
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
                    {payload.timestamp &&
                      dayjs(payload.timestamp * 1000).format(
                        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD, YYYY',
                      )}
                  </Text>
                  <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                    Total Trades: <span style={{ color: theme.text }}>{formatShortNum(payload.totalTrade, 2)}</span>
                  </Text>
                  <RowBetween fontSize={textFontSize} lineHeight="16px" color={theme.primary}>
                    <Text>Buys:</Text> <Text>{formatShortNum(payload.buy, 2)}</Text>
                  </RowBetween>
                  <RowBetween fontSize={textFontSize} lineHeight="16px" color={theme.red}>
                    <Text>Sells:</Text> <Text>{formatShortNum(-payload.sell, 2)}</Text>
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
              isAnimationActive={noAnimation ? false : true}
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
              isAnimationActive={noAnimation ? false : true}
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
                label: <CustomizedLabel timeframe={timeframe} />,
              }}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {!above768 && (
        <Row justify="center" gap="16px" style={{ position: 'absolute', bottom: 0 }}>
          <LegendButton
            text="Buys"
            iconStyle={{ backgroundColor: CHART_GREEN_COLOR }}
            enabled={showBuy}
            onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showBuy' } })}
          />
          <LegendButton
            text="Sells"
            iconStyle={{ backgroundColor: CHART_RED_COLOR }}
            enabled={showSell}
            onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showSell' } })}
          />
          <LegendButton
            text="Total Trades"
            iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
            enabled={showTotalTrade}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showTotalTrade' } })
            }
          />
        </Row>
      )}
    </LoadingHandleWrapper>
  )
}

export const TradingVolumeChart = ({ noAnimation }: { noAnimation?: boolean }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.TRADING_VOLUME, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    showOptions: ['showSell', 'showBuy', 'showTotalVolume'],
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH
  const showSell = state?.showOptions?.includes('showSell')
  const showBuy = state?.showOptions?.includes('showBuy')
  const showTotalVolume = state?.showOptions?.includes('showTotalVolume')

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
  const { data, isLoading } = useTradingVolumeQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    params: { from, to },
  })

  const dataRange = useMemo(() => {
    if (!data) return undefined
    let maxValue = 0

    data.forEach(item => {
      if (item.buyVolume > maxValue) {
        maxValue = item.buyVolume
      }
      if (item.sellVolume > maxValue) {
        maxValue = item.sellVolume
      }
    })

    return [-roundNumberUp(maxValue), roundNumberUp(maxValue)]
  }, [data])

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
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
  }, [data, timerange, from, to, dispatch])

  const totalStats: { timeframe: string; totalVolume: string; totalBuys: string; totalSells: string } = useMemo(() => {
    if (formattedData.length === 0) return { timeframe: '--', totalVolume: '--', totalBuys: '--', totalSells: '--' }

    const tf = `${dayjs(formattedData[0].timestamp * 1000).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )} - ${dayjs(formattedData[formattedData.length - 1].timestamp * 1000).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )}`

    return {
      timeframe: tf,
      totalVolume: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.totalVolume, 0)),
      totalBuys: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.buyVolume, 0)),
      totalSells: '$' + formatLocaleStringNum(-formattedData.reduce((a, b) => a + b.sellVolume, 0)),
    }
  }, [formattedData, timeframe])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <InfoWrapper>
        <Column gap="4px">
          <Text color={theme.subText}>Timeframe</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.timeframe}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Volume</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalVolume}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Buys</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalBuys}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Sells</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalSells}
          </Text>
        </Column>
      </InfoWrapper>
      <LegendWrapper>
        {above768 && (
          <>
            <LegendButton
              text="Buys"
              iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
              enabled={showBuy}
              onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showBuy' } })}
            />
            <LegendButton
              text="Sells"
              iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
              enabled={showSell}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showSell' } })
              }
            />
            <LegendButton
              text="Total Volume"
              iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
              enabled={showTotalVolume}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showTotalVolume' } })
              }
            />
          </>
        )}
        <TimeFrameLegend
          selected={timeframe}
          onSelect={timeframe => dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })}
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
          margin={
            above768
              ? {
                  top: 80,
                  left: 20,
                  right: 20,
                }
              : {
                  top: 100,
                  left: 10,
                  right: 10,
                  bottom: 10,
                }
          }
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
            fontSize={textFontSize}
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value =>
              dayjs(value * 1000).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')
            }
            minTickGap={12}
          />
          <YAxis
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => (value > 0 ? `$${formatShortNum(value)}` : `-$${formatShortNum(-value)}`)}
            domain={dataRange}
          />
          <YAxis
            yAxisId="right"
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            orientation="right"
            tickFormatter={value => `$${formatShortNum(value)}`}
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
                    {payload.timestamp &&
                      dayjs(payload.timestamp * 1000).format(
                        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm A, MMM DD' : 'MMM DD, YYYY',
                      )}
                  </Text>
                  <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                    Total Volume: <span style={{ color: theme.text }}>${formatShortNum(payload.totalVolume, 2)}</span>
                  </Text>
                  <RowBetween fontSize={textFontSize} lineHeight="16px" color={theme.primary}>
                    <Text>Buys:</Text> <Text>${formatShortNum(payload.buyVolume, 2)}</Text>
                  </RowBetween>
                  <RowBetween fontSize={textFontSize} lineHeight="16px" color={theme.red}>
                    <Text>Sells:</Text> <Text>${formatShortNum(-payload.sellVolume, 2)}</Text>
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
              isAnimationActive={noAnimation ? false : true}
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
              isAnimationActive={noAnimation ? false : true}
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
              isAnimationActive={false}
              dot={false}
              {...{
                label: <CustomizedLabel timeframe={timeframe} dollarSign />,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {!above768 && (
        <Row justify="center" gap="16px" style={{ position: 'absolute', bottom: 0 }}>
          <LegendButton
            text="Buys"
            iconStyle={{ backgroundColor: CHART_GREEN_COLOR }}
            enabled={showBuy}
            onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showBuy' } })}
          />
          <LegendButton
            text="Sells"
            iconStyle={{ backgroundColor: CHART_RED_COLOR }}
            enabled={showSell}
            onClick={() => dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showSell' } })}
          />
          <LegendButton
            text="Total Volume"
            iconStyle={{ backgroundColor: theme.text, height: '4px', width: '16px' }}
            enabled={showTotalVolume}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showTotalVolume' } })
            }
          />
        </Row>
      )}
    </LoadingHandleWrapper>
  )
}

export const NetflowToWhaleWallets = ({ tab, noAnimation }: { tab?: ChartTab; noAnimation?: boolean }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.NETFLOW_TO_WHALE_WALLET, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    showOptions: ['showInflow', 'showOutflow', 'showNetflow'],
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH
  const showInflow = state?.showOptions?.includes('showInflow')
  const showOutflow = state?.showOptions?.includes('showOutflow')
  const showNetflow = state?.showOptions?.includes('showNetflow')

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

  const { data, isLoading } = useNetflowToWhaleWalletsQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    from,
    to,
  })

  const { account } = useActiveWeb3React()

  const formattedData: (INetflowToWhaleWallets & {
    generalInflow: number
    generalOutflow: number
    tokenInflow: number
    tokenOutflow: number
  })[] = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
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
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'token_whale' ? s + i.inflow : s),
            0,
          ),
          tokenOutflow: filteredItems?.reduce(
            (s: number, i: INetflowToWhaleWallets) => (i.whaleType === 'token_whale' ? s + i.outflow : s),
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
  }, [data, showInflow, showOutflow, showNetflow, from, to, timerange, dispatch])

  const dataRange = useMemo(() => {
    if (!formattedData) return undefined
    let maxValue = 0

    formattedData.forEach(item => {
      if (item.inflow > maxValue) {
        maxValue = item.inflow
      }
      if (-item.outflow > maxValue) {
        maxValue = -item.outflow
      }
    })

    return [-roundNumberUp(maxValue), roundNumberUp(maxValue)]
  }, [formattedData])

  const percentage = useMemo(() => {
    const max = Math.max(...formattedData.map(_ => _.netflow as number))
    const min = Math.min(...formattedData.map(_ => _.netflow as number))
    return (Math.abs(0 - min) / (max - min)) * 100
  }, [formattedData])

  const totalStats: { timeframe: string; totalNetflow: string; totalInflow: string; totalOutflow: string } =
    useMemo(() => {
      if (formattedData.length === 0)
        return { timeframe: '--', totalNetflow: '--', totalInflow: '--', totalOutflow: '--' }

      const tf = `${dayjs(formattedData[0].timestamp).format(
        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
      )} - ${dayjs(formattedData[formattedData.length - 1].timestamp).format(
        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
      )}`

      return {
        timeframe: tf,
        totalNetflow: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.netflow, 0)),
        totalInflow: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.inflow, 0)),
        totalOutflow: '$' + formatLocaleStringNum(-formattedData.reduce((a, b) => a + b.outflow, 0)),
      }
    }, [formattedData, timeframe])

  useEffect(() => {
    switch (tab) {
      case ChartTab.First: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showInflow', 'showOutflow', 'showNetflow'] },
        })
        break
      }
      case ChartTab.Second: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showInflow', 'showNetflow'] },
        })
        break
      }
      case ChartTab.Third: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showOutflow', 'showNetflow'] },
        })
        break
      }
    }
  }, [dispatch, tab])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'

  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      {account ? (
        <>
          <InfoWrapper>
            <Column gap="4px">
              <Text color={theme.subText}>Timeframe</Text>
              <Text color={theme.text} fontWeight={500}>
                {totalStats.timeframe}
              </Text>
            </Column>
            <Column gap="4px">
              <Text color={theme.subText}>Total Netflow</Text>
              <Text color={theme.text} fontWeight={500}>
                {totalStats.totalNetflow}
              </Text>
            </Column>
            <Column gap="4px">
              <Text color={theme.subText}>Total Inflow</Text>
              <Text color={theme.text} fontWeight={500}>
                {totalStats.totalInflow}
              </Text>
            </Column>
            <Column gap="4px">
              <Text color={theme.subText}>Total Outflow</Text>
              <Text color={theme.text} fontWeight={500}>
                {totalStats.totalOutflow}
              </Text>
            </Column>
          </InfoWrapper>
          <LegendWrapper>
            {above768 && (
              <>
                {tab !== ChartTab.Third && (
                  <LegendButton
                    text="Inflow"
                    iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                    enabled={showInflow}
                    onClick={() =>
                      dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showInflow' } })
                    }
                  />
                )}
                {tab !== ChartTab.Second && (
                  <LegendButton
                    text="Outflow"
                    iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                    enabled={showOutflow}
                    onClick={() =>
                      dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showOutflow' } })
                    }
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
                  onClick={() =>
                    dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showNetflow' } })
                  }
                />
              </>
            )}
            <TimeFrameLegend
              selected={timeframe}
              onSelect={timeframe =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })
              }
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
              stackOffset="sign"
              margin={above768 ? { top: 80, left: 20, right: 20 } : { top: 100, left: 10, right: 10, bottom: 10 }}
            >
              <CartesianGrid
                vertical={false}
                strokeWidth={1}
                stroke={rgba(theme.border, 0.5)}
                shapeRendering="crispEdges"
              />
              <Customized component={KyberLogo} />
              <XAxis
                fontSize={textFontSize}
                dataKey="timestamp"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                tickFormatter={value =>
                  dayjs(value).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')
                }
                minTickGap={12}
              />
              <YAxis
                fontSize={textFontSize}
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.subText, fontWeight: 400 }}
                width={40}
                tickFormatter={value => `$${formatShortNum(value)}`}
                domain={dataRange}
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
                        {payload.timestamp &&
                          dayjs(payload.timestamp).format(
                            timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm ,MMM DD' : 'MMM DD, YYYY',
                          )}
                      </Text>
                      <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                        Netflow: <span style={{ color: theme.text }}>${formatShortNum(payload.netflow)}</span>
                      </Text>
                      <Row gap="16px">
                        <Column gap="4px">
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                            Wallet
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.subText}>
                            General Whales
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.subText}>
                            Token Whales
                          </Text>
                        </Column>
                        <Column gap="4px">
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                            Inflow
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.primary}>
                            ${formatShortNum(payload.generalInflow)}
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.primary}>
                            ${formatShortNum(payload.tokenInflow)}
                          </Text>
                        </Column>
                        <Column gap="4px">
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                            Outflow
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.red}>
                            ${formatShortNum(payload.generalOutflow)}
                          </Text>
                          <Text fontSize={textFontSize} lineHeight="16px" color={theme.red}>
                            ${formatShortNum(payload.tokenOutflow)}
                          </Text>
                        </Column>
                      </Row>
                    </TooltipWrapper>
                  )
                }}
              />
              <defs>
                <linearGradient id="gradient1" x1="0" y1="100%" x2="0" y2="0">
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
                isAnimationActive={noAnimation ? false : true}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="outflow"
                stackId="a"
                fill={rgba(theme.red, 0.6)}
                isAnimationActive={noAnimation ? false : true}
                animationBegin={ANIMATION_DELAY}
                animationDuration={ANIMATION_DURATION}
                radius={[5, 5, 0, 0]}
              />
              {showNetflow && (
                <Line
                  type="linear"
                  dataKey="netflow"
                  stroke="url(#gradient1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  {...{
                    label: <CustomizedLabel timeframe={timeframe} dollarSign />,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </>
      ) : (
        <></>
      )}
      {!above768 && (
        <Row justify="center" gap="16px" style={{ position: 'absolute', bottom: 0 }}>
          <LegendButton
            text="Inflow"
            iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
            enabled={showInflow}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showInflow' } })
            }
          />
          <LegendButton
            text="Outflow"
            iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
            enabled={showOutflow}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showOutflow' } })
            }
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
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showNetflow' } })
            }
          />
        </Row>
      )}
    </LoadingHandleWrapper>
  )
}

export const NetflowToCentralizedExchanges = ({ tab, noAnimation }: { tab?: ChartTab; noAnimation?: boolean }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.NETFLOW_TO_CEX, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    showOptions: ['showInflow', 'showOutflow', 'showNetflow'],
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH
  const showInflow = state?.showOptions?.includes('showInflow')
  const showOutflow = state?.showOptions?.includes('showOutflow')
  const showNetflow = state?.showOptions?.includes('showNetflow')

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

  const { data, isLoading } = useNetflowToCEXQuery({
    chain: chain || defaultExplorePageToken.chain,
    address: address || defaultExplorePageToken.address,
    from,
    to,
  })

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
    const dataTemp: {
      cexes: INetflowToCEX[]
      totalInflow: number
      totalOutflow: number
      totalNetflow: number
      timestamp: number
    }[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const cexesData = data.filter(item => item.timestamp === t)
      if (cexesData.length > 0) {
        dataTemp.push({
          timestamp: t * 1000,
          cexes: cexesData.sort((a, b) => (a.cex > b.cex ? 1 : -1)),
          totalInflow: showInflow ? cexesData.reduce((a, b) => a + b.inflow, 0) : 0,
          totalOutflow: showOutflow ? -cexesData.reduce((a, b) => a + b.outflow, 0) : 0,
          totalNetflow: showNetflow ? cexesData.reduce((a, b) => a + b.netflow, 0) : 0,
        })
      } else {
        dataTemp.push({ timestamp: t * 1000, cexes: [], totalInflow: 0, totalOutflow: 0, totalNetflow: 0 })
      }
    }

    return dataTemp
  }, [data, showInflow, showOutflow, showNetflow, from, timerange, to, dispatch])

  const dataRange = useMemo(() => {
    if (!formattedData) return undefined
    let maxValue = 0

    formattedData.forEach(item => {
      if (item.totalInflow > maxValue) {
        maxValue = item.totalInflow
      }
      if (-item.totalOutflow > maxValue) {
        maxValue = -item.totalOutflow
      }
    })

    return [-roundNumberUp(maxValue), roundNumberUp(maxValue)]
  }, [formattedData])

  const percentage = useMemo(() => {
    const max = Math.max(...formattedData.map(_ => _.totalNetflow as number))
    const min = Math.min(...formattedData.map(_ => _.totalNetflow as number))
    return (Math.abs(0 - min) / (max - min)) * 100
  }, [formattedData])

  useEffect(() => {
    switch (tab) {
      case ChartTab.First: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showInflow', 'showOutflow', 'showNetflow'] },
        })
        break
      }
      case ChartTab.Second: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showInflow', 'showNetflow'] },
        })
        break
      }
      case ChartTab.Third: {
        dispatch({
          type: CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS,
          payload: { showOptions: ['showOutflow', 'showNetflow'] },
        })
        break
      }
    }
  }, [dispatch, tab])

  const totalStats: { timeframe: string; totalNetflow: string; totalInflow: string; totalOutflow: string } =
    useMemo(() => {
      if (formattedData.length === 0)
        return { timeframe: '--', totalNetflow: '--', totalInflow: '--', totalOutflow: '--' }

      const tf = `${dayjs(formattedData[0].timestamp).format(
        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
      )} - ${dayjs(formattedData[formattedData.length - 1].timestamp).format(
        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
      )}`

      return {
        timeframe: tf,
        totalNetflow: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.totalNetflow, 0)),
        totalInflow: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.totalInflow, 0)),
        totalOutflow: '$' + formatLocaleStringNum(-formattedData.reduce((a, b) => a + b.totalOutflow, 0)),
      }
    }, [formattedData, timeframe])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <InfoWrapper>
        <Column gap="4px">
          <Text color={theme.subText}>Timeframe</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.timeframe}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Netflow</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalNetflow}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Inflow</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalInflow}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>Total Outflow</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.totalOutflow}
          </Text>
        </Column>
      </InfoWrapper>
      <LegendWrapper>
        {above768 && (
          <>
            <LegendButton
              text="Inflow"
              iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
              enabled={showInflow}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showInflow' } })
              }
            />
            <LegendButton
              text="Outflow"
              iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
              enabled={showOutflow}
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showOutflow' } })
              }
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
              onClick={() =>
                dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showNetflow' } })
              }
            />
          </>
        )}
        <TimeFrameLegend
          selected={timeframe}
          onSelect={timeframe => dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })}
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
          stackOffset="sign"
          margin={above768 ? { top: 80, left: 20, right: 20 } : { top: 100, left: 10, right: 10, bottom: 10 }}
        >
          <CartesianGrid vertical={false} strokeWidth={1} stroke={rgba(theme.border, 0.5)} />
          <Customized component={KyberLogo} />
          <XAxis
            fontSize={textFontSize}
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm' : 'MMM DD')}
            minTickGap={12}
          />
          <YAxis
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => (value > 0 ? `$${formatShortNum(value)}` : `-$${formatShortNum(-value)}`)}
            domain={dataRange}
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
                    {payload.timestamp &&
                      dayjs(payload.timestamp).format(
                        timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD, YYYY',
                      )}
                  </Text>
                  <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                    Netflow: <span style={{ color: theme.text }}>${formatShortNum(payload.totalNetflow)}</span>
                  </Text>
                  <Row gap="16px">
                    <Column gap="4px" style={{ textTransform: 'capitalize' }}>
                      <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                        Wallet
                      </Text>
                      {payload.cexes.map((item: INetflowToCEX, index: number) => (
                        <Text key={index} fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                          {item.cex}
                        </Text>
                      ))}
                    </Column>
                    <Column gap="4px">
                      <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                        Inflow
                      </Text>
                      {payload.cexes.map((item: INetflowToCEX, index: number) => (
                        <Text key={index} fontSize={textFontSize} lineHeight="16px" color={theme.red}>
                          ${formatShortNum(item.inflow)}
                        </Text>
                      ))}
                    </Column>
                    <Column gap="4px">
                      <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                        Outflow
                      </Text>
                      {payload.cexes.map((item: INetflowToCEX, index: number) => (
                        <Text key={index} fontSize={textFontSize} lineHeight="16px" color={theme.primary}>
                          ${formatShortNum(item.outflow)}
                        </Text>
                      ))}
                    </Column>
                  </Row>
                </TooltipWrapper>
              )
            }}
          />
          <defs>
            <linearGradient id="gradient2" x1="0" y1="100%" x2="0" y2="0">
              <stop offset="0%" stopColor={theme.red} />
              <stop offset={`${percentage}%`} stopColor={theme.primary} />
              <stop offset={`${percentage}%`} stopColor={theme.red} />
              <stop offset="100%" stopColor={theme.primary} />
            </linearGradient>
          </defs>
          <Bar
            dataKey="totalInflow"
            stackId="a"
            fill={rgba(theme.red, 0.6)}
            isAnimationActive={noAnimation ? false : true}
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
            radius={[5, 5, 0, 0]}
          />
          <Bar
            dataKey="totalOutflow"
            stackId="a"
            fill={rgba(theme.primary, 0.6)}
            isAnimationActive={noAnimation ? false : true}
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
            radius={[5, 5, 0, 0]}
          />
          {showNetflow && (
            <Line
              type="linear"
              dataKey="totalNetflow"
              stroke="url(#gradient2)"
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
              {...{
                label: <CustomizedLabel timeframe={timeframe} dollarSign />,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {!above768 && (
        <Row justify="center" gap="16px" style={{ position: 'absolute', bottom: 0 }}>
          <LegendButton
            text="Inflow"
            iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
            enabled={showInflow}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showInflow' } })
            }
          />
          <LegendButton
            text="Outflow"
            iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
            enabled={showOutflow}
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showOutflow' } })
            }
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
            onClick={() =>
              dispatch({ type: CHART_STATES_ACTION_TYPE.TOGGLE_OPTION, payload: { option: 'showNetflow' } })
            }
          />
        </Row>
      )}
    </LoadingHandleWrapper>
  )
}

export const NumberofTransfers = ({ tab }: { tab: ChartTab }) => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.NUMBER_OF_TRANSFERS, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH

  const [from, to, timerange] = useMemo(() => {
    const now = Math.floor(Date.now() / 60000) * 60
    const timerange =
      {
        [KyberAITimeframe.ONE_WEEK]: 86400,
        [KyberAITimeframe.ONE_MONTH]: 86400,
        [KyberAITimeframe.THREE_MONTHS]: 86400,
        [KyberAITimeframe.SIX_MONTHS]: 86400,
      }[timeframe as string] || 86400
    const from =
      now -
      ({
        [KyberAITimeframe.ONE_WEEK]: 604800,
        [KyberAITimeframe.ONE_MONTH]: 2592000,
        [KyberAITimeframe.THREE_MONTHS]: 7776000,
        [KyberAITimeframe.SIX_MONTHS]: 15552000,
      }[timeframe as string] || 604800)
    return [from, now, timerange]
  }, [timeframe])

  const { data, isLoading } = useTransferInformationQuery(
    {
      chain,
      address,
      from,
      to,
    },
    { skip: !chain || !address },
  )
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
    const dataTemp: INumberOfTransfers[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const index = data.findIndex(item => item.timestamp === t)
      if (index >= 0) {
        dataTemp.push({ ...data[index], timestamp: t * 1000 })
      } else {
        dataTemp.push({ timestamp: t * 1000, numberOfTransfer: 0, volume: 0 })
      }
    }
    return dataTemp
  }, [data, timerange, from, to, dispatch])

  const totalStats: { timeframe: string; totalTranfers: string; totalVolume: string } = useMemo(() => {
    if (formattedData.length === 0) return { timeframe: '--', totalTranfers: '--', totalVolume: '--' }
    const tf = `${dayjs(formattedData[0].timestamp).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )} - ${dayjs(formattedData[formattedData.length - 1].timestamp).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )}`
    return {
      timeframe: tf,
      totalTranfers: formatLocaleStringNum(formattedData.reduce((a, b) => a + b.numberOfTransfer, 0)),
      totalVolume: '$' + formatLocaleStringNum(formattedData.reduce((a, b) => a + b.volume, 0)),
    }
  }, [formattedData, timeframe])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'

  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <InfoWrapper>
        <Column gap="4px">
          <Text color={theme.subText}>Timeframe</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.timeframe}
          </Text>
        </Column>
        <Column gap="4px">
          <Text color={theme.subText}>{tab === ChartTab.First ? 'Total Transfers' : 'Total Volume'}</Text>
          <Text color={theme.text} fontWeight={500}>
            {tab === ChartTab.First ? totalStats.totalTranfers : totalStats.totalVolume}
          </Text>
        </Column>
      </InfoWrapper>
      <LegendWrapper>
        <TimeFrameLegend
          selected={timeframe}
          onSelect={timeframe => dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })}
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
          data={formattedData}
          margin={
            above768
              ? {
                  top: 80,
                  right: 20,
                  left: 10,
                }
              : { top: 100, left: 0 }
          }
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
            fontSize={textFontSize}
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
            allowDataOverflow
            minTickGap={12}
          />
          <YAxis
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => `${tab === ChartTab.Second ? '$' : ''}${formatShortNum(value)}`}
            allowDataOverflow
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
                  <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                    {tab === ChartTab.First ? 'Total Transfers' : 'Total Volume'}:{' '}
                    <span style={{ color: theme.text }}>
                      {formatShortNum(tab === ChartTab.First ? payload.numberOfTransfer : payload.volume)}
                    </span>
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Area
            type="linear"
            dataKey={tab === ChartTab.First ? 'numberOfTransfer' : 'volume'}
            stroke={theme.primary}
            fill="url(#colorUv)"
            isAnimationActive={false}
            {...{
              label: <CustomizedLabel timeframe={timeframe} dollarSign={tab === ChartTab.Second} />,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </LoadingHandleWrapper>
  )
}

export const NumberofHolders = () => {
  const theme = useTheme()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.NUMBER_OF_HOLDERS, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    noData: true,
  })
  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH

  const [from, to, timerange] = useMemo(() => {
    const now = Math.floor(Date.now() / 60000) * 60 - 86400
    const timerange =
      {
        [KyberAITimeframe.ONE_WEEK]: 86400,
        [KyberAITimeframe.ONE_MONTH]: 86400,
        [KyberAITimeframe.THREE_MONTHS]: 604800,
        [KyberAITimeframe.SIX_MONTHS]: 604800,
      }[timeframe as string] || 86400
    const from =
      now -
      ({
        [KyberAITimeframe.ONE_WEEK]: 604800,
        [KyberAITimeframe.ONE_MONTH]: 2592000,
        [KyberAITimeframe.THREE_MONTHS]: 7776000,
        [KyberAITimeframe.SIX_MONTHS]: 15552000,
      }[timeframe as string] || 604800)
    return [from, now, timerange]
  }, [timeframe])
  const { data, isLoading } = useNumberOfHoldersQuery(
    {
      chain,
      address,
      from,
      to,
    },
    { skip: !chain || !address },
  )

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
    const dataTemp: INumberOfHolders[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const index = data.findIndex(item => item.timestamp === t)
      if (index >= 0) {
        dataTemp.push({ ...data[index], timestamp: t * 1000 })
      } else {
        dataTemp.push({ timestamp: t * 1000, count: 0 })
      }
    }
    return dataTemp
  }, [data, timerange, from, to, dispatch])

  const totalStats: { timeframe: string } = useMemo(() => {
    if (formattedData.length === 0) return { timeframe: '--', totalHolders: '--' }
    const tf = `${dayjs(formattedData[0].timestamp).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )} - ${dayjs(formattedData[formattedData.length - 1].timestamp).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm, MMM DD' : 'MMM DD',
    )}`
    return {
      timeframe: tf,
    }
  }, [formattedData, timeframe])
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const textFontSize = above768 ? '12px' : '10px'
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <InfoWrapper>
        <Column gap="4px">
          <Text color={theme.subText}>Timeframe</Text>
          <Text color={theme.text} fontWeight={500}>
            {totalStats.timeframe}
          </Text>
        </Column>
      </InfoWrapper>
      <LegendWrapper>
        <TimeFrameLegend
          selected={timeframe}
          onSelect={timeframe => dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })}
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
          data={formattedData}
          margin={
            above768
              ? {
                  top: 80,
                  left: 20,
                  right: 20,
                }
              : { top: 100, left: 10, right: 10 }
          }
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
            fontSize={textFontSize}
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            tickFormatter={value => dayjs(value).format('MMM DD')}
            minTickGap={12}
            allowDataOverflow
          />
          <YAxis
            fontSize={textFontSize}
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.subText, fontWeight: 400 }}
            width={40}
            tickFormatter={value => formatShortNum(value)}
            allowDataOverflow
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
                  <Text fontSize={textFontSize} lineHeight="16px" color={theme.text}>
                    Holders: <span style={{ color: theme.text }}>{formatShortNum(payload.count)}</span>
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Area
            type="linear"
            dataKey="count"
            stroke={theme.primary}
            fill="url(#colorUv)"
            isAnimationActive={false}
            {...{
              label: <CustomizedLabel timeframe={timeframe} />,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </LoadingHandleWrapper>
  )
}

const COLORS = ['#00a2f7', '#31CB9E', '#FFBB28', '#F3841E', '#FF537B', '#27AE60', '#78d5ff', '#8088E5']
const CustomLabel = ({ x, y, cx, cy, name, address, percentage, sumPercentage }: any) => {
  let customY = y
  const { chain } = useParams()
  if (Math.abs(cx - x) < 30) {
    customY = cy - y > 0 ? y - 8 : y + 8
  }
  return (
    <>
      <a
        href={chain ? getEtherscanLink(NETWORK_TO_CHAINID[chain], address, 'address') : '#'}
        target="_blank"
        rel="noreferrer"
      >
        {percentage / sumPercentage > 0.01 && (
          <text x={x} y={customY} textAnchor={x > cx ? 'start' : 'end'} fill="#31CB9E" fontSize={12}>
            {name}
          </text>
        )}
      </a>
    </>
  )
}

const CustomLabelLine = (props: any) => {
  const { percentage, points, stroke, cx, cy, sumPercentage } = props
  return (
    <>
      {percentage / sumPercentage > 0.01 ? (
        <path
          fill="none"
          d={`M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`}
          stroke={stroke}
          strokeWidth="1px"
          cx={cx}
          cy={cy}
        />
      ) : (
        <></>
      )}
    </>
  )
  // if (percentage > 0.01) {
  //   return (
  //     <path
  //       d={`M${points[0].x},${points[0].y} Q${(points[1].x + 40, points[0].y)} ${points[1].x},${points[1].y}"`}
  //       stroke={stroke}
  //       strokeWidth="1px"
  //     />
  //   )
  // } else {
  //   return <path />
  // }
}
export const HoldersChartWrapper = ({ noAnimation }: { noAnimation?: boolean }) => {
  const theme = useTheme()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const { chain, address } = useParams()
  const { dispatch } = useChartStatesContext(KYBERAI_CHART_ID.HOLDER_PIE_CHART, {
    noData: true,
  })

  const { data, isLoading } = useHolderListQuery({ address, chain })
  const formattedData: Array<IHolderList & { name: string }> = useMemo(() => {
    if (!data || data.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
    return data?.map((item: IHolderList) => {
      return { ...item, name: shortenAddress(1, item?.address) }
    })
  }, [data, dispatch])

  const sumPercentage = useMemo(() => {
    return formattedData?.reduce((s, a) => s + a.percentage, 0) || 0
  }, [formattedData])

  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={!!data && data.length > 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart
          width={100}
          height={100}
          margin={above768 ? { top: 10, right: 90, bottom: 20, left: 90 } : { top: 0, right: 80, bottom: 0, left: 80 }}
        >
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
                  <Text fontSize={above768 ? '12px' : '10px'} lineHeight="16px" color={theme.text}>
                    {payload.address}
                  </Text>
                  <Text fontSize={above768 ? '12px' : '10px'} lineHeight="16px" color={theme.subText}>
                    Supply Owned: <span style={{ color: theme.text }}>{(payload.percentage * 100).toFixed(2)}%</span>
                  </Text>
                </TooltipWrapper>
              )
            }}
          />
          <Pie
            dataKey="percentage"
            label={props => <CustomLabel {...props} sumPercentage={sumPercentage} />}
            labelLine={props => <CustomLabelLine {...props} sumPercentage={sumPercentage} />}
            nameKey="name"
            data={formattedData}
            innerRadius="60%"
            outerRadius="80%"
            strokeWidth={0}
            isAnimationActive={noAnimation ? false : true}
            animationBegin={ANIMATION_DELAY}
            animationDuration={ANIMATION_DURATION}
          >
            {formattedData?.map((entry: IHolderList, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] + 'e0'} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </LoadingHandleWrapper>
  )
}

export const LiquidOnCentralizedExchanges = ({ noAnimation }: { noAnimation?: boolean }) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { chain, address } = useParams()
  const { state, dispatch } = useChartStatesContext(KYBERAI_CHART_ID.LIQUID_ON_CEX, {
    timeframe: KyberAITimeframe.ONE_MONTH,
    noData: true,
  })

  const timeframe = state?.timeframe || KyberAITimeframe.ONE_MONTH

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
  const { data, isLoading } = useCexesLiquidationQuery(
    {
      tokenAddress: address,
      chartSize: timeframe.toString().toLowerCase(),
      chain,
    },
    { skip: !address || !chain },
  )
  const { data: tokenOverview } = useKyberAITokenOverview()
  const [showLong, setShowLong] = useState(true)
  const [showShort, setShowShort] = useState(true)
  const [showPrice, setShowPrice] = useState(true)

  const dataRange = useMemo(() => {
    if (!data) return undefined
    let maxValue = 0

    data.chart.forEach(item => {
      if (item.buyVolUsd > maxValue) {
        maxValue = item.buyVolUsd
      }
      if (item.sellVolUsd > maxValue) {
        maxValue = item.sellVolUsd
      }
    })

    return [-roundNumberUp(maxValue), roundNumberUp(maxValue)]
  }, [data])

  const formattedData: ILiquidCEX[] = useMemo(() => {
    if (!data || data.chart.length === 0) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: true } })
      return []
    } else {
      dispatch({ type: CHART_STATES_ACTION_TYPE.NO_DATA, payload: { value: false } })
    }
    const dataTemp: (ILiquidCEX & { totalVol: number })[] = []
    const startTimestamp = (Math.floor(from / timerange) + 1) * timerange
    for (let t = startTimestamp; t < to; t += timerange) {
      const index = data.chart.findIndex((item: any) => item.timestamp === t)
      if (index >= 0) {
        dataTemp.push({
          ...data.chart[index],
          timestamp: t * 1000,
          totalVol: data.chart[index].buyVolUsd + data.chart[index].sellVolUsd,
          buyVolUsd: -data.chart[index].buyVolUsd,
        })
      } else {
        dataTemp.push({ timestamp: t * 1000, buyVolUsd: 0, exchanges: [], price: 0, sellVolUsd: 0, totalVol: 0 })
      }
    }
    //remove last zero data point to cover case api time gap
    if (dataTemp.length > 0 && dataTemp[dataTemp.length - 1].price === 0) {
      return dataTemp.slice(0, -1)
    }
    return dataTemp
  }, [data, from, to, timerange, dispatch])

  const totalStats: { timeframe: string; totalVolumes: string; totalBuys: string; totalSells: string } = useMemo(() => {
    if (formattedData.length === 0) return { timeframe: '--', totalVolumes: '--', totalBuys: '--', totalSells: '--' }

    const tf = `${dayjs(from * 1000).format(
      timeframe === KyberAITimeframe.ONE_DAY ? 'HH:00 MMM DD' : 'MMM DD',
    )} - ${dayjs(to * 1000).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:00 MMM DD' : 'MMM DD')}`

    return {
      timeframe: tf,
      totalVolumes: formatLocaleStringNum(formattedData.reduce((a, b) => a + b.buyVolUsd + b.sellVolUsd, 0)),
      totalBuys: formatLocaleStringNum(-formattedData.reduce((a, b) => a + b.buyVolUsd, 0)),
      totalSells: formatLocaleStringNum(formattedData.reduce((a, b) => a + b.sellVolUsd, 0)),
    }
  }, [formattedData, timeframe, from, to])

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <LoadingHandleWrapper isLoading={isLoading} hasData={formattedData.length > 0}>
      <>
        {account ? (
          <>
            <InfoWrapper>
              <Column gap="4px">
                <Text color={theme.subText}>Timeframe</Text>
                <Text color={theme.text} fontWeight={500}>
                  {totalStats.timeframe}
                </Text>
              </Column>
              <Column gap="4px">
                <Text color={theme.subText}>Total Longs</Text>
                <Text color={theme.text} fontWeight={500}>
                  ${totalStats.totalSells}
                </Text>
              </Column>
              <Column gap="4px">
                <Text color={theme.subText}>Total Shorts</Text>
                <Text color={theme.text} fontWeight={500}>
                  ${totalStats.totalBuys}
                </Text>
              </Column>
            </InfoWrapper>
            <LegendWrapper>
              {above768 && (
                <>
                  <LegendButton
                    text="Longs"
                    iconStyle={{ backgroundColor: rgba(theme.primary, 0.6) }}
                    enabled={showLong}
                    onClick={() => setShowLong(prev => !prev)}
                  />
                  <LegendButton
                    text="Shorts"
                    iconStyle={{ backgroundColor: rgba(theme.red, 0.6) }}
                    enabled={showShort}
                    onClick={() => setShowShort(prev => !prev)}
                  />
                  <LegendButton
                    text={`${tokenOverview?.symbol.toUpperCase()} Price`}
                    iconStyle={{
                      height: '4px',
                      width: '16px',
                      borderRadius: '8px',
                      backgroundColor: rgba(theme.text, 0.8),
                    }}
                    enabled={showPrice}
                    onClick={() => setShowPrice(prev => !prev)}
                  />
                </>
              )}
              <TimeFrameLegend
                selected={timeframe}
                onSelect={timeframe =>
                  dispatch({ type: CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE, payload: { timeframe } })
                }
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
                height={500}
                data={formattedData}
                stackOffset="sign"
                margin={{ left: 10, right: 20, top: 80 }}
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
                  tickFormatter={value =>
                    dayjs(value).format(timeframe === KyberAITimeframe.ONE_DAY ? 'HH:mm A, MMM DD' : 'MMM DD')
                  }
                  minTickGap={12}
                />
                <YAxis
                  yAxisId="left"
                  fontSize="12px"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.subText, fontWeight: 400 }}
                  width={40}
                  orientation="left"
                  tickFormatter={value => '$' + formatShortNum(value)}
                  domain={dataRange}
                />
                <YAxis
                  yAxisId="right"
                  fontSize="12px"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: theme.subText, fontWeight: 400 }}
                  width={40}
                  orientation="right"
                  tickFormatter={value => '$' + formatShortNum(value)}
                  domain={[(dataMin: any) => dataMin * 0.98, (dataMax: any) => dataMax * 1.01]}
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
                          {tokenOverview?.symbol?.toUpperCase()} Price:{' '}
                          <span style={{ color: theme.text, marginLeft: '8px' }}>
                            ${formatTokenPrice(payload.price)}
                          </span>
                        </Text>
                        <Row gap="24px">
                          <Column gap="8px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              CEX
                            </Text>
                            {payload.exchanges.map((i: any) => (
                              <Text key={i.exchangeName} fontSize="12px" lineHeight="16px" color={theme.subText}>
                                {i.exchangeName}:
                              </Text>
                            ))}
                          </Column>
                          <Column gap="8px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              Longs
                            </Text>
                            {payload.exchanges.map((i: any) => (
                              <Text
                                key={i.exchangeName + 'long'}
                                fontSize="12px"
                                lineHeight="16px"
                                color={theme.primary}
                              >
                                ${formatShortNum(i.sellVolUsd)}
                              </Text>
                            ))}
                          </Column>
                          <Column gap="8px">
                            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
                              Shorts
                            </Text>
                            {payload.exchanges.map((i: any) => (
                              <Text key={i.exchangeName + 'long'} fontSize="12px" lineHeight="16px" color={theme.red}>
                                ${formatShortNum(i.buyVolUsd)}
                              </Text>
                            ))}
                          </Column>
                        </Row>
                        <Divider />
                        <Row gap="24px" justify="space-between">
                          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
                            Total:
                          </Text>
                          <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
                            ${formatShortNum(payload.sellVolUsd)}
                          </Text>
                          <Text fontSize="12px" lineHeight="16px" color={theme.red}>
                            ${formatShortNum(-payload.buyVolUsd)}
                          </Text>
                        </Row>
                      </TooltipWrapper>
                    )
                  }}
                />
                {showLong && (
                  <Bar
                    dataKey="sellVolUsd"
                    stackId="a"
                    fill={rgba(theme.primary, 0.6)}
                    isAnimationActive={noAnimation ? false : true}
                    animationBegin={ANIMATION_DELAY}
                    animationDuration={ANIMATION_DURATION}
                    yAxisId="left"
                    radius={[5, 5, 0, 0]}
                  />
                )}
                {showShort && (
                  <Bar
                    dataKey="buyVolUsd"
                    stackId="a"
                    fill={rgba(theme.red, 0.6)}
                    isAnimationActive={noAnimation ? false : true}
                    animationBegin={ANIMATION_DELAY}
                    animationDuration={ANIMATION_DURATION}
                    yAxisId="left"
                    radius={[5, 5, 0, 0]}
                  />
                )}
                {showPrice && (
                  <Line
                    yAxisId="right"
                    type="linear"
                    dataKey="price"
                    stroke={theme.text}
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={false}
                    {...{
                      label: <CustomizedPriceLabel timeframe={timeframe} />,
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <></>
        )}
      </>
    </LoadingHandleWrapper>
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

export const Prochart = ({
  isBTC,
  tvWidget,
  setTvWidget,
}: {
  isBTC?: boolean
  tvWidget: IChartingLibraryWidget | undefined
  setTvWidget: React.Dispatch<React.SetStateAction<IChartingLibraryWidget | undefined>>
}) => {
  const theme = useTheme()
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(false)
  const userLocale = useUserLocale()
  const { data } = useKyberAITokenOverview()
  const datafeed = useDatafeed(isBTC || false, data)
  const { SRLevels, currentPrice, resolution, setResolution, showSRLevels } = useContext(TechnicalAnalysisContext)

  const variablesRef = useRef({ resolution })
  useLayoutEffect(() => {
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
      timezone: getTradingViewTimeZone(),
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
        .createStudy('Relative Strength Index')
        .then(() => {
          tvWidget.activeChart().getPanes()[1].setHeight(120)
          setLoading(false)
        })
      setTvWidget(tvWidget)
      tvWidget
        .activeChart()
        .onIntervalChanged()
        .subscribe(
          null,
          r => {
            const resolution = { 60: '1h', 240: '4h', '1D': '1d', '4D': '4d' }[r as string] || '1h'
            if (resolution !== variablesRef.current?.resolution) {
              setResolution?.(resolution)
            }
          },
          false,
        )
    })

    return () => {
      tvWidget?.remove()
      setTvWidget(undefined)
    }
  }, [theme, ref, datafeed, setResolution, userLocale, setTvWidget])

  const entityIds = useRef<(EntityId | null)[]>([])

  const removeSRLevels = useCallback(() => {
    entityIds.current?.forEach(entityId => {
      return entityId && tvWidget?.activeChart().removeEntity(entityId)
    })
  }, [tvWidget])

  const addSRLevels = useCallback(() => {
    if (!currentPrice || !tvWidget) return
    SRLevels?.forEach((level: ISRLevel) => {
      const entityId = tvWidget.activeChart().createMultipointShape([{ time: level.timestamp, price: level.value }], {
        shape: 'horizontal_ray',
        lock: true,
        disableSelection: true,
        disableSave: true,
        overrides: {
          linecolor: currentPrice > level.value ? theme.primary : theme.red,
          linewidth: 1,
          linestyle: 2,
        },
      })
      entityIds.current.push(entityId)
    }, true)
  }, [SRLevels, tvWidget, currentPrice, theme])

  useEffect(() => {
    if (!tvWidget || !SRLevels || !currentPrice) return
    const handleDataLoaded = () => {
      removeSRLevels()
      entityIds.current = []
      showSRLevels && addSRLevels()
    }
    try {
      const subscriptionDataLoaded = tvWidget?.activeChart()?.onDataLoaded()
      subscriptionDataLoaded?.subscribe(null, handleDataLoaded, true)

      if (!showSRLevels) {
        removeSRLevels()
      } else {
        addSRLevels()
      }
    } catch (error) {}
  }, [tvWidget, SRLevels, showSRLevels, currentPrice, theme, removeSRLevels, addSRLevels])

  useEffect(() => {
    if (resolution && tvWidget?.activeChart().resolution() !== (resolution as ResolutionString)) {
      tvWidget?.activeChart().setResolution(resolution as ResolutionString)
      variablesRef.current.resolution = resolution
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
