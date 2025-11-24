import { useCallback, useMemo } from 'react';

import { univ3PoolNormalize } from '@kyber/schema';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { Bound, LiquidityChartRangeInput } from '@kyberswap/liquidity-chart';
import '@kyberswap/liquidity-chart/style.css';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function LiquidityChart() {
  const { positionId } = useWidgetStore(['positionId']);
  const { pool: rawPool, poolPrice, revertPrice } = usePoolStore(['pool', 'poolPrice', 'revertPrice']);
  const { tickLower, tickUpper, setTickLower, setTickUpper, minPrice, maxPrice } = useZapState();

  const pool = useMemo(() => {
    if (rawPool === null) return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;
    return null;
  }, [rawPool]);

  const fee = !pool ? undefined : pool.fee;
  const tickCurrent = !pool || !('tick' in pool) ? undefined : pool.tick;
  const tickSpacing = !pool || !('tickSpacing' in pool) ? undefined : pool.tickSpacing;
  const ticks = !pool || !('ticks' in pool) ? [] : pool.ticks;
  const liquidity = !pool ? '0' : pool.liquidity;
  const token0 = !pool ? undefined : pool.token0;
  const token1 = !pool ? undefined : pool.token1;
  const category = !pool ? undefined : pool.category;

  const ticksAtLimit = useMemo(
    () => ({
      LOWER: pool !== null && 'minTick' in pool && pool.minTick === tickLower,
      UPPER: pool !== null && 'maxTick' in pool && pool.maxTick === tickUpper,
    }),
    [pool, tickLower, tickUpper],
  );

  const onBothRangeInput = useCallback(
    (l: string, r: string) => {
      if (!token0 || !token1 || positionId || !tickSpacing) return;
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
    [positionId, revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
  );

  const onLeftRangeInput = useCallback(
    (value: string) => {
      if (!token0 || !token1 || positionId || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(value, token0.decimals, token1.decimals, revertPrice);

      if (tickFromPrice === undefined) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickUpper(tick) : setTickLower(tick);
    },
    [positionId, revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
  );

  const onRightRangeInput = useCallback(
    (value: string) => {
      if (!token0 || !token1 || positionId || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(value, token0.decimals, token1.decimals, revertPrice);

      if (tickFromPrice === undefined) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickLower(tick) : setTickUpper(tick);
    },
    [positionId, revertPrice, setTickLower, setTickUpper, tickSpacing, token0, token1],
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

  return (
    <div className="mt-4">
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
          current: poolPrice ?? undefined,
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
    </div>
  );
}
