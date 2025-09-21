import { useEffect, useState } from 'react';

import { UniV3Pool, defaultToken, univ3Types } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import usePriceRange from '@/components/RangeInput/usePriceRange';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function PriceInput() {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPool, revertPrice } = usePoolStore(['targetPool', 'revertPrice']);
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapStore([
    'tickLower',
    'tickUpper',
    'setTickLower',
    'setTickUpper',
  ]);
  const { minPrice, maxPrice, isMinTick, isMaxTick } = usePriceRange();

  const { token0 = defaultToken, token1 = defaultToken } = targetPool || {};

  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');
  const [minPriceTyping, setMinPriceTyping] = useState(false);
  const [maxPriceTyping, setMaxPriceTyping] = useState(false);

  useEffect(() => {
    if (isMinTick) {
      !revertPrice ? setLocalMinPrice('0') : setLocalMaxPrice('∞');
    } else if (isMaxTick) {
      !revertPrice ? setLocalMaxPrice('0') : setLocalMinPrice('∞');
    } else if (minPrice && maxPrice) {
      setLocalMinPrice(minPrice);
      setLocalMaxPrice(maxPrice);
    }
  }, [isMaxTick, isMinTick, maxPrice, minPrice, revertPrice]);

  const isTargetUniV3 = univ3Types.includes(targetPoolType as any);

  const poolTick =
    !isTargetUniV3 || !targetPool
      ? undefined
      : (targetPool as UniV3Pool).tick % (targetPool as UniV3Pool).tickSpacing === 0
        ? (targetPool as UniV3Pool).tick
        : nearestUsableTick((targetPool as UniV3Pool).tick, (targetPool as UniV3Pool).tickSpacing);

  const increaseTickLower = () => {
    if (!isTargetUniV3 || !targetPool || !poolTick) return;
    const newTick =
      tickLower !== null
        ? tickLower + (targetPool as UniV3Pool).tickSpacing
        : poolTick + (targetPool as UniV3Pool).tickSpacing;
    if (newTick <= MAX_TICK) setTickLower(newTick);
  };
  const increaseTickUpper = () => {
    if (!isTargetUniV3 || !targetPool || !poolTick) return;
    const newTick =
      tickUpper !== null
        ? tickUpper + (targetPool as UniV3Pool).tickSpacing
        : poolTick + (targetPool as UniV3Pool).tickSpacing;
    if (newTick <= MAX_TICK) setTickUpper(newTick);
  };

  const decreaseTickLower = () => {
    if (!isTargetUniV3 || !targetPool || !poolTick) return;
    const newTick =
      (tickLower !== null ? tickLower : (targetPool as UniV3Pool).tick) - (targetPool as UniV3Pool).tickSpacing;

    if (newTick >= MIN_TICK) setTickLower(newTick);
  };
  const decreaseTickUpper = () => {
    if (!isTargetUniV3 || !targetPool || !poolTick) return;
    const newTick = (tickUpper !== null ? tickUpper : poolTick) - (targetPool as UniV3Pool).tickSpacing;

    if (newTick >= MIN_TICK) setTickUpper(newTick);
  };

  if (!isTargetUniV3) return null;

  const sectionClassName = 'flex items-center justify-center w-full gap-2 rounded-sm px-2 bg-[#ffffff0a]';
  const buttonClassName =
    'w-6 h-6 rounded-[4px] border border-stroke bg-layer2 text-subText flex items-center justify-center cursor-pointer hover:enabled:brightness-150 active:enabled:scale-95 disabled:cursor-not-allowed disabled:opacity-60 outline-none';
  const inputClassName = 'bg-transparent text-text text-center border-none outline-none max-w-[60px] md:max-w-[80px]';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <div className={`${sectionClassName} flex-1 min-w-0`}>
        <button
          className={buttonClassName}
          onClick={() => {
            revertPrice ? increaseTickUpper() : decreaseTickLower();
          }}
          disabled={revertPrice ? isMaxTick : isMinTick}
        >
          -
        </button>
        <div className="flex flex-col items-center py-2 flex-1 min-w-0 gap-1">
          <p className="text-sm text-subText whitespace-nowrap">Min Price</p>
          {tickLower === null || tickUpper === null ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <input
              className={`${inputClassName} w-full`}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
              value={localMinPrice}
              onChange={e => {
                if (!minPriceTyping) setMinPriceTyping(true);
                const value = e.target.value.replace(/,/g, '');
                const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
                  setLocalMinPrice(value);
                }
              }}
              onBlur={e => {
                if (minPriceTyping) setMinPriceTyping(false);
                if (!targetPool) return;
                const tick = priceToClosestTick(e.target.value, token0.decimals, token1.decimals, revertPrice);
                if (tick !== undefined) {
                  const t =
                    tick % (targetPool as any).tickSpacing === 0
                      ? tick
                      : nearestUsableTick(tick, (targetPool as any).tickSpacing);
                  revertPrice ? setTickUpper(t) : setTickLower(t);
                }
              }}
            />
          )}
        </div>
        <button
          className={buttonClassName}
          onClick={() => {
            revertPrice ? decreaseTickUpper() : increaseTickLower();
          }}
          disabled={revertPrice ? isMaxTick : isMinTick}
        >
          +
        </button>
      </div>

      <div className={`${sectionClassName} flex-1 min-w-0`}>
        <button
          className={buttonClassName}
          onClick={() => {
            revertPrice ? increaseTickLower() : decreaseTickUpper();
          }}
          disabled={!revertPrice ? isMaxTick : isMinTick}
        >
          -
        </button>
        <div className="flex flex-col items-center py-2 flex-1 min-w-0 gap-1">
          <p className="text-sm text-subText whitespace-nowrap">Max Price</p>
          {tickLower === null || tickUpper === null ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <input
              className={`${inputClassName} w-full`}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
              value={localMaxPrice}
              onChange={e => {
                if (!maxPriceTyping) setMaxPriceTyping(true);
                const value = e.target.value.replace(/,/g, '');
                const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
                if (value === '' || inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) {
                  setLocalMaxPrice(value);
                }
              }}
              onBlur={e => {
                if (maxPriceTyping) setMaxPriceTyping(false);
                if (!targetPool) return;
                const tick = priceToClosestTick(e.target.value, token0.decimals, token1.decimals, revertPrice);
                if (tick !== undefined) {
                  const t =
                    tick % (targetPool as UniV3Pool).tickSpacing === 0
                      ? tick
                      : nearestUsableTick(tick, (targetPool as UniV3Pool).tickSpacing);
                  revertPrice ? setTickLower(t) : setTickUpper(t);
                }
              }}
            />
          )}
        </div>
        <button
          className={buttonClassName}
          onClick={() => {
            revertPrice ? decreaseTickLower() : increaseTickUpper();
          }}
          disabled={!revertPrice ? isMaxTick : isMinTick}
        >
          +
        </button>
      </div>
    </div>
  );
}
