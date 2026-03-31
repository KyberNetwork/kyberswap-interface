import React, { useMemo } from 'react';

import { tickToPrice } from '@kyber/utils/dist/uniswapv3';

import { MAX_AXIS_TICK_COUNT, MIN_AXIS_TICK_COUNT } from '@/constants';
import type { PriceAxisProps } from '@/types';
import { formatAxisPrice, formatDisplayNumber } from '@/utils';

// Approximate character width in percentage of container width (for 10px font)
// Assuming container is ~300px wide, each char is ~5.5px = ~1.8% of width
const CHAR_WIDTH_PERCENT = 1.8;
// Additional padding between labels
const LABEL_PADDING_PERCENT = 2;

/**
 * Calculate the optimal number of ticks and minimum gap based on price range
 * More ticks for small ranges, fewer for large ranges
 */
const getOptimalTickConfig = (minPrice: number, maxPrice: number): { tickCount: number; minGapPercent: number } => {
  if (minPrice <= 0 || maxPrice <= 0) {
    return { tickCount: 7, minGapPercent: 15 };
  }

  // Calculate how many orders of magnitude the prices span
  const priceRatio = maxPrice / minPrice;
  const ordersOfMagnitude = Math.log10(priceRatio);

  // Very small range (< 0.5 orders): many ticks, small gap
  if (ordersOfMagnitude <= 0.5) {
    return { tickCount: MAX_AXIS_TICK_COUNT, minGapPercent: 12 };
  }
  // Small range (0.5 - 1 order): good amount of ticks
  if (ordersOfMagnitude <= 1) {
    return { tickCount: 9, minGapPercent: 14 };
  }
  // Medium range (1 - 2 orders)
  if (ordersOfMagnitude <= 2) {
    return { tickCount: 7, minGapPercent: 16 };
  }
  // Large range (2 - 4 orders)
  if (ordersOfMagnitude <= 4) {
    return { tickCount: 5, minGapPercent: 20 };
  }
  // Very large range (4 - 8 orders)
  if (ordersOfMagnitude <= 8) {
    return { tickCount: 3, minGapPercent: 30 };
  }
  // Extreme range (> 8 orders): just first and last
  return { tickCount: MIN_AXIS_TICK_COUNT, minGapPercent: 40 };
};

/**
 * Calculate tick positions for the axis
 * Uses tick-space for even distribution (matching the slider)
 * When invertPrice, positions are flipped so lower inverted price is on left
 */
const calculateAxisTicks = (
  viewRange: { min: number; max: number },
  token0Decimals: number,
  token1Decimals: number,
  count: number,
  invertPrice?: boolean,
): Array<{ tick: number; price: number; position: number }> => {
  const tickRange = viewRange.max - viewRange.min;
  if (tickRange <= 0) return [];

  const step = tickRange / (count - 1);
  const ticks: Array<{ tick: number; price: number; position: number }> = [];

  for (let i = 0; i < count; i++) {
    const tick = Math.round(viewRange.min + step * i);
    const price = +tickToPrice(tick, token0Decimals, token1Decimals, invertPrice);
    const normalPosition = ((tick - viewRange.min) / tickRange) * 100;
    // When invertPrice, flip position so lower inverted price (from higher tick) is on left
    const position = invertPrice ? 100 - normalPosition : normalPosition;

    ticks.push({ tick, price, position });
  }

  return ticks;
};

/**
 * Estimate label width in percentage based on formatted text length
 */
const estimateLabelWidth = (price: number, usedLabels: Set<string>): { label: string; widthPercent: number } => {
  let label = formatAxisPrice(price);
  if (usedLabels.has(label)) {
    label = formatDisplayNumber(price, { significantDigits: 6 });
  }
  // Estimate width: character count * char width + some padding
  const widthPercent = label.length * CHAR_WIDTH_PERCENT;
  return { label, widthPercent };
};

/**
 * Filter ticks to ensure minimum spacing between labels
 * Takes into account actual label width to prevent overlap
 */
