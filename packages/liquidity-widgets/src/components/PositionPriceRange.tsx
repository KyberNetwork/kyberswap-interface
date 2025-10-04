import { Skeleton } from '@kyber/ui';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { getPriceRangeToShow } from '@/utils';

export default function PositionPriceRange() {
  const { minPrice, maxPrice, tickLower, tickUpper } = useZapState();

  const { pool, revertPrice } = usePoolStore(['pool', 'revertPrice']);

  const initializing = !pool;

  const priceRange = getPriceRangeToShow({
    pool,
    revertPrice,
    tickLower,
    tickUpper,
    minPrice,
    maxPrice,
  });

  return (
    <div className="px-4 py-3 mt-4 text-sm border border-stroke rounded-md">
      <p className="text-subText mb-3">Your Position Price Ranges</p>
      <div className="flex items-center gap-4">
        <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Min Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={priceRange?.minPrice?.toString()}>
              {priceRange?.minPrice}
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
            <p className="max-w-full truncate" title={priceRange?.maxPrice?.toString()}>
              {priceRange?.maxPrice}
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
}
