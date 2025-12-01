import { MAX_TICK, MIN_TICK, nearestUsableTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import PriceAxis from 'components/UniswapPriceSlider/PriceAxis'
import { useDebouncedTicks, useSmoothZoom } from 'components/UniswapPriceSlider/hooks'
import { formatDisplayNumber } from 'utils/numbers'

import {
  CurrentPriceMarker,
  Handle,
  PriceLabel,
  SkeletonAxisContainer,
  SkeletonAxisLabel,
  SkeletonAxisLine,
  SkeletonAxisTick,
  SkeletonCurrentPrice,
  SkeletonHandle,
  SkeletonPriceLabel,
  SkeletonRange,
  SkeletonSliderArea,
  SkeletonTrack,
  SkeletonWrapper,
  SliderContainer,
  SliderRange,
  SliderTrack,
  SliderWrapper,
} from './styles'
import type { HandleType, UniswapPriceSliderProps, ViewRange } from './types'
import { brushHandlePath, getEdgeIntensity } from './utils'

// ============================================
// Skeleton Component
// ============================================

const SKELETON_AXIS_POSITIONS = [0, 16.6, 33.3, 50, 66.6, 83.3, 100]

function PriceSliderSkeleton() {
  return (
    <SkeletonWrapper>
      <SkeletonSliderArea>
        <SkeletonTrack />
        <SkeletonRange />
        <SkeletonCurrentPrice />
        <SkeletonPriceLabel $isLower />
        <SkeletonPriceLabel $isLower={false} />
        <SkeletonHandle $isLower />
        <SkeletonHandle $isLower={false} />
      </SkeletonSliderArea>
      <SkeletonAxisContainer>
        <SkeletonAxisLine />
        {SKELETON_AXIS_POSITIONS.map(pos => (
          <React.Fragment key={pos}>
            <SkeletonAxisTick $position={pos} />
            <SkeletonAxisLabel $position={pos} />
          </React.Fragment>
        ))}
      </SkeletonAxisContainer>
    </SkeletonWrapper>
  )
}

// ============================================
// Constants
// ============================================

const EDGE_THRESHOLD = 18 // % from edge for zoom out (ensures price labels ~6 chars visible)
const AUTO_CENTER_PADDING = 25 // % padding on each side when auto-centering after drag

// ============================================
// Main Component
// ============================================

function UniswapPriceSlider({
  pool,
  invertPrice,
  lowerTick,
  upperTick,
  setLowerTick,
  setUpperTick,
}: UniswapPriceSliderProps) {
  const { tickSpacing, token0Decimals, token1Decimals, currentTick } = pool

  // ============================================
  // State
  // ============================================

  const [viewRange, setViewRange] = useState<ViewRange | null>(null)
  const [isDragging, setIsDragging] = useState<HandleType>(null)

  // ============================================
  // Refs
  // ============================================

  const sliderRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)
  const viewRangeRef = useRef<ViewRange | null>(viewRange)

  // Keep viewRangeRef in sync with viewRange state
  useEffect(() => {
    viewRangeRef.current = viewRange
  }, [viewRange])

  // ============================================
  // Custom Hooks
  // ============================================

  const { startSmoothZoom } = useSmoothZoom(viewRange, setViewRange)

  const {
    internalLowerTick,
    internalUpperTick,
    debouncedSetLowerTick,
    debouncedSetUpperTick,
    flushDebouncedValues,
    getTargetTicks,
  } = useDebouncedTicks(lowerTick, upperTick, setLowerTick, setUpperTick, isDragging !== null)

  // ============================================
  // Derived Values
  // ============================================

  const ticksReady = lowerTick !== undefined && upperTick !== undefined

  // ============================================
  // Tick/Position Converters
  // ============================================

  const getPositionFromTick = useCallback(
    (tick: number): number => {
      if (!viewRange) return 50
      const { min, max } = viewRange
      return ((tick - min) / (max - min)) * 100
    },
    [viewRange],
  )

  const getTickFromPosition = useCallback(
    (position: number): number => {
      if (!viewRange) return 0
      const { min, max } = viewRange
      const tick = min + (position / 100) * (max - min)
      return nearestUsableTick(Math.round(tick), tickSpacing)
    },
    [viewRange, tickSpacing],
  )

  // ============================================
  // Initialize View Range
  // ============================================

  useEffect(() => {
    if (isInitialized.current || !ticksReady) return

    const tickRange = Math.abs(upperTick - lowerTick)
    const padding = Math.max(tickRange * 0.5, tickSpacing * 50)

    const minTick = Math.min(lowerTick, upperTick, currentTick)
    const maxTick = Math.max(lowerTick, upperTick, currentTick)

    setViewRange({
      min: Math.max(MIN_TICK, minTick - padding),
      max: Math.min(MAX_TICK, maxTick + padding),
    })
    isInitialized.current = true
  }, [lowerTick, upperTick, currentTick, tickSpacing, ticksReady])

  // ============================================
  // Event Handlers
  // ============================================

  const handleMouseDown = useCallback(
    (handle: 'lower' | 'upper') => (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(handle)
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current || !viewRange || lowerTick === undefined || upperTick === undefined) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const newTick = getTickFromPosition(position)

      const currentRange = viewRange.max - viewRange.min

      // Check if near edges for zoom out
      const isNearLeftEdge = position < EDGE_THRESHOLD
      const isNearRightEdge = position > 100 - EDGE_THRESHOLD
      const edgeIntensity = getEdgeIntensity(position, EDGE_THRESHOLD)

      // Zoom out when near edges (zoom-in is handled by auto-center on mouse up)
      if (isNearLeftEdge || isNearRightEdge) {
        const baseExpansion = currentRange * 0.25
        const expansion = baseExpansion * edgeIntensity

        let targetMin = viewRange.min
        let targetMax = viewRange.max

        if (isNearLeftEdge && viewRange.min > MIN_TICK) {
          targetMin = Math.max(MIN_TICK, viewRange.min - expansion)
        }
        if (isNearRightEdge && viewRange.max < MAX_TICK) {
          targetMax = Math.min(MAX_TICK, viewRange.max + expansion)
        }

        startSmoothZoom(targetMin, targetMax)
      }

      // Update tick values
      if (isDragging === 'lower') {
        const maxLower = (internalUpperTick ?? upperTick ?? 0) - tickSpacing * 10
        debouncedSetLowerTick(Math.min(newTick, maxLower))
      } else {
        const minUpper = (internalLowerTick ?? lowerTick ?? 0) + tickSpacing * 10
        debouncedSetUpperTick(Math.max(newTick, minUpper))
      }
    },
    [
      debouncedSetLowerTick,
      debouncedSetUpperTick,
      getTickFromPosition,
      internalLowerTick,
      internalUpperTick,
      isDragging,
      lowerTick,
      startSmoothZoom,
      tickSpacing,
      upperTick,
      viewRange,
    ],
  )

  const handleMouseUp = useCallback(() => {
    // Get the TARGET tick values (what user intended), not the animated values
    const { lowerTick: targetLower, upperTick: targetUpper } = getTargetTicks()

    // Flush to apply target values immediately
    flushDebouncedValues()
    setIsDragging(null)

    // Use target ticks for auto-center calculation
    const finalLowerTick = targetLower ?? lowerTick
    const finalUpperTick = targetUpper ?? upperTick

    if (finalLowerTick === undefined || finalUpperTick === undefined) return

    // Use setTimeout to ensure state has updated before calculating positions
    setTimeout(() => {
      // Use ref to get the LATEST viewRange (not stale closure value)
      const currentViewRange = viewRangeRef.current
      if (!currentViewRange) return

      const tickDistance = Math.abs(finalUpperTick - finalLowerTick)
      const handleCenter = (finalLowerTick + finalUpperTick) / 2

      // Calculate ideal padding (25% on each side = handles take up 50% of view)
      const idealPadding = tickDistance * (AUTO_CENTER_PADDING / (100 - 2 * AUTO_CENTER_PADDING))
      const minPadding = Math.max(tickDistance * 0.3, tickSpacing * 20)
      const padding = Math.max(idealPadding, minPadding)

      const targetMin = Math.max(MIN_TICK, handleCenter - tickDistance / 2 - padding)
      const targetMax = Math.min(MAX_TICK, handleCenter + tickDistance / 2 + padding)

      // Calculate current positions using LATEST viewRange from ref
      const currentRange = currentViewRange.max - currentViewRange.min
      const currentLowerPos = ((finalLowerTick - currentViewRange.min) / currentRange) * 100
      const currentUpperPos = ((finalUpperTick - currentViewRange.min) / currentRange) * 100
      const leftPadding = currentLowerPos
      const rightPadding = 100 - currentUpperPos
      const handleSpan = currentUpperPos - currentLowerPos // % of view that handles span

      // Ideal handle span is 50% (100 - 2 * AUTO_CENTER_PADDING)
      const idealHandleSpan = 100 - 2 * AUTO_CENTER_PADDING
      const handlesTooClose = handleSpan < idealHandleSpan * 0.6 // Less than 60% of ideal = too zoomed out
      const handlesTooFar = handleSpan > idealHandleSpan * 1.5 // More than 150% of ideal = too zoomed in

      // Check if rebalancing is needed
      const needsRebalance =
        leftPadding < EDGE_THRESHOLD + 5 || // Near left edge
        rightPadding < EDGE_THRESHOLD + 5 || // Near right edge
        leftPadding < 0 || // Handle outside left
        rightPadding < 0 || // Handle outside right
        handlesTooClose || // Handles too close together (need zoom in)
        handlesTooFar || // Handles too far apart (need zoom out)
        (leftPadding > 5 && rightPadding > 5 && (leftPadding / rightPadding > 2.5 || rightPadding / leftPadding > 2.5)) // Imbalanced

      if (needsRebalance) {
        startSmoothZoom(targetMin, targetMax)
      }
    }, 50)
  }, [flushDebouncedValues, getTargetTicks, lowerTick, startSmoothZoom, tickSpacing, upperTick])

  // ============================================
  // Mouse Event Listeners
  // ============================================

  useEffect(() => {
    if (!isDragging) return

    // Set grabbing cursor on body to persist while dragging outside handle
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      // Reset cursor when dragging ends
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // ============================================
  // Render
  // ============================================

  if (!ticksReady || !viewRange) {
    return <PriceSliderSkeleton />
  }

  // Use internal ticks for smooth visual updates during dragging
  const displayLowerTick = internalLowerTick ?? lowerTick
  const displayUpperTick = internalUpperTick ?? upperTick

  const lowerPrice = tickToPrice(Math.round(displayLowerTick), token0Decimals, token1Decimals, invertPrice)
  const upperPrice = tickToPrice(Math.round(displayUpperTick), token0Decimals, token1Decimals, invertPrice)

  const lowerPosition = getPositionFromTick(displayLowerTick)
  const upperPosition = getPositionFromTick(displayUpperTick)
  const currentPosition = getPositionFromTick(currentTick)

  return (
    <SliderContainer>
      <SliderWrapper ref={sliderRef}>
        <SliderTrack />
        <SliderRange $left={lowerPosition} $width={upperPosition - lowerPosition} />

        <CurrentPriceMarker $position={currentPosition} />

        <PriceLabel $position={lowerPosition} $isLower>
          {formatDisplayNumber(lowerPrice, { significantDigits: 6 })}
        </PriceLabel>

        <PriceLabel $position={upperPosition} $isLower={false}>
          {formatDisplayNumber(upperPrice, { significantDigits: 6 })}
        </PriceLabel>

        <Handle $position={lowerPosition} $isLower onMouseDown={handleMouseDown('lower')}>
          <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible' }}>
            <path d={brushHandlePath(35)} fill="transparent" stroke="#31CB9E" strokeWidth={1.5} />
          </svg>
        </Handle>

        <Handle $position={upperPosition} $isLower={false} onMouseDown={handleMouseDown('upper')}>
          <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible' }}>
            <path d={brushHandlePath(35)} fill="transparent" stroke="#7289DA" strokeWidth={1.5} />
          </svg>
        </Handle>
      </SliderWrapper>

      <PriceAxis
        viewRange={viewRange}
        token0Decimals={token0Decimals}
        token1Decimals={token1Decimals}
        invertPrice={invertPrice}
      />
    </SliderContainer>
  )
}

export default UniswapPriceSlider
