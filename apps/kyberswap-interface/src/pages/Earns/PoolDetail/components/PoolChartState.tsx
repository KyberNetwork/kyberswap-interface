import { Component, type ReactNode, forwardRef } from 'react'

import { ReactComponent as PriceChartEmptyIcon } from 'assets/svg/price-chart-empty.svg'
import ProgressBar from 'components/ProgressBar'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'

const DEFAULT_CHART_HEIGHT = 360

interface PoolChartWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  $height?: number
}

export const PoolChartWrapper = forwardRef<HTMLDivElement, PoolChartWrapperProps>(function PoolChartWrapper(
  { $height, style, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} className="w-full" style={{ height: `${$height ?? DEFAULT_CHART_HEIGHT}px`, ...style }} {...rest}>
      {children}
    </div>
  )
})

const SkeletonBar = ({ $height, children }: { $height: number; children?: ReactNode }) => (
  <div
    className="bg-text/[0.04] relative min-w-1 max-w-3 flex-1 overflow-hidden rounded-t"
    style={{ height: `${$height}%` }}
  >
    {children}
  </div>
)

const SkeletonBarShimmer = () => (
  <div
    className="absolute inset-0 opacity-70"
    style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, var(--ks-text-04) 50%, rgba(255,255,255,0) 100%)',
      animation: 'ks-shimmer-x 1.8s linear infinite',
    }}
  />
)

type PoolChartSkeletonProps = {
  height?: number
  type?: 'line' | 'bar' | 'candle'
}

type PoolChartMessageProps = {
  height?: number
  message: string
  showIcon?: boolean
  textColor?: string
  textWeight?: number
}

type PoolChartStateProps = {
  children: ReactNode
  emptyMessage?: string
  errorMessage?: string
  exclusiveType?: 'earning-chart' | 'liquidity-flow'
  height?: number
  isEmpty?: boolean
  isError?: boolean
  isFetching?: boolean
  isLoading?: boolean
  skeletonType?: PoolChartSkeletonProps['type']
}

const ChartFetchingOverlay = ({ children }: { children: ReactNode }) => (
  <div className="bg-background/[0.06] pointer-events-none absolute inset-0 z-[1] pt-1 backdrop-blur">{children}</div>
)

class PoolChartRenderBoundary extends Component<
  {
    children: ReactNode
    fallback: (error: Error) => ReactNode
  },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error)
    }

    return this.props.children
  }
}

const PoolChartStateLayout = ({
  children,
  gap,
  height = DEFAULT_CHART_HEIGHT,
}: {
  children: ReactNode
  gap: number
  height?: number
}) => {
  const theme = useTheme()

  return (
    <Stack
      align="center"
      border={`1px dashed ${theme.border}`}
      borderRadius={16}
      gap={gap}
      height={height}
      justify="center"
      p="20px"
      textAlign="center"
      width="100%"
    >
      {children}
    </Stack>
  )
}

const LineChartSkeleton = ({ height }: { height: number }) => {
  return (
    <div style={{ height: `${Math.max(height - 64, 0)}px`, width: '100%' }}>
      <svg height="100%" preserveAspectRatio="none" viewBox="0 0 600 240" width="100%">
        <defs>
          <linearGradient id="pool-chart-line-skeleton-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="var(--ks-text-04)" />
            <stop offset="50%" stopColor="var(--ks-text-12)">
              <animate attributeName="offset" dur="1.8s" repeatCount="indefinite" values="-0.5; 0.5; 1.5" />
            </stop>
            <stop offset="100%" stopColor="var(--ks-text-04)" />
          </linearGradient>
        </defs>

        <path
          d="M24 182 C78 168, 110 116, 152 126 S246 196, 302 148 S390 68, 444 88 S526 164, 576 134"
          fill="none"
          stroke="url(#pool-chart-line-skeleton-gradient)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
    </div>
  )
}

const BarChartSkeleton = ({ height }: { height: number }) => {
  const barHeights = [15, 20, 5, 10, 15, 30, 10, 15, 60, 70, 85, 90, 100, 70, 80, 40, 55, 60, 15, 20, 25, 15, 10, 5]

  return (
    <div style={{ height: `${Math.max(height - 64, 0)}px`, width: '100%' }}>
      <HStack align="flex-end" gap={8} height="100%" justify="center" p="8px" width="100%">
        {barHeights.map((barHeight, index) => (
          <SkeletonBar $height={barHeight * 0.8} key={index}>
            <SkeletonBarShimmer />
          </SkeletonBar>
        ))}
      </HStack>
    </div>
  )
}

