import React, { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_TICK, MIN_TICK, tickToPrice } from '@kyber/utils/dist/uniswapv3';

import PriceAxis from '@/components/PriceAxis';
import PriceSliderSkeleton from '@/components/Skeleton';
import { AUTO_CENTER_PADDING, EDGE_THRESHOLD } from '@/constants';
import { useDebouncedTick, useSmoothZoom, useTickPositionConverter } from '@/hooks';
import type { HandleType, PriceSliderProps, ViewRange } from '@/types';
import { brushHandlePath, formatDisplayNumber, getEdgeIntensity } from '@/utils';

function PriceSlider({ pool, invertPrice, tick, setTick, comparator, mode }: PriceSliderProps) {
  const { tickSpacing, token0Decimals, token1Decimals, currentTick } = pool;

  const [viewRange, setViewRange] = useState<ViewRange | null>(null);
  const [isDragging, setIsDragging] = useState<HandleType>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const viewRangeRef = useRef<ViewRange | null>(viewRange);
  const lastAdjustedTickRef = useRef<number | null>(null);
  const lastSideRef = useRef<'below' | 'above' | null>(null);

  // Track side of current price to detect crossings
  useEffect(() => {
    if (tick !== undefined) {
      lastSideRef.current = tick >= currentTick ? 'above' : 'below';
    }
  }, [tick, currentTick]);

  // Keep viewRangeRef in sync with viewRange state
  useEffect(() => {
    viewRangeRef.current = viewRange;
  }, [viewRange]);

  const { startSmoothZoom } = useSmoothZoom(viewRange, setViewRange);

  const { internalTick, debouncedSetTick, flushDebouncedValues, getTargetTick } = useDebouncedTick(
    tick,
    setTick ?? (() => {}),
    isDragging !== null,
  );

  const { getPositionFromTick, getTickFromPosition } = useTickPositionConverter(viewRange, tickSpacing, invertPrice);

  const tickReady = tick !== undefined;

  // Initialize View Range
  useEffect(() => {
    if (isInitialized.current) return;

    const baseTick = tick ?? currentTick;
    const tickDistance = tick !== undefined ? Math.abs(tick - currentTick) : tickSpacing * 50;
    const padding = Math.max(tickDistance * 0.5, tickSpacing * 50);

    const minTick = Math.min(baseTick, currentTick);
    const maxTick = Math.max(baseTick, currentTick);

    setViewRange({
      min: Math.max(MIN_TICK, minTick - padding),
      max: Math.min(MAX_TICK, maxTick + padding),
    });
    isInitialized.current = true;
  }, [tick, currentTick, tickSpacing, tickReady]);

  // Auto-adjust viewRange when tick change from outside (e.g., input fields)
  useEffect(() => {
    // Skip if not initialized, dragging, or tick not ready
    if (!isInitialized.current || isDragging || tick === undefined || !viewRange) return;

    // Skip if already adjusted for this exact tick value
    const lastAdjusted = lastAdjustedTickRef.current;
    if (lastAdjusted === tick) return;

    const currentRange = viewRange.max - viewRange.min;
    const pricePos = ((tick - viewRange.min) / currentRange) * 100;
    const currentPos = ((currentTick - viewRange.min) / currentRange) * 100;

    // Check if price handle is outside visible area
    const priceOutsideLeft = pricePos < -5;
    const priceOutsideRight = pricePos > 105;

    // Check span between price handle and current price
    const minPos = Math.min(pricePos, currentPos);
    const maxPos = Math.max(pricePos, currentPos);
    const span = maxPos - minPos;

    const idealSpan = 100 - 2 * AUTO_CENTER_PADDING;
    const spanTooSmall = span < idealSpan * 0.6; // Much smaller than ideal
    const spanTooLarge = span > idealSpan * 1.5; // Much larger than ideal

    // If adjustment needed, calculate new viewRange
    if (priceOutsideLeft || priceOutsideRight || spanTooSmall || spanTooLarge) {
      const tickDistance = Math.abs(tick - currentTick);
      const center = (tick + currentTick) / 2;

      const idealPadding = tickDistance * (AUTO_CENTER_PADDING / (100 - 2 * AUTO_CENTER_PADDING));
      const minPadding = Math.max(tickDistance * 0.3, tickSpacing * 20);
      const padding = Math.max(idealPadding, minPadding);

      const targetMin = Math.max(MIN_TICK, center - tickDistance / 2 - padding);
      const targetMax = Math.min(MAX_TICK, center + tickDistance / 2 + padding);

      // Mark this tick as adjusted to prevent re-triggering
      lastAdjustedTickRef.current = tick;
      startSmoothZoom(targetMin, targetMax);
    }
  }, [tick, isDragging, tickReady, viewRange, tickSpacing, currentTick, startSmoothZoom]);

  const handleMouseDown = useCallback(
    () => (e: React.MouseEvent) => {
      if (!setTick) return;
      e.preventDefault();
      setIsDragging('price');
    },
    [setTick],
  );

  const handleTouchStart = useCallback(
    () => (e: React.TouchEvent) => {
      if (!setTick) return;
      e.preventDefault();
      setIsDragging('price');
    },
    [setTick],
  );

  // Shared logic for handling drag movement (mouse or touch)
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !sliderRef.current || !viewRange || tick === undefined || !setTick) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newTick = getTickFromPosition(position);

      // Immediate update when crossing current price to allow comparator changes upstream
      const side: 'below' | 'above' = newTick >= currentTick ? 'above' : 'below';
      if (lastSideRef.current && lastSideRef.current !== side) {
        setTick(newTick);
      }
      lastSideRef.current = side;

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

      // Update tick value
      debouncedSetTick(newTick);
    },
    [debouncedSetTick, getTickFromPosition, isDragging, tick, startSmoothZoom, viewRange, currentTick, setTick],
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
    // Get the TARGET tick value (what user intended), not the animated value
    const targetTick = getTargetTick();

    // Flush to apply target value immediately
    flushDebouncedValues();
    setIsDragging(null);

    // Use target tick for auto-center calculation
    const finalTick = targetTick ?? tick;

    if (finalTick === undefined) return;

    // Use setTimeout to ensure state has updated before calculating positions
    setTimeout(() => {
      // Use ref to get the LATEST viewRange (not stale closure value)
      const currentViewRange = viewRangeRef.current;
      if (!currentViewRange) return;

      const tickDistance = Math.abs(finalTick - currentTick);
      const center = (finalTick + currentTick) / 2;

      // Calculate ideal padding (25% on each side = handles take up 50% of view)
      const idealPadding = tickDistance * (AUTO_CENTER_PADDING / (100 - 2 * AUTO_CENTER_PADDING));
      const minPadding = Math.max(tickDistance * 0.3, tickSpacing * 20);
      const padding = Math.max(idealPadding, minPadding);

      const targetMin = Math.max(MIN_TICK, center - tickDistance / 2 - padding);
      const targetMax = Math.min(MAX_TICK, center + tickDistance / 2 + padding);

      // Calculate current positions using LATEST viewRange from ref
      const currentRange = currentViewRange.max - currentViewRange.min;
      const rawTickPos = ((finalTick - currentViewRange.min) / currentRange) * 100;
      const rawCurrentPos = ((currentTick - currentViewRange.min) / currentRange) * 100;

      // Account for invertPrice: when inverted, positions are flipped
      const currentTickPos = invertPrice ? 100 - rawTickPos : rawTickPos;
      const currentPricePos = invertPrice ? 100 - rawCurrentPos : rawCurrentPos;

      // Left/right padding based on visual positions (not tick order)
      const leftPadding = Math.min(currentTickPos, currentPricePos);
      const rightPadding = 100 - Math.max(currentTickPos, currentPricePos);
      const span = Math.abs(currentPricePos - currentTickPos); // % of view that span

      // Ideal span is 50% (100 - 2 * AUTO_CENTER_PADDING)
      const idealSpan = 100 - 2 * AUTO_CENTER_PADDING;
      const spanTooSmall = span < idealSpan * 0.6; // Less than 60% of ideal = too zoomed out
      const spanTooLarge = span > idealSpan * 1.5; // More than 150% of ideal = too zoomed in

      // Check if rebalancing is needed
      const needsRebalance =
        leftPadding < EDGE_THRESHOLD + 5 || // Near left edge
        rightPadding < EDGE_THRESHOLD + 5 || // Near right edge
        leftPadding < 0 || // Handle outside left
        rightPadding < 0 || // Handle outside right
        spanTooSmall || // Span too small (need zoom in)
        spanTooLarge || // Span too large (need zoom out)
        (leftPadding > 5 && rightPadding > 5 && (leftPadding / rightPadding > 2.5 || rightPadding / leftPadding > 2.5)); // Imbalanced

      if (needsRebalance) {
        startSmoothZoom(targetMin, targetMax);
      }
    }, 50);
  }, [flushDebouncedValues, getTargetTick, invertPrice, tick, currentTick, tickSpacing, startSmoothZoom]);

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

  if (!viewRange) {
    return <PriceSliderSkeleton />;
  }

  // Use internal tick for smooth visual updates during dragging
  const displayTick = internalTick ?? tick;

  // Calculate price
  const price =
    displayTick !== undefined
      ? tickToPrice(Math.round(displayTick), token0Decimals, token1Decimals, invertPrice)
      : null;
  const currentPrice = tickToPrice(currentTick, token0Decimals, token1Decimals, invertPrice);

  // Calculate positions
  const pricePosition = displayTick !== undefined ? getPositionFromTick(displayTick) : null;
  const currentPosition = getPositionFromTick(currentTick);
  const isPriceLeftOfCurrent =
    pricePosition !== null && pricePosition !== undefined ? pricePosition <= currentPosition : true;
  const handleColor = isPriceLeftOfCurrent ? '#31CB9E' : '#7289DA';
  // Range highlight should follow the handle color to keep visual consistency
  const rangeColor = handleColor;

  // Highlight range to infinity (optional)
  const shouldRenderInfiniteRange =
    mode === 'range-to-infinite' && comparator && pricePosition !== null && pricePosition !== undefined;
  let highlightStart = 0;
  let highlightWidth = 0;
  if (shouldRenderInfiniteRange) {
    const direction =
      comparator === 'gte'
        ? invertPrice
          ? 'left' // higher price is left when inverted
          : 'right'
        : invertPrice
          ? 'right'
          : 'left';
    const clampedPosition = Math.max(0, Math.min(100, pricePosition ?? 0));
    if (direction === 'left') {
      highlightStart = 0;
      highlightWidth = clampedPosition;
    } else {
      highlightStart = clampedPosition;
      highlightWidth = 100 - clampedPosition;
    }
  }

  return (
    <div className="ks-ps-style" style={{ width: '100%' }}>
      {/* Slider Wrapper */}
      <div ref={sliderRef} className="relative w-full h-[60px] mt-1 overflow-hidden">
        {/* Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#3a3a3a] -translate-y-1/2 rounded-sm" />

        {/* Current Price Marker */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] will-change-[left] group"
          style={{ left: `${currentPosition}%` }}
        >
          <div className="w-0.5 h-[15px] bg-[#888] rounded-sm cursor-pointer relative">
            {/* Arrow indicator */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#888]" />
          </div>
          {/* Tooltip (always visible when tick is not provided) */}
          <div
            className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-white transition-all duration-150 pointer-events-none z-[100] ${
              tick === undefined
                ? 'opacity-100 visible'
                : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}
          >
            {formatDisplayNumber(currentPrice, { significantDigits: 6 })}
          </div>
        </div>

        {/* Price Label */}
        {pricePosition !== null && pricePosition !== undefined && price !== null && (
          <div
            className="absolute top-1 text-white text-xs font-medium whitespace-nowrap pointer-events-none will-change-[left,transform]"
            style={{
              left: `${pricePosition}%`,
              transform: isPriceLeftOfCurrent ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            {formatDisplayNumber(price, { significantDigits: 6 })}
          </div>
        )}

        {/* Infinite range highlight */}
        {pricePosition !== null && pricePosition !== undefined && shouldRenderInfiniteRange && highlightWidth > 0 && (
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-sm will-change-[left,width]"
            style={{
              left: `${highlightStart}%`,
              width: `${highlightWidth}%`,
              background: rangeColor,
              opacity: 0.7,
            }}
          />
        )}

        {/* Price Handle */}
        {pricePosition !== null && pricePosition !== undefined && (
          <div
            className={`absolute top-0 translate-x-[-50%] translate-y-[1%] ${
              setTick ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
            } z-10 touch-none will-change-[left]`}
            style={{ left: `${pricePosition}%` }}
            onMouseDown={handleMouseDown()}
            onTouchStart={handleTouchStart()}
          >
            <svg width="22" height="35" viewBox="-11 0 22 35" style={{ overflow: 'visible', display: 'block' }}>
              <path d={brushHandlePath(35)} fill="transparent" stroke={handleColor} strokeWidth={1.5} />
            </svg>
          </div>
        )}
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

export default PriceSlider;
