import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { univ3PoolNormalize } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';
import { formatNumber } from '@kyber/utils/number';
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType } from '@/types/index';

export default function PriceInput({ type }: { type: PriceType }) {
  const { tickLower, tickUpper, setTickLower, setTickUpper, priceLower, priceUpper } = useZapState();
  const { pool: rawPool, revertPrice } = usePoolStore(useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice })));
  const { positionId } = useWidgetStore(useShallow(s => ({ positionId: s.positionId })));

  const [localValue, setLocalValue] = useState('');

  const initializing = rawPool === 'loading';

  const pool = useMemo(() => {
    if (rawPool === 'loading') return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;

    return 'loading';
  }, [rawPool]);

  const isFullRange = pool !== 'loading' && tickLower === pool.minTick && tickUpper === pool.maxTick;

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
    const tick = priceToClosestTick(value, pool.token0?.decimals, pool.token1?.decimals, revertPrice);
    if (tick !== undefined) {
      const t = tick % pool.tickSpacing === 0 ? tick : nearestUsableTick(tick, pool.tickSpacing);
      if (type === PriceType.PriceLower) {
        revertPrice ? setTickUpper(t) : setTickLower(t);
      } else {
        revertPrice ? setTickLower(t) : setTickUpper(t);
      }
    }
  };

  const isMinTick = pool !== 'loading' && tickLower === pool.minTick;
  const isMaxTick = pool !== 'loading' && tickUpper === pool.maxTick;

  useEffect(() => {
    if (pool === 'loading') return;
    if (type === PriceType.PriceLower && (!revertPrice ? pool?.minTick === tickLower : pool?.maxTick === tickUpper)) {
      setLocalValue('0');
    } else if (
      type === PriceType.PriceUpper &&
      (!revertPrice ? pool?.maxTick === tickUpper : pool?.minTick === tickLower)
    ) {
      setLocalValue('∞');
    } else if (priceLower && priceUpper) {
      if (type === PriceType.PriceLower) {
        const valueToSet = !revertPrice ? priceLower : priceUpper;
        if (positionId) setLocalValue(formatNumber(parseFloat(valueToSet)));
        else setLocalValue(valueToSet);
      } else {
        const valueToSet = !revertPrice ? priceUpper : priceLower;
        if (positionId) setLocalValue(formatNumber(parseFloat(valueToSet)));
        else setLocalValue(valueToSet);
      }
    }
  }, [tickUpper, tickLower, pool, revertPrice, isMaxTick, isMinTick, type, priceLower, priceUpper, positionId]);

  return (
    <div className="mt-[0.6rem] w-1/2 p-3 border rounded-md border-stroke flex flex-col gap-1 items-center">
      <div className="flex justify-between items-end">
        <button
          className="w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60 outline-none"
          role="button"
          onClick={() => {
            if (type === PriceType.PriceLower) {
              revertPrice ? increaseTickUpper() : decreaseTickLower();
            } else {
              revertPrice ? increaseTickLower() : decreaseTickUpper();
            }
          }}
          disabled={isFullRange || positionId !== undefined}
        >
          -
        </button>

        <div className="flex flex-col items-center gap-[6px] w-fit text-sm font-medium text-subText">
          <span>{type === PriceType.PriceLower ? 'Min' : 'Max'} price</span>
          {initializing ? (
            <Skeleton className="w-20 h-6 mx-4" />
          ) : (
            <input
              className="bg-transparent w-[110px] text-center text-text text-base p-0 border-none outline-none disabled:cursor-not-allowed disabled:opacity-60"
              value={localValue}
              autoFocus={false}
              onChange={onPriceChange}
              onBlur={e => wrappedCorrectPrice(e.target.value)}
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
          )}
        </div>

        <button
          className="w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60 outline-none"
          onClick={() => {
            if (type === PriceType.PriceLower) {
              revertPrice ? decreaseTickUpper() : increaseTickLower();
            } else {
              revertPrice ? decreaseTickLower() : increaseTickUpper();
            }
          }}
          disabled={isFullRange || positionId !== undefined}
        >
          +
        </button>
      </div>

      {initializing ? (
        <Skeleton className="w-24 h-5 mt-1" />
      ) : (
        <span className="w-max text-sm font-medium text-subText">
          {pool !== 'loading'
            ? !revertPrice
              ? `${pool?.token1.symbol} per ${pool?.token0.symbol}`
              : `${pool?.token0.symbol} per ${pool?.token1.symbol}`
            : '--'}
        </span>
      )}
    </div>
  );
}
