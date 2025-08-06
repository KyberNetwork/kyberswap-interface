import { useMemo } from 'react';

import { useShallow } from 'zustand/shallow';

import { univ3PoolNormalize, univ3Types } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

interface PriceRange {
  range: number | string;
  tickLower?: number;
  tickUpper?: number;
}

const PriceRange = () => {
  const { priceLower, priceUpper, tickLower, tickUpper } = useZapState();

  const { poolType } = useWidgetStore(useShallow(s => ({ poolType: s.poolType })));
  const { pool, revertPrice } = usePoolStore(useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice })));

  const initializing = pool === 'loading';

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

  const isUniv3 = univ3Types.includes(poolType as any);
  if (!isUniv3) return null;

  const quote = initializing
    ? ''
    : revertPrice
      ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
      : `${pool?.token1.symbol} per ${pool?.token0.symbol}`;

  return (
    <div className="px-4 py-3 text-sm border border-stroke rounded-md">
      <p className="text-subText mb-3">Your Position Price Ranges</p>
      <div className="flex items-center gap-4">
        <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Min Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={minPrice?.toString()}>
              {minPrice === '0' || minPrice === '∞'
                ? minPrice
                : formatDisplayNumber(minPrice?.replace(/,/g, ''), { significantDigits: 6 })}
            </p>
          )}
          {initializing ? (
            <Skeleton className="w-20 h-5" />
          ) : (
            <p className="text-subText truncate" title={quote}>
              {quote}
            </p>
          )}
        </div>
        <div className="bg-white bg-opacity-[0.04] rounded-md px-2 py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Max Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={maxPrice?.toString()}>
              {maxPrice === '0' || maxPrice === '∞'
                ? maxPrice
                : formatDisplayNumber(maxPrice?.replace(/,/g, ''), { significantDigits: 6 })}
            </p>
          )}
          {initializing ? (
            <Skeleton className="w-20 h-5" />
          ) : (
            <p className="text-subText truncate" title={quote}>
              {quote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceRange;
