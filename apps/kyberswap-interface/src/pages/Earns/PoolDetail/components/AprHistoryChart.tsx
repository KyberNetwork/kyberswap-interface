import { formatAprNumber } from '@kyber/utils'
import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  type PoolAnalyticsWindow,
  type PoolAprHistoryPoint,
  usePoolAprHistoryQuery,
  usePositionAprHistoryQuery,
} from 'services/zapEarn'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as FarmingLmIcon } from 'assets/svg/kyber/kemLm.svg'
import SegmentedControl from 'components/SegmentedControl'
import useTheme from 'hooks/useTheme'
import {
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatTooltipTimeLabel,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { ProgramType } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const formatAprValue = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

const FarmingMarker = ({ programs = [] }: { programs?: Array<ProgramType> }) => {
  const isFarming = programs.includes(ProgramType.EG) || programs.includes(ProgramType.LM)
  const isFarmingLm = programs.includes(ProgramType.LM)

  if (!isFarming) return null

  return isFarmingLm ? <FarmingLmIcon width={20} height={20} /> : <FarmingIcon width={20} height={20} />
}

const AprHistoryTooltip = ({
  active,
  point,
  showActiveApr,
  window,
}: {
  active?: boolean
  point?: PoolAprHistoryPoint
  showActiveApr: boolean
  window: PoolAnalyticsWindow
}) => {
  const theme = useTheme()

  if (!active || !point) return null

  return (
    <div
      className="flex min-w-[220px] flex-col gap-3 rounded-xl border border-border bg-tableHeader px-4 py-3"
      style={{ boxShadow: `0 12px 32px ${theme.shadow}` }}
    >
      <span className="text-xs text-subText">{formatTooltipTimeLabel(point.ts, window)}</span>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        {showActiveApr && point.activeApr !== undefined ? (
          <>
            <span className="text-xs text-subText">Active APR</span>
            <span className="text-right text-xs font-medium text-primary">{formatAprNumber(point.activeApr)}%</span>
          </>
        ) : null}
        <span className="text-xs text-subText">APR</span>
        <span className="text-right text-xs font-medium text-blue">{formatAprNumber(point.totalApr)}%</span>
        {point.volumeUsd || point.volumeUsd === 0 ? (
          <>
            <span className="text-xs text-subText">Vol</span>
            <span className="text-right text-xs font-medium text-text">
              {formatDisplayNumber(point.volumeUsd, { style: 'currency', significantDigits: 6 })}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

type AprHistoryChartProps = {
  chainId: number
  poolAddress?: string
  positionId?: string
  programs?: Array<ProgramType>
  currentApr?: {
    totalApr?: number
    activeApr?: number
  }
}

const AprHistoryChart = ({ chainId, poolAddress, positionId, programs, currentApr }: AprHistoryChartProps) => {
  const theme = useTheme()

  const [window, setWindow] = useState<PoolAnalyticsWindow>('7d')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const activeDotStroke = theme.buttonBlack
  const aprLineColor = theme.blue
  const activeAprLineColor = theme.primary
  const volumeUpColor = `${theme.darkGreen}cc`
  const volumeDownColor = `${theme.red}80`
  const cursorColor = `${theme.text}1f`
  const gridColor = `${theme.text}0f`

  const poolAprHistoryQuery = usePoolAprHistoryQuery(
    { chainId, address: poolAddress || '', window },
    { skip: !poolAddress },
  )
  const positionAprHistoryQuery = usePositionAprHistoryQuery(
    { chainId, positionId: positionId || '', window },
    { skip: !positionId },
  )

  const isPositionChart = !!positionId
  const aprHistoryData = isPositionChart ? positionAprHistoryQuery.data : poolAprHistoryQuery.data
  const isError = isPositionChart ? positionAprHistoryQuery.isError : poolAprHistoryQuery.isError
  const isLoading = isPositionChart ? positionAprHistoryQuery.isLoading : poolAprHistoryQuery.isLoading

  const chartData = useMemo(
    () =>
      (aprHistoryData?.points ?? []).map(point => {
        return {
          ...point,
          volumeBarColor: point.close >= point.open ? volumeUpColor : volumeDownColor,
        }
      }),
    [aprHistoryData?.points, volumeDownColor, volumeUpColor],
  )

  const latestAprPoint = chartData[chartData.length - 1]
  const activeApr = currentApr?.activeApr ?? latestAprPoint?.activeApr
  const totalApr = currentApr?.totalApr ?? latestAprPoint?.totalApr
  const hasActiveApr = activeApr !== undefined
  const showActiveApr = !isPositionChart && hasActiveApr

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-h-12 flex-col gap-1">
          {showActiveApr && totalApr !== undefined && (
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-subText">APR</span>
              <span className="text-sm font-medium text-blue">{formatAprValue(totalApr)}</span>
            </div>
          )}

          {showActiveApr ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-text">Active APR</span>
              <div className="flex items-center gap-1">
                <FarmingMarker programs={programs} />
                <span className="text-xl font-medium leading-none text-primary">{formatAprValue(activeApr)}</span>
              </div>
              <span className="text-sm text-subText">(Earning Per Active TVL)</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-base font-medium text-text">APR</span>
              <div className="flex items-center gap-1">
                <FarmingMarker programs={programs} />
                <span className="text-xl font-medium leading-none text-blue">{formatAprValue(totalApr)}</span>
              </div>
              <span className="text-sm text-subText">
                {isPositionChart ? '(Earning Per Position Liquidity)' : '(Earning Per Total TVL)'}
              </span>
            </div>
          )}
        </div>

        <SegmentedControl onChange={setWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </div>

      <PoolChartState
        emptyMessage="Historical APR data is not available yet."
        errorMessage="Unable to load APR history."
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isLoading}
        skeletonType="line"
      >
        <PoolChartWrapper $height={chartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 0, bottom: 8, left: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="ts"
                minTickGap={24}
                stroke={theme.subText}
                tick={{ fill: theme.subText, fontSize: 12 }}
                tickFormatter={(value: number) => formatAxisTimeLabel(value, window)}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                orientation="right"
                stroke={theme.subText}
                tick={{ fill: theme.subText, fontSize: 12 }}
                tickFormatter={(value: number) => `${formatAprNumber(Number(value))}%`}
                tickLine={false}
                width={72}
              />
              <YAxis
                dataKey="volumeUsd"
                domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax * 5 : 1)]}
                hide
                yAxisId="volumeUsd"
              />
              <Tooltip
                content={({ active, payload }) => (
                  <AprHistoryTooltip
                    active={active}
                    point={payload?.[0]?.payload}
                    showActiveApr={showActiveApr}
                    window={window}
                  />
                )}
                cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }}
              />
              <Bar barSize={8} dataKey="volumeUsd" radius={[2, 2, 0, 0]} yAxisId="volumeUsd">
                {chartData.map(point => (
                  <Cell key={`${point.ts}-volumeUsd`} fill={point.volumeBarColor} />
                ))}
              </Bar>
              {showActiveApr && (
                <Line
                  activeDot={{ fill: activeAprLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="activeApr"
                  dot={false}
                  stroke={activeAprLineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                />
              )}
              <Line
                activeDot={{ fill: aprLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                dataKey="totalApr"
                dot={false}
                stroke={aprLineColor}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </PoolChartWrapper>
      </PoolChartState>
    </div>
  )
}

export default AprHistoryChart
