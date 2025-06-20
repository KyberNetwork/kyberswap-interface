import { useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { univ3PoolNormalize, univ3Types } from '@kyber/schema';
import { Button, Skeleton } from '@kyber/ui';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/uniswapv3';

import { DEFAULT_PRICE_RANGE, FULL_PRICE_RANGE, FeeAmount, PRICE_RANGE } from '@/components/PriceRange/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

interface SelectedRange {
  range: number | string;
  tickLower?: number;
  tickUpper?: number;
}

const getFeeRange = (fee: number): FeeAmount | undefined => {
  if (!fee) return;
  return [FeeAmount.HIGH, FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.LOWEST].reduce(
    (range, current) => (current >= fee ? current : range),
    FeeAmount.HIGH,
  );
};

const PriceRange = () => {
  const { priceLower, priceUpper, setTickLower, setTickUpper, tickLower, tickUpper } = useZapState();
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);

  const { poolType, positionId } = useWidgetStore(
    useShallow(s => ({ poolType: s.poolType, positionId: s.positionId })),
  );
  const { pool, revertPrice } = usePoolStore(useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice })));

  const initializing = pool === 'loading';

  const fee = initializing ? 0 : pool.fee;
  const feeRange = getFeeRange(fee);
  const priceRanges = useMemo(() => (feeRange ? PRICE_RANGE[feeRange] : []), [feeRange]);

  const priceRangeCalculated = useMemo(() => {
    if (!priceRanges.length || initializing) return;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (!success) return;
    return priceRanges
      .map(item => {
        if (item === FULL_PRICE_RANGE)
          return {
            range: item,
            tickLower: data.minTick,
            tickUpper: data.maxTick,
          };

        const currentPoolPrice = tickToPrice(data.tick, pool.token0?.decimals, pool.token1?.decimals, false);

        if (!currentPoolPrice) return;

        const left = +currentPoolPrice * (1 - Number(item));
        const right = +currentPoolPrice * (1 + Number(item));

        const lower = priceToClosestTick(toString(Number(left)), pool.token0?.decimals, pool.token1?.decimals, false);
        const upper = priceToClosestTick(toString(Number(right)), pool.token0?.decimals, pool.token1?.decimals, false);
        if (!lower || !upper) return null;

        return {
          range: item,
          tickLower: nearestUsableTick(lower, data.tickSpacing),
          tickUpper: nearestUsableTick(upper, data.tickSpacing),
        };
      })
      .filter(item => !!item);
  }, [pool, priceRanges, initializing]);

  const minPrice = useMemo(() => {
    if (!initializing) {
      const { success, data } = univ3PoolNormalize.safeParse(pool);
      if (success && ((!revertPrice && data.minTick === tickLower) || (revertPrice && data.maxTick === tickUpper)))
        return '0';

      return !revertPrice ? priceLower : priceUpper;
    }
  }, [revertPrice, pool, tickLower, tickUpper, priceLower, priceUpper, initializing]);

  const maxPrice = useMemo(() => {
    if (pool !== 'loading') {
      const { success, data } = univ3PoolNormalize.safeParse(pool);
      if (success && ((!revertPrice && data.maxTick === tickUpper) || (revertPrice && data.minTick === tickLower)))
        return '∞';
      return !revertPrice ? priceUpper : priceLower;
    }
  }, [revertPrice, pool, tickUpper, tickLower, priceUpper, priceLower]);

  const handleSelectPriceRange = (range: string | number) => {
    if (!priceRangeCalculated) return;
    const selected = priceRangeCalculated.find(item => item?.range === range);
    if (!selected) return;
    setSelectedRange(selected);
    setTickLower(selected.tickLower);
    setTickUpper(selected.tickUpper);
  };

  useEffect(() => {
    if (!priceRangeCalculated) return;
    const selected = priceRangeCalculated.find(item => item?.tickLower === tickLower && item?.tickUpper === tickUpper);
    if (selected) setSelectedRange(selected);
    else setSelectedRange(null);
  }, [priceRangeCalculated, tickLower, tickUpper]);

  // Set default price range depending on protocol fee
  useEffect(() => {
    if (!feeRange) return;
    if (!selectedRange) handleSelectPriceRange(DEFAULT_PRICE_RANGE[feeRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeRange]);

  const isUniv3 = univ3Types.includes(poolType as any);

  if (!isUniv3) return null;

  return !positionId ? (
    <div className="flex mt-6 gap-[6px] my-[10px] border border-stroke rounded-md">
      {initializing ? (
        <>
          <Button variant="outline" className="flex-1 !border-none !text-icon">
            {FULL_PRICE_RANGE}
          </Button>
          <Button variant="outline" className="flex-1 !border-none !text-icon">
            <Skeleton className="w-full h-full" />
          </Button>
          <Button variant="outline" className="flex-1 !border-none !text-icon">
            <Skeleton className="w-full h-full" />
          </Button>
          <Button variant="outline" className="flex-1 !border-none !text-icon">
            <Skeleton className="w-full h-full" />
          </Button>
        </>
      ) : (
        priceRanges.map((item: string | number, index: number) => (
          <Button
            key={index}
            variant="outline"
            className={`flex-1 !border-none !text-icon ${item === selectedRange?.range ? ' !bg-[#ffffff14]' : ''}`}
            onClick={() => handleSelectPriceRange(item as typeof FULL_PRICE_RANGE | number)}
          >
            {item === FULL_PRICE_RANGE ? item : `${Number(item) * 100}%`}
          </Button>
        ))
      )}
    </div>
  ) : (
    <div className="px-4 py-3 mt-4 text-sm border border-stroke rounded-md">
      <p className="text-subText mb-3">Your Position Price Ranges</p>
      <div className="flex items-center gap-4">
        <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Min Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={minPrice?.toString()}>
              {minPrice}
            </p>
          )}
          {initializing ? (
            <Skeleton className="w-20 h-5" />
          ) : (
            <p className="text-subText">
              {revertPrice
                ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
                : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
            </p>
          )}
        </div>
        <div className="bg-white bg-opacity-[0.04] rounded-md px-2 py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Max Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={maxPrice?.toString()}>
              {maxPrice}
            </p>
          )}
          {initializing ? (
            <Skeleton className="w-20 h-5" />
          ) : (
            <p className="text-subText">
              {revertPrice
                ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
                : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceRange;
