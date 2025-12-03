import React, { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_TICK, MIN_TICK, tickToPrice } from '@kyber/utils/dist/uniswapv3';

import PriceAxis from '@/components/PriceAxis';
import PriceSliderSkeleton from '@/components/Skeleton';
import { AUTO_CENTER_PADDING, EDGE_THRESHOLD, MIN_HANDLE_DISTANCE_MULTIPLIER } from '@/constants';
import { useDebouncedTicks, useSmoothZoom, useTickPositionConverter } from '@/hooks';
import type { HandleType, UniswapPriceSliderProps, ViewRange } from '@/types';
import { brushHandlePath, formatDisplayNumber, getEdgeIntensity } from '@/utils';

function UniswapPriceSlider({
  pool,
  invertPrice,
  lowerTick,
  upperTick,
  setLowerTick,
  setUpperTick,
}: UniswapPriceSliderProps) {
  const { tickSpacing, token0Decimals, token1Decimals, currentTick } = pool;

  const [viewRange, setViewRange] = useState<ViewRange | null>(null);
  const [isDragging, setIsDragging] = useState<HandleType>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const viewRangeRef = useRef<ViewRange | null>(viewRange);
  const lastAdjustedTicksRef = useRef<{ lower: number; upper: number } | null>(null);

  // Keep viewRangeRef in sync with viewRange state
  useEffect(() => {
    viewRangeRef.current = viewRange;
  }, [viewRange]);

  const { startSmoothZoom } = useSmoothZoom(viewRange, setViewRange);

  const {
    internalLowerTick,
    internalUpperTick,
    debouncedSetLowerTick,
    debouncedSetUpperTick,
    flushDebouncedValues,
    getTargetTicks,
  } = useDebouncedTicks(lowerTick, upperTick, setLowerTick, setUpperTick, isDragging !== null);

  const { getPositionFromTick, getTickFromPosition } = useTickPositionConverter(viewRange, tickSpacing, invertPrice);

  const ticksReady = lowerTick !== undefined && upperTick !== undefined && upperTick > lowerTick;

  // Initialize View Range
  useEffect(() => {
    if (isInitialized.current || !ticksReady) return;

    const tickRange = Math.abs(upperTick - lowerTick);
    const padding = Math.max(tickRange * 0.5, tickSpacing * 50);

    const minTick = Math.min(lowerTick, upperTick, currentTick);
    const maxTick = Math.max(lowerTick, upperTick, currentTick);

    setViewRange({
      min: Math.max(MIN_TICK, minTick - padding),
      max: Math.min(MAX_TICK, maxTick + padding),
    });
    isInitialized.current = true;
  }, [lowerTick, upperTick, currentTick, tickSpacing, ticksReady]);

  // Auto-adjust viewRange when ticks change from outside (e.g., input fields)
  useEffect(() => {
    // Skip if not initialized, dragging, or ticks not ready
    if (!isInitialized.current || isDragging || !ticksReady || !viewRange) return;

    // Skip if already adjusted for these exact tick values
    const lastAdjusted = lastAdjustedTicksRef.current;
    if (lastAdjusted && lastAdjusted.lower === lowerTick && lastAdjusted.upper === upperTick) return;

    const currentRange = viewRange.max - viewRange.min;
    const lowerPos = ((lowerTick - viewRange.min) / currentRange) * 100;
    const upperPos = ((upperTick - viewRange.min) / currentRange) * 100;

    // Check if handles are outside visible area or positioned poorly
    const handleOutsideLeft = lowerPos < -5 || upperPos < -5;
    const handleOutsideRight = lowerPos > 105 || upperPos > 105;
    const handleSpan = Math.abs(upperPos - lowerPos);
    const idealHandleSpan = 100 - 2 * AUTO_CENTER_PADDING;
    const handlesTooClose = handleSpan < idealHandleSpan * 0.6; // Much smaller than ideal
    const handlesTooFar = handleSpan > idealHandleSpan * 1.5; // Much larger than ideal

    // If adjustment needed, calculate new viewRange
    if (handleOutsideLeft || handleOutsideRight || handlesTooClose || handlesTooFar) {
      const tickDistance = Math.abs(upperTick - lowerTick);
      const handleCenter = (lowerTick + upperTick) / 2;

      const idealPadding = tickDistance * (AUTO_CENTER_PADDING / (100 - 2 * AUTO_CENTER_PADDING));
      const minPadding = Math.max(tickDistance * 0.3, tickSpacing * 20);
      const padding = Math.max(idealPadding, minPadding);

      const targetMin = Math.max(MIN_TICK, handleCenter - tickDistance / 2 - padding);
      const targetMax = Math.min(MAX_TICK, handleCenter + tickDistance / 2 + padding);

      // Mark these ticks as adjusted to prevent re-triggering
      lastAdjustedTicksRef.current = { lower: lowerTick, upper: upperTick };
      startSmoothZoom(targetMin, targetMax);
    }
  }, [lowerTick, upperTick, isDragging, ticksReady, viewRange, tickSpacing, startSmoothZoom]);

  const handleMouseDown = useCallback(
    (handle: 'lower' | 'upper') => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    },
    [],
  );

  const handleTouchStart = useCallback(
    (handle: 'lower' | 'upper') => (e: React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    },
    [],
  );

  // Shared logic for handling drag movement (mouse or touch)
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !sliderRef.current || !viewRange || lowerTick === undefined || upperTick === undefined) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newTick = getTickFromPosition(position);

      const currentRange = viewRange.max - viewRange.min;

      // Check if near edges for zoom out
      const isNearLeftEdge = position < EDGE_THRESHOLD;
      const isNearRightEdge = position > 100 - EDGE_THRESHOLD;
      const edgeIntensity = getEdgeIntensity(position, EDGE_THRESHOLD);

      // Zoom out when near edges (zoom-in is handled by auto-center on mouse up)
      if (isNearLeftEdge || isNearRightEdge) {
        const baseExpansion = currentRange * 0.25;
        const expansion = baseExpansion * edgeIntensity;

        let targetMin = viewRange.min;
        let targetMax = viewRange.max;

        if (isNearLeftEdge && viewRange.min > MIN_TICK) {
          targetMin = Math.max(MIN_TICK, viewRange.min - expansion);
        }
        if (isNearRightEdge && viewRange.max < MAX_TICK) {
          targetMax = Math.min(MAX_TICK, viewRange.max + expansion);
        }

        startSmoothZoom(targetMin, targetMax);
      }

      // Update tick values (with minimum distance between handles)
      if (isDragging === 'lower') {
        const maxLower = (internalUpperTick ?? upperTick ?? 0) - tickSpacing * MIN_HANDLE_DISTANCE_MULTIPLIER;
        debouncedSetLowerTick(Math.min(newTick, maxLower));
      } else {
        const minUpper = (internalLowerTick ?? lowerTick ?? 0) + tickSpacing * MIN_HANDLE_DISTANCE_MULTIPLIER;
        debouncedSetUpperTick(Math.max(newTick, minUpper));
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
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handleDragMove(e.clientX);
    },
    [handleDragMove],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX);
      }
    },
    [handleDragMove],
  );

  const handleMouseUp = useCallback(() => {
    // Get the TARGET tick values (what user intended), not the animated values
    const { lowerTick: targetLower, upperTick: targetUpper } = getTargetTicks();

    // Flush to apply target values immediately
    flushDebouncedValues();
    setIsDragging(null);

    // Use target ticks for auto-center calculation
    const finalLowerTick = targetLower ?? lowerTick;
    const finalUpperTick = targetUpper ?? upperTick;

    if (finalLowerTick === undefined || finalUpperTick === undefined) return;

    // Use setTimeout to ensure state has updated before calculating positions
    setTimeout(() => {
      // Use ref to get the LATEST viewRange (not stale closure value)
      const currentViewRange = viewRangeRef.current;
      if (!currentViewRange) return;

      const tickDistance = Math.abs(finalUpperTick - finalLowerTick);
      const handleCenter = (finalLowerTick + finalUpperTick) / 2;

      // Calculate ideal padding (25% on each side = handles take up 50% of view)
      const idealPadding = tickDistance * (AUTO_CENTER_PADDING / (100 - 2 * AUTO_CENTER_PADDING));
      const minPadding = Math.max(tickDistance * 0.3, tickSpacing * 20);
      const padding = Math.max(idealPadding, minPadding);

      const targetMin = Math.max(MIN_TICK, handleCenter - tickDistance / 2 - padding);
      const targetMax = Math.min(MAX_TICK, handleCenter + tickDistance / 2 + padding);

      // Calculate current positions using LATEST viewRange from ref
      const currentRange = currentViewRange.max - currentViewRange.min;
      const rawLowerPos = ((finalLowerTick - currentViewRange.min) / currentRange) * 100;
      const rawUpperPos = ((finalUpperTick - currentViewRange.min) / currentRange) * 100;

      // Account for invertPrice: when inverted, positions are flipped
      const currentLowerPos = invertPrice ? 100 - rawLowerPos : rawLowerPos;
      const currentUpperPos = invertPrice ? 100 - rawUpperPos : rawUpperPos;

      // Left/right padding based on visual positions (not tick order)
      const leftPadding = Math.min(currentLowerPos, currentUpperPos);
      const rightPadding = 100 - Math.max(currentLowerPos, currentUpperPos);
      const handleSpan = Math.abs(currentUpperPos - currentLowerPos); // % of view that handles span

      // Ideal handle span is 50% (100 - 2 * AUTO_CENTER_PADDING)
      const idealHandleSpan = 100 - 2 * AUTO_CENTER_PADDING;
      const handlesTooClose = handleSpan < idealHandleSpan * 0.6; // Less than 60% of ideal = too zoomed out
      const handlesTooFar = handleSpan > idealHandleSpan * 1.5; // More than 150% of ideal = too zoomed in

      // Check if rebalancing is needed
      const needsRebalance =
        leftPadding < EDGE_THRESHOLD + 5 || // Near left edge
        rightPadding < EDGE_THRESHOLD + 5 || // Near right edge
        leftPadding < 0 || // Handle outside left
        rightPadding < 0 || // Handle outside right
        handlesTooClose || // Handles too close together (need zoom in)
        handlesTooFar || // Handles too far apart (need zoom out)
        (leftPadding > 5 && rightPadding > 5 && (leftPadding / rightPadding > 2.5 || rightPadding / leftPadding > 2.5)); // Imbalanced

      if (needsRebalance) {
        startSmoothZoom(targetMin, targetMax);
      }
    }, 50);
  }, [flushDebouncedValues, getTargetTicks, invertPrice, lowerTick, startSmoothZoom, tickSpacing, upperTick]);

  useEffect(() => {
    if (!isDragging) return;

    // Set grabbing cursor on body to persist while dragging outside handle
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    // Mouse events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Touch events
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchcancel', handleMouseUp);

    return () => {
      // Reset cursor when dragging ends
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Remove mouse events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Remove touch events
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  if (!ticksReady || !viewRange) {
    return <PriceSliderSkeleton />;
  }

  // Use internal ticks for smooth visual updates during dragging
  const displayLowerTick = internalLowerTick ?? lowerTick;
  const displayUpperTick = internalUpperTick ?? upperTick;

  // Calculate prices (with invertPrice applied)
  const lowerTickPrice = tickToPrice(Math.round(displayLowerTick), token0Decimals, token1Decimals, invertPrice);
  const upperTickPrice = tickToPrice(Math.round(displayUpperTick), token0Decimals, token1Decimals, invertPrice);
  const currentPrice = tickToPrice(currentTick, token0Decimals, token1Decimals, invertPrice);

  // Calculate positions (flipped when invertPrice=true by the hook)
  const lowerPosition = getPositionFromTick(displayLowerTick);
  const upperPosition = getPositionFromTick(displayUpperTick);
  const currentPosition = getPositionFromTick(currentTick);

  // When invertPrice, positions are flipped so:
  // - lowerTick (higher inverted price) is on the RIGHT
  // - upperTick (lower inverted price) is on the LEFT
  // This means left position = min of the two, right position = max of the two
  const leftPosition = Math.min(lowerPosition, upperPosition);
  const rightPosition = Math.max(lowerPosition, upperPosition);

  // Determine which tick is at which visual position
  const isLowerOnLeft = lowerPosition <= upperPosition;
  const leftPrice = isLowerOnLeft ? lowerTickPrice : upperTickPrice;
  const rightPrice = isLowerOnLeft ? upperTickPrice : lowerTickPrice;
  const leftHandleType: 'lower' | 'upper' = isLowerOnLeft ? 'lower' : 'upper';
  const rightHandleType: 'lower' | 'upper' = isLowerOnLeft ? 'upper' : 'lower';

  return (
    <div className="ks-ps-style" style={{ width: '100%' }}>
      {/* Slider Wrapper */}
      <div ref={sliderRef} className="relative w-full h-[60px] mt-1 overflow-hidden">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#3a3a3a] -translate-y-1/2 rounded-sm" />

        {/* Range */}
        <div
          className="absolute top-1/2 h-1 bg-gradient-to-r from-[#31cb9e] to-[#7289da] -translate-y-1/2 rounded-sm will-change-[left,width]"
          style={{
            left: `${leftPosition}%`,
            width: `${rightPosition - leftPosition}%`,
          }}
        />

        {/* Current Price Marker */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] will-change-[left] group"
          style={{ left: `${currentPosition}%` }}
        >
          <div className="w-0.5 h-[15px] bg-[#888] rounded-sm cursor-pointer relative">
            {/* Arrow indicator */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#888]" />
          </div>
          {/* Tooltip */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-[100]">
            {formatDisplayNumber(currentPrice, { significantDigits: 6 })}
          </div>
        </div>

        {/* Left Price Label */}
        <div
          className="absolute top-1 text-white text-xs font-medium whitespace-nowrap pointer-events-none will-change-[left,transform]"
          style={{
            left: `${leftPosition}%`,
            transform: 'translateX(calc(-100% - 12px))',
          }}
        >
          {formatDisplayNumber(leftPrice, { significantDigits: 6 })}
        </div>

        {/* Right Price Label */}
        <div
          className="absolute top-1 text-white text-xs font-medium whitespace-nowrap pointer-events-none will-change-[left,transform]"
          style={{
            left: `${rightPosition}%`,
            transform: 'translateX(12px)',
          }}
        >
          {formatDisplayNumber(rightPrice, { significantDigits: 6 })}
        </div>

        {/* Left Handle (green) */}
        <div
          className="absolute top-0 translate-x-[-50%] translate-y-[1%] cursor-grab active:cursor-grabbing z-10 touch-none will-change-[left]"
          style={{ left: `${leftPosition}%` }}
          onMouseDown={handleMouseDown(leftHandleType)}
          onTouchStart={handleTouchStart(leftHandleType)}
        >
          <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible', display: 'block' }}>
            <path d={brushHandlePath(35)} fill="transparent" stroke="#31CB9E" strokeWidth={1.5} />
          </svg>
        </div>

        {/* Right Handle (blue) */}
        <div
          className="absolute top-0 translate-x-[-50%] translate-y-[1%] cursor-grab active:cursor-grabbing z-10 touch-none will-change-[left]"
          style={{ left: `${rightPosition}%` }}
          onMouseDown={handleMouseDown(rightHandleType)}
          onTouchStart={handleTouchStart(rightHandleType)}
        >
          <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible', display: 'block' }}>
            <path d={brushHandlePath(35)} fill="transparent" stroke="#7289DA" strokeWidth={1.5} />
          </svg>
        </div>
      </div>

      <PriceAxis
        viewRange={viewRange}
        token0Decimals={token0Decimals}
        token1Decimals={token1Decimals}
        invertPrice={invertPrice}
      />
    </div>
  );
}

export default UniswapPriceSlider;
