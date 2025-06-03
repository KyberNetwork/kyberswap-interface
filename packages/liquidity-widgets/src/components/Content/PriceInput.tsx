import { useEffect, useMemo, useState } from 'react';

import { univ3PoolNormalize } from '@kyber/schema';
import {
  MAX_TICK,
  MIN_TICK,
  nearestUsableTick,
  priceToClosestTick,
  tickToPrice,
} from '@kyber/utils/uniswapv3';

import { Type } from '@/hooks/types/zapInTypes';
import { useZapState } from '@/hooks/useZapInState';
import { useWidgetContext } from '@/stores';
import { formatNumber } from '@/utils';

export default function PriceInput({ type }: { type: Type }) {
  const { tickLower, tickUpper, revertPrice, setTickLower, setTickUpper, positionId } =
    useZapState();
  const { pool: rawPool } = useWidgetContext((s) => s);
  const [localValue, setLocalValue] = useState('');

  const pool = useMemo(() => {
    if (rawPool === 'loading') return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;
    // TODO: check if return loading here ok?
    return 'loading';
  }, [rawPool]);

  const isFullRange =
    pool !== 'loading' && tickLower === pool.minTick && tickUpper === pool.maxTick;

  const poolTick =
    pool === 'loading'
      ? undefined
      : pool.tick % pool.tickSpacing === 0
        ? pool.tick
        : nearestUsableTick(pool.tick, pool.tickSpacing);

  const increaseTickLower = () => {
    if (pool === 'loading' || poolTick === undefined) return;
    const newTick = tickLower !== null ? tickLower + pool.tickSpacing : poolTick + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickLower(newTick);
  };

  const increaseTickUpper = () => {
    if (pool === 'loading' || poolTick === undefined) return;
    const newTick = tickUpper !== null ? tickUpper + pool.tickSpacing : poolTick + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickUpper(newTick);
  };

  const decreaseTickLower = () => {
    if (pool === 'loading' || poolTick === undefined) return;
    const newTick = (tickLower !== null ? tickLower : pool.tick) - pool.tickSpacing;

    if (newTick >= MIN_TICK) setTickLower(newTick);
  };
  const decreaseTickUpper = () => {
    if (pool === 'loading' || poolTick === undefined) return;
    const newTick = (tickUpper !== null ? tickUpper : poolTick) - pool.tickSpacing;

    if (newTick >= MIN_TICK) setTickUpper(newTick);
  };

  const onPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
    if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
      setLocalValue(value);
    }
  };

  const wrappedCorrectPrice = (value: string) => {
    if (pool === 'loading') return;
    const tick = priceToClosestTick(
      value,
      pool.token0?.decimals,
      pool.token1?.decimals,
      revertPrice
    );
    if (tick !== undefined) {
      const t = tick % pool.tickSpacing === 0 ? tick : nearestUsableTick(tick, pool.tickSpacing);
      if (type === Type.PriceLower) {
        revertPrice ? setTickUpper(t) : setTickLower(t);
      } else {
        revertPrice ? setTickLower(t) : setTickUpper(t);
      }
    }
  };

  const isMinTick = pool !== 'loading' && tickLower === pool.minTick;
  const isMaxTick = pool !== 'loading' && tickUpper === pool.maxTick;

  useEffect(() => {
    if (pool !== 'loading') {
      let minPrice = localValue;
      let maxPrice = localValue;
      if (tickUpper !== null)
        maxPrice = isMaxTick
          ? revertPrice
            ? '0'
            : '∞'
          : tickToPrice(tickUpper, pool.token0?.decimals, pool.token1?.decimals, revertPrice);
      if (tickLower !== null)
        minPrice = isMinTick
          ? revertPrice
            ? '∞'
            : '0'
          : tickToPrice(tickLower, pool.token0?.decimals, pool.token1?.decimals, revertPrice);

      if (type === Type.PriceLower) {
        const valueToSet = revertPrice ? maxPrice : minPrice;
        setLocalValue(valueToSet === '∞' ? valueToSet : formatNumber(parseFloat(valueToSet)));
      } else {
        const valueToSet = revertPrice ? minPrice : maxPrice;
        setLocalValue(valueToSet === '∞' ? valueToSet : formatNumber(parseFloat(valueToSet)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tickUpper,
    tickLower,
    pool,
    revertPrice,
    isMaxTick,
    isMinTick,
    // localValue,
    type,
  ]);

  return (
    <div className="mt-[0.6rem] w-1/2 p-3 justify-between flex items-center border rounded-md border-stroke">
      {!positionId && (
        <button
          className="w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          role="button"
          onClick={() => {
            if (type === Type.PriceLower) {
              revertPrice ? increaseTickUpper() : decreaseTickLower();
            } else {
              revertPrice ? increaseTickLower() : decreaseTickUpper();
            }
          }}
          disabled={isFullRange || positionId !== undefined}
        >
          -
        </button>
      )}

      <div className="flex flex-col items-center gap-[6px] w-fit text-sm font-medium text-subText">
        <span>{type === Type.PriceLower ? 'Min' : 'Max'} price</span>
        <input
          className="bg-transparent w-[90px] text-center text-text text-base p-0 border-none outline-none disabled:cursor-not-allowed disabled:opacity-60"
          value={localValue}
          autoFocus={false}
          onChange={onPriceChange}
          onBlur={(e) => wrappedCorrectPrice(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          disabled={positionId !== undefined}
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0.0"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        />
        <span className="w-max">
          {pool !== 'loading'
            ? !revertPrice
              ? `${pool?.token1.symbol} per ${pool?.token0.symbol}`
              : `${pool?.token0.symbol} per ${pool?.token1.symbol}`
            : '--'}
        </span>
      </div>

      {!positionId && (
        <button
          className="w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (type === Type.PriceLower) {
              revertPrice ? decreaseTickUpper() : increaseTickLower();
            } else {
              revertPrice ? decreaseTickLower() : increaseTickUpper();
            }
          }}
          disabled={isFullRange || positionId !== undefined}
        >
          +
        </button>
      )}
    </div>
  );
}
