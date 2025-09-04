import { useEffect, useMemo, useState } from 'react';

import { univ3PoolNormalize } from '@kyber/schema';
import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatNumber } from '@kyber/utils/number';
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { PriceType } from '@/types/index';

export default function PriceInput({ type }: { type: PriceType }) {
  const { tickLower, tickUpper, setTickLower, setTickUpper, minPrice, maxPrice } = useZapState();
  const { pool: rawPool, revertPrice } = usePoolStore(['pool', 'revertPrice']);
  const { positionId } = useWidgetStore(['positionId']);

  const [localValue, setLocalValue] = useState('');

  const pool = useMemo(() => {
    if (rawPool === 'loading') return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;

    return 'loading';
  }, [rawPool]);

  const initializing = pool === 'loading';

  const isMinTick = !initializing && tickLower === pool.minTick;
  const isMaxTick = !initializing && tickUpper === pool.maxTick;
  const isFullRange = isMinTick && isMaxTick;

  const increaseTickLower = () => {
    if (initializing || !tickLower) return;
    const newTick = tickLower + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickLower(newTick);
  };

  const increaseTickUpper = () => {
    if (initializing || !tickUpper) return;
    const newTick = tickUpper + pool.tickSpacing;
    if (newTick <= MAX_TICK) setTickUpper(newTick);
  };

  const decreaseTickLower = () => {
    if (initializing || !tickLower) return;
    const newTick = tickLower - pool.tickSpacing;
    if (newTick >= MIN_TICK) setTickLower(newTick);
  };

  const decreaseTickUpper = () => {
    if (initializing || !tickUpper) return;
    const newTick = tickUpper - pool.tickSpacing;
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
      if (type === PriceType.MinPrice) {
        revertPrice ? setTickUpper(t) : setTickLower(t);
      } else {
        revertPrice ? setTickLower(t) : setTickUpper(t);
      }
    }
  };

  const handleDecreasePrice = () => {
    if (type === PriceType.MinPrice) revertPrice ? increaseTickUpper() : decreaseTickLower();
    else revertPrice ? increaseTickLower() : decreaseTickUpper();
  };

  const handleIncreasePrice = () => {
    if (type === PriceType.MinPrice) revertPrice ? decreaseTickUpper() : increaseTickLower();
    else revertPrice ? decreaseTickLower() : increaseTickUpper();
  };

  useEffect(() => {
    if (pool === 'loading') return;
    if (type === PriceType.MinPrice && (!revertPrice ? isMinTick : isMaxTick)) {
      setLocalValue('0');
    } else if (type === PriceType.MaxPrice && (!revertPrice ? isMaxTick : isMinTick)) {
      setLocalValue('∞');
    } else if (minPrice && maxPrice) {
      if (type === PriceType.MinPrice) {
        if (positionId) setLocalValue(formatNumber(parseFloat(minPrice)));
        else setLocalValue(minPrice);
      } else {
        if (positionId) setLocalValue(formatNumber(parseFloat(maxPrice)));
        else setLocalValue(maxPrice);
      }
    }
  }, [isMaxTick, isMinTick, maxPrice, minPrice, pool, positionId, revertPrice, type]);

  return (
    <div className="mt-[0.6rem] w-1/2 p-3 border rounded-md border-stroke flex flex-col gap-1 items-center">
      <div className="flex justify-between items-end gap-1">
        <button
          className="w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60 outline-none"
          role="button"
          onClick={handleDecreasePrice}
          disabled={isFullRange || positionId !== undefined}
        >
          -
        </button>

        <div className="flex flex-col items-center gap-[6px] w-fit text-sm font-medium text-subText">
          <span>{type === PriceType.MinPrice ? 'Min' : PriceType.MaxPrice ? 'Max' : ''} price</span>
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
          onClick={handleIncreasePrice}
          disabled={isFullRange || positionId !== undefined}
        >
          +
        </button>
      </div>

      {initializing ? (
        <Skeleton className="w-24 h-5 mt-1" />
      ) : (
        <div className="w-max text-sm font-medium text-subText flex items-center gap-1">
          <TokenSymbol symbol={!revertPrice ? pool.token1.symbol : pool.token0.symbol} maxWidth={80} />
          <span>per</span>
          <TokenSymbol symbol={!revertPrice ? pool.token0.symbol : pool.token1.symbol} maxWidth={80} />
        </div>
      )}
    </div>
  );
}