const filterOverlappingTicks = (
  ticks: Array<{ tick: number; price: number; position: number }>,
  minGapPercent: number,
): Array<{ tick: number; price: number; position: number; showLabel: boolean; label: string }> => {
  if (ticks.length === 0) return [];

  const usedLabels = new Set<string>();
  const result: Array<{ tick: number; price: number; position: number; showLabel: boolean; label: string }> = [];

  // First pass: calculate all labels and their widths
  const ticksWithLabels = ticks.map(tick => {
    const { label, widthPercent } = estimateLabelWidth(tick.price, usedLabels);
    usedLabels.add(label);
    return { ...tick, label, widthPercent };
  });

  // Track the right edge of the last shown label
  let lastLabelRightEdge = -Infinity;

  for (let i = 0; i < ticksWithLabels.length; i++) {
    const tick = ticksWithLabels[i];
    const isFirst = i === 0;
    const isLast = i === ticksWithLabels.length - 1;

    // For first label (left-aligned): right edge is position + full width
    // For middle labels (center-aligned): left edge is position - half width
    // For last label (right-aligned): left edge is position - full width (but we use 100 - width as reference)

    let labelLeftEdge: number;
    let labelRightEdge: number;

    if (isFirst) {
      // Left-aligned: starts at 0
      labelLeftEdge = 0;
      labelRightEdge = tick.widthPercent;
    } else if (isLast) {
      // Right-aligned: ends at 100
      labelLeftEdge = 100 - tick.widthPercent;
      labelRightEdge = 100;
    } else {
      // Center-aligned
      labelLeftEdge = tick.position - tick.widthPercent / 2;
      labelRightEdge = tick.position + tick.widthPercent / 2;
    }

    // Calculate required gap considering label width
    const requiredGap = Math.max(minGapPercent, LABEL_PADDING_PERCENT);
    const hasEnoughSpace = labelLeftEdge >= lastLabelRightEdge + requiredGap;

    // First tick always shows label
    if (isFirst) {
      lastLabelRightEdge = labelRightEdge;
      result.push({ ...tick, showLabel: true });
      continue;
    }

    // Last tick: only show if enough space
    if (isLast) {
      const showLabel = hasEnoughSpace;
      if (showLabel) lastLabelRightEdge = labelRightEdge;
      result.push({ ...tick, showLabel });
      continue;
    }

    // Middle ticks: show if enough space from previous label
    if (hasEnoughSpace) {
      lastLabelRightEdge = labelRightEdge;
      result.push({ ...tick, showLabel: true });
    } else {
      result.push({ ...tick, showLabel: false });
    }
  }

  return result;
};

/**
 * Price axis component that displays price scale below the slider
 * Uses tick-based positioning to match the slider exactly
 * Dynamically reduces tick count when price range is very large
 */
function PriceAxis({ viewRange, token0Decimals, token1Decimals, invertPrice }: PriceAxisProps) {
  const axisTicks = useMemo(() => {
    // Get min and max prices to determine optimal tick config
    const minPrice = +tickToPrice(Math.round(viewRange.min), token0Decimals, token1Decimals, invertPrice);
    const maxPrice = +tickToPrice(Math.round(viewRange.max), token0Decimals, token1Decimals, invertPrice);
    const { tickCount, minGapPercent } = getOptimalTickConfig(
      Math.min(minPrice, maxPrice),
      Math.max(minPrice, maxPrice),
    );

    const ticks = calculateAxisTicks(viewRange, token0Decimals, token1Decimals, tickCount, invertPrice);
    // Sort by position ascending for proper overlap filtering
    const sortedTicks = [...ticks].sort((a, b) => a.position - b.position);
    return filterOverlappingTicks(sortedTicks, minGapPercent);
  }, [viewRange, token0Decimals, token1Decimals, invertPrice]);

  return (
    <div className="relative w-full h-6 -mt-2">
      {/* Axis Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-[#3a3a3a]" />

      {/* Ticks and Labels */}
      {axisTicks.map(({ tick, position, showLabel, label }, index) => {
        // Only render if within visible range
        if (position < -2 || position > 102) return null;

        // Determine alignment: first label align left, last label align right, others center
        const isFirst = index === 0;
        const isLast = index === axisTicks.length - 1;
        const alignClass = isFirst ? 'left-0' : isLast ? 'right-0' : '-translate-x-1/2';

        return (
          <React.Fragment key={tick}>
            {/* Tick Mark */}
            <div
              className="absolute top-0 w-px h-1.5 bg-[#555] -translate-x-1/2 will-change-[left]"
              style={{ left: `${position}%` }}
            />
            {/* Label */}
            {showLabel && (
              <div
                className={`absolute top-2 text-[10px] text-[#888] whitespace-nowrap select-none will-change-[left] ${alignClass}`}
                style={isFirst ? { left: 0 } : isLast ? { right: 0 } : { left: `${position}%` }}
              >
                {label}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default React.memo(PriceAxis);
