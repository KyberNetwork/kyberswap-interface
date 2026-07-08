import { useMemo, useState } from 'react'
import { useMedia } from 'react-use'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { type PoolAnalyticsWindow, usePoolLiquidityFlowsQuery } from 'services/earn'

import SegmentedControl from 'components/SegmentedControl'
import useTheme from 'hooks/useTheme'
import {
  CHART_WINDOW_OPTIONS,
  formatAxisTimeLabel,
  formatCompactUsd,
  formatTooltipTimeLabel,
  formatUsd,
} from 'pages/Earns/PoolDetail/Information/utils'
import PoolChartState, { PoolChartWrapper } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { MEDIA_WIDTHS } from 'theme'

type LiquidityFlowPoint = {
  addUsd: number
  lpVolumeUsd: number
  removeUsd: number
  ts: number
  tvlUsd: number
}

type TooltipContentProps = {
  active?: boolean
  payload?: Array<{ payload?: LiquidityFlowPoint }>
}

type LiquidityFlowsChartProps = {
  chainId: number
  poolAddress: string
}

const LiquidityFlowsTooltip = ({
  active,
  point,
  window,
}: {
  active?: boolean
  point?: LiquidityFlowPoint
  window: PoolAnalyticsWindow
}) => {
  const theme = useTheme()

  if (!active || !point) return null

  return (
    <div
      className="flex min-w-[220px] flex-col gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3"
      style={{ boxShadow: `0 12px 32px ${theme.shadow}` }}
    >
      <span className="text-xs text-subText">{formatTooltipTimeLabel(point.ts, window)}</span>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <span className="text-xs text-subText">Add Liquidity</span>
        <span className="text-right text-xs font-medium text-text">{formatUsd(Math.abs(point.addUsd))}</span>
        <span className="text-xs text-subText">Remove Liquidity</span>
        <span className="text-right text-xs font-medium text-text">{formatUsd(Math.abs(point.removeUsd))}</span>
        <span className="text-xs text-subText">Net Flow</span>
        <span className="text-right text-xs font-medium text-text">
          {formatUsd(point.lpVolumeUsd, { allowDisplayNegative: true })}
        </span>
        <span className="text-xs text-subText">TVL</span>
        <span className="text-right text-xs font-medium text-text">
          {formatUsd(point.tvlUsd, { allowDisplayNegative: true })}
        </span>
      </div>
    </div>
  )
}

const LiquidityFlowsChart = ({ chainId, poolAddress }: LiquidityFlowsChartProps) => {
  const theme = useTheme()

  const [window, setWindow] = useState<PoolAnalyticsWindow>('24h')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const chartHeight = upToSmall ? 280 : 360

  const activeDotStroke = theme.buttonBlack
  const addLiquidityColor = `${theme.darkGreen}cc`
  const cursorColor = `${theme.text}1f`
  const gridColor = `${theme.text}0f`
  const lpVolumeLineColor = theme.primary
  const referenceLineColor = `${theme.text}1f`
  const removeLiquidityColor = `${theme.red}80`

  const {
    data: liquidityFlowData,
    isError,
    isLoading,
  } = usePoolLiquidityFlowsQuery({
    chainId,
    address: poolAddress,
    window,
  })

  const chartData = useMemo<LiquidityFlowPoint[]>(
    () =>
      (liquidityFlowData?.buckets ?? []).map(bucket => ({
        ...bucket,
        lpVolumeUsd: bucket.addUsd - bucket.removeUsd,
        removeUsd: -bucket.removeUsd,
      })),
    [liquidityFlowData?.buckets],
  )

  const handleSelectWindow = (value: PoolAnalyticsWindow) => {
    setWindow(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <span className="text-lg font-medium text-text">Liquidity Flows</span>

        <SegmentedControl onChange={handleSelectWindow} options={CHART_WINDOW_OPTIONS} value={window} />
      </div>

      <PoolChartState
        emptyMessage="No liquidity flow data available for this pool."
        errorMessage="Unable to load liquidity flows."
        exclusiveType="liquidity-flow"
        height={chartHeight}
        isEmpty={!chartData.length}
        isError={isError}
        isLoading={isLoading}
      >
        <div className="flex flex-col gap-3">
          <PoolChartWrapper $height={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                barCategoryGap={upToSmall ? '20%' : '16%'}
                data={chartData}
                margin={{ top: 8, right: 0, bottom: 8, left: 0 }}
                stackOffset="sign"
              >
                <CartesianGrid stroke={gridColor} vertical={false} />
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
                  orientation="left"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactUsd(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="flow"
                />
                <YAxis
                  axisLine={false}
                  orientation="right"
                  stroke={theme.subText}
                  tick={{ fill: theme.subText, fontSize: 12 }}
                  tickFormatter={(value: number) => formatCompactUsd(value)}
                  tickLine={false}
                  width={72}
                  yAxisId="tvl"
                />
                <Tooltip
                  content={(props: TooltipContentProps) => (
                    <LiquidityFlowsTooltip
                      active={props.active}
                      point={props.payload?.[0]?.payload as LiquidityFlowPoint | undefined}
                      window={window}
                    />
                  )}
                  cursor={{ stroke: cursorColor, strokeDasharray: '4 4' }}
                />
                <ReferenceLine stroke={referenceLineColor} y={0} yAxisId="flow" />
                <Bar
                  dataKey="addUsd"
                  fill={addLiquidityColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Bar
                  dataKey="removeUsd"
                  fill={removeLiquidityColor}
                  radius={[4, 4, 0, 0]}
                  stackId="liquidity-flow"
                  yAxisId="flow"
                />
                <Line
                  activeDot={{ fill: lpVolumeLineColor, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="lpVolumeUsd"
                  dot={false}
                  stroke={lpVolumeLineColor}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="flow"
                />
                <Line
                  activeDot={{ fill: theme.text, r: 4, stroke: activeDotStroke, strokeWidth: 2 }}
                  dataKey="tvlUsd"
                  dot={false}
                  stroke={theme.text}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  type="monotone"
                  yAxisId="tvl"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </PoolChartWrapper>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-3.5 rounded-full" style={{ background: addLiquidityColor }} />
              <span className="text-xs text-subText">Add Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3.5 rounded-full" style={{ background: removeLiquidityColor }} />
              <span className="text-xs text-subText">Remove Liquidity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 rounded-full bg-primary" />
              <span className="text-xs text-subText">Net Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1 w-4 rounded-full bg-text" />
              <span className="text-xs text-subText">TVL</span>
            </div>
          </div>
        </div>
      </PoolChartState>
    </div>
  )
}

export default LiquidityFlowsChart