const CandleChartSkeleton = ({ height }: { height: number }) => {
  const candles = [
    { bodyHeight: 34, bodyY: 142, wickTop: 88, wickBottom: 202, x: 38 },
    { bodyHeight: 52, bodyY: 116, wickTop: 74, wickBottom: 198, x: 96 },
    { bodyHeight: 38, bodyY: 136, wickTop: 102, wickBottom: 206, x: 154 },
    { bodyHeight: 58, bodyY: 102, wickTop: 66, wickBottom: 194, x: 212 },
    { bodyHeight: 42, bodyY: 128, wickTop: 92, wickBottom: 210, x: 270 },
    { bodyHeight: 66, bodyY: 84, wickTop: 48, wickBottom: 186, x: 328 },
    { bodyHeight: 44, bodyY: 122, wickTop: 80, wickBottom: 202, x: 386 },
    { bodyHeight: 56, bodyY: 104, wickTop: 64, wickBottom: 192, x: 444 },
    { bodyHeight: 36, bodyY: 140, wickTop: 106, wickBottom: 212, x: 502 },
    { bodyHeight: 48, bodyY: 118, wickTop: 78, wickBottom: 200, x: 560 },
  ]

  return (
    <div style={{ height: `${Math.max(height - 64, 0)}px`, width: '100%' }}>
      <svg height="100%" preserveAspectRatio="none" viewBox="0 0 600 240" width="100%">
        <defs>
          <linearGradient id="pool-chart-candle-skeleton-shimmer" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="var(--ks-text-12)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <mask id="pool-chart-candle-skeleton-mask">
            {candles.map(candle => (
              <g key={candle.x}>
                <line
                  stroke="white"
                  strokeLinecap="round"
                  strokeWidth="2"
                  x1={candle.x}
                  x2={candle.x}
                  y1={candle.wickTop}
                  y2={candle.wickBottom}
                />
                <rect height={candle.bodyHeight} rx="4" width="24" x={candle.x - 12} y={candle.bodyY} fill="white" />
              </g>
            ))}
          </mask>
        </defs>

        {candles.map(candle => (
          <g key={candle.x}>
            <line
              stroke="var(--ks-text-04)"
              strokeLinecap="round"
              strokeWidth="2"
              x1={candle.x}
              x2={candle.x}
              y1={candle.wickTop}
              y2={candle.wickBottom}
            />
            <rect
              fill="var(--ks-text-04)"
              height={candle.bodyHeight}
              rx="4"
              width="24"
              x={candle.x - 12}
              y={candle.bodyY}
            />
          </g>
        ))}
        <rect
          fill="url(#pool-chart-candle-skeleton-shimmer)"
          height="240"
          mask="url(#pool-chart-candle-skeleton-mask)"
          width="240"
          x="-240"
          y="0"
        >
          <animateTransform
            attributeName="transform"
            dur="2.4s"
            repeatCount="indefinite"
            type="translate"
            values="-240 0; 600 0"
          />
        </rect>
      </svg>
    </div>
  )
}

export const PoolChartSkeleton = ({ height = DEFAULT_CHART_HEIGHT, type = 'line' }: PoolChartSkeletonProps) => {
  return (
    <PoolChartStateLayout gap={12} height={height}>
      {type === 'line' ? <LineChartSkeleton height={height} /> : null}
      {type === 'bar' ? <BarChartSkeleton height={height} /> : null}
      {type === 'candle' ? <CandleChartSkeleton height={height} /> : null}
    </PoolChartStateLayout>
  )
}

const LiquidityFlowChartSkeleton = ({ height = DEFAULT_CHART_HEIGHT }: PoolChartSkeletonProps) => {
  return (
    <Stack gap={12}>
      <PoolChartSkeleton height={height} type="bar" />
      <HStack gap={16} justify="center" wrap="wrap">
        {Array.from({ length: 3 }).map((_, index) => (
          <HStack align="center" gap={16} key={index}>
            <Skeleton height={14.5} width={120} />
          </HStack>
        ))}
      </HStack>
    </Stack>
  )
}

const EarningChartSkeleton = ({ height = DEFAULT_CHART_HEIGHT }: PoolChartSkeletonProps) => {
  const isCompact = height <= 240
  const breakdownChartSize = isCompact ? 160 : 180

  return (
    <Stack gap={16}>
      <PoolChartSkeleton height={height} type="bar" />
      <Stack
        align="center"
        direction={isCompact ? 'column' : 'row'}
        gap={isCompact ? 12 : 20}
        justify="center"
        sx={{ margin: '0 auto' }}
        width={isCompact ? '100%' : 'fit-content'}
      >
        <Skeleton circle height={breakdownChartSize} width={breakdownChartSize} />
        <Stack gap={12} width="fit-content">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton height={17} key={index} width={120} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

const PoolChartEmptyState = ({
  height = DEFAULT_CHART_HEIGHT,
  message,
  showIcon = false,
  textColor,
  textWeight,
}: PoolChartMessageProps) => {
  const theme = useTheme()

  return (
    <PoolChartStateLayout gap={12} height={height}>
      {showIcon ? <PriceChartEmptyIcon height={128} width={128} /> : null}
      <span className="text-sm" style={{ color: textColor ?? theme.subText, fontWeight: textWeight ?? 500 }}>
        {message}
      </span>
    </PoolChartStateLayout>
  )
}

const PoolChartState = ({
  children,
  emptyMessage,
  errorMessage,
  exclusiveType,
  height = DEFAULT_CHART_HEIGHT,
  isEmpty,
  isError,
  isFetching,
  isLoading,
  skeletonType,
}: PoolChartStateProps) => {
  if (isLoading) {
    if (exclusiveType === 'liquidity-flow') {
      return <LiquidityFlowChartSkeleton height={height} />
    }

    if (exclusiveType === 'earning-chart') {
      return <EarningChartSkeleton height={height} />
    }

    return <PoolChartSkeleton height={height} type={skeletonType} />
  }

  if (isError && errorMessage) {
    return <PoolChartEmptyState height={height} message={errorMessage} />
  }

  if (isEmpty && emptyMessage) {
    return <PoolChartEmptyState height={height} message={emptyMessage} showIcon />
  }

  const content = isFetching ? (
    <div className="relative w-full">
      {children}
      <ChartFetchingOverlay>
        <ProgressBar loading height="3px" width="100%" />
      </ChartFetchingOverlay>
    </div>
  ) : (
    children
  )

  return (
    <PoolChartRenderBoundary fallback={error => <PoolChartEmptyState height={height} message={error.message} />}>
      {content}
    </PoolChartRenderBoundary>
  )
}

export default PoolChartState
