import { useCallback, useMemo } from 'react';

import { UniV3Pool, univ3Types } from '@kyber/schema';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { Bound, LiquidityChartRangeInput } from '@kyberswap/liquidity-chart';
import '@kyberswap/liquidity-chart/style.css';

import usePriceRange from '@/components/RangeInput/usePriceRange';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function LiquidityChart() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPool, targetPoolPrice, revertPrice } = usePoolStore(['targetPool', 'targetPoolPrice', 'revertPrice']);
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapStore([
    'tickLower',
    'tickUpper',
    'setTickLower',
    'setTickUpper',
  ]);
  const { minPrice, maxPrice } = usePriceRange();

  const isTargetUniV3 = univ3Types.includes(targetPoolType as any);
  const pool = targetPool as UniV3Pool | undefined;

  const fee = pool?.fee;
  const tickCurrent = pool?.tick;
  const tickSpacing = pool?.tickSpacing;
  const ticks = pool?.ticks || [];
  const liquidity = pool?.liquidity || '0';
  const token0 = pool?.token0;
  const token1 = pool?.token1;
  const category = pool?.category;

  const ticksAtLimit = useMemo(
    () => ({
      LOWER: pool?.minTick === tickLower,
      UPPER: pool?.maxTick === tickUpper,
    }),
    [pool, tickLower, tickUpper],
  );

  const onBothRangeInput = useCallback(
    (l: string, r: string) => {
      if (!token0 || !token1 || !tickSpacing) return;
      const tickLowerFromPrice = priceToClosestTick(l, token0.decimals, token1.decimals, revertPrice);
      const tickUpperFromPrice = priceToClosestTick(r, token0.decimals, token1.decimals, revertPrice);
      if (tickLowerFromPrice === undefined || tickUpperFromPrice === undefined) return;
      const tickLower = nearestUsableTick(Number(tickLowerFromPrice), tickSpacing);
      const tickUpper = nearestUsableTick(Number(tickUpperFromPrice), tickSpacing);

      if (tickUpper) {
        revertPrice ? setTickLower(tickUpper) : setTickUpper(tickUpper);
      }
      if (tickLower) {
        revertPrice ? setTickUpper(tickLower) : setTickLower(tickLower);
      }
    },
    [revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
  );

  const onLeftRangeInput = useCallback(
    (value: string) => {
      if (!token0 || !token1 || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(value, token0.decimals, token1.decimals, revertPrice);

      if (tickFromPrice === undefined) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickUpper(tick) : setTickLower(tick);
    },
    [revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
  );

  const onRightRangeInput = useCallback(
    (value: string) => {
      if (!token0 || !token1 || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(value, token0.decimals, token1.decimals, revertPrice);

      if (tickFromPrice === undefined) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickLower(tick) : setTickUpper(tick);
    },
    [revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
  );

  const onBrushDomainChange = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      if (!minPrice || !maxPrice) return;
      const leftPrice = parseFloat(!revertPrice ? minPrice : maxPrice.toString().replace(/,/g, ''));
      const rightPrice = parseFloat(!revertPrice ? maxPrice : minPrice.toString().replace(/,/g, ''));

      let leftRangeValue = Number(domain[0]);
      const rightRangeValue = Number(domain[1]);

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6;
      }

      const updateLeft =
        (!ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
        leftRangeValue > 0 &&
        leftRangeValue !== leftPrice;

      const updateRight =
        (!ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER] || mode === 'reset') &&
        rightRangeValue > 0 &&
        rightRangeValue < 1e35 &&
        rightRangeValue !== rightPrice;

      if (updateLeft && updateRight) {
        const parsedLeftRangeValue = parseFloat(toString(Number(leftRangeValue.toFixed(18))));
        const parsedRightRangeValue = parseFloat(toString(Number(rightRangeValue.toFixed(18))));
        if (parsedLeftRangeValue > 0 && parsedRightRangeValue > 0 && parsedLeftRangeValue < parsedRightRangeValue) {
          onBothRangeInput(leftRangeValue.toFixed(18), rightRangeValue.toFixed(18));
        }
      } else if (updateLeft) {
        onLeftRangeInput(leftRangeValue.toFixed(18));
      } else if (updateRight) {
        onRightRangeInput(rightRangeValue.toFixed(18));
      }
    },
    [minPrice, maxPrice, revertPrice, ticksAtLimit, onBothRangeInput, onLeftRangeInput, onRightRangeInput],
  );

  if (!isTargetUniV3) return null;
  if (!pool || tickLower === null || tickUpper === null) return <LiquidityChartSkeleton />;
  return (
    <LiquidityChartRangeInput
      id="zap-widget-liquidity-chart"
      pool={{
        fee,
        tickCurrent,
        tickSpacing,
        ticks,
        liquidity,
        token0,
        token1,
        category,
      }}
      price={{
        current: targetPoolPrice ?? undefined,
        lower: minPrice,
        upper: maxPrice,
      }}
      ticksAtLimit={ticksAtLimit}
      revertPrice={revertPrice}
      onBrushDomainChange={onBrushDomainChange}
      zoomPosition={{
        top: '0px',
        left: undefined,
        right: '0px',
        bottom: undefined,
        gap: '8px',
      }}
    />
  );
}

const BAR_COUNT = 22;
const barHeights = [5, 10, 15, 30, 45, 55, 60, 70, 85, 90, 100, 100, 80, 75, 55, 60, 30, 30, 25, 15, 10, 5];
const barColors = ['bg-layer2', 'bg-layer2'];

function LiquidityChartSkeleton() {
  return (
    <div className="w-full h-[172px] pt-2 mt-4 mb-2 relative rounded-md flex flex-col justify-end overflow-hidden">
      {/* Axis */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-layer2 z-[1]" />
      {/* Bars */}
      <div className="flex justify-center items-end gap-[2px] h-full w-full px-2 pb-1 z-[2]">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 min-w-1 max-w-2 ${barColors[i % 2]} rounded-t-sm relative overflow-hidden flex items-end`}
            style={{ height: `${barHeights[i]}%` }}
          >
            <div
              className="absolute top-0 left-0 w-full h-full opacity-60 animate-[shimmer_1.8s_linear_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)',
                zIndex: 2,
                animationName: 'shimmer',
              }}
            />
          </div>
        ))}
      </div>
      {/* Shimmer keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}
