import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import { Univ3PoolType, univ3PoolNormalize, univ3Position } from '@/schema';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function PositionPriceRange() {
  const { position, pool, poolType } = useZapOutContext(s => s);

  const { revertPrice } = useZapOutUserState();

  const { success: isUniv3, data: univ3Pos } = univ3Position.safeParse(position);

  const { success: isUniv3Pool, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);

  const isUniV3PoolType = Univ3PoolType.safeParse(poolType).success;
  const isUniV3 = isUniv3 && isUniv3Pool;
  if (!isUniV3PoolType) return null;

  const initializing = pool === 'loading' || position === 'loading' || !univ3Pool || !univ3Pos;

  const minPrice =
    isUniV3 && !initializing
      ? tickToPrice(univ3Pos.tickLower, univ3Pool.token0.decimals, univ3Pool.token1.decimals, revertPrice)
      : 0;

  const maxPrice =
    isUniV3 && !initializing
      ? tickToPrice(univ3Pos.tickUpper, univ3Pool.token0.decimals, univ3Pool.token1.decimals, revertPrice)
      : 0;

  const isMinTick = isUniV3 && !initializing ? univ3Pos.tickLower === univ3Pool.minTick : true;
  const isMaxTick = isUniV3 && !initializing ? univ3Pos.tickUpper === univ3Pool.maxTick : true;

  const displayLower = isMinTick
    ? '0'
    : formatDisplayNumber(revertPrice ? maxPrice : minPrice, {
        significantDigits: 8,
      });

  const displayUpper = isMaxTick
    ? '∞'
    : formatDisplayNumber(revertPrice ? minPrice : maxPrice, {
        significantDigits: 8,
      });

  const baseToken = initializing ? '' : revertPrice ? pool.token0.symbol : pool.token1.symbol;
  const quoteToken = initializing ? '' : revertPrice ? pool.token1.symbol : pool.token0.symbol;

  const baseTokenSymbol = <TokenSymbol symbol={baseToken} maxWidth={60} />;
  const quoteTokenSymbol = <TokenSymbol symbol={quoteToken} maxWidth={60} />;

  const label = (
    <>
      {baseTokenSymbol} per {quoteTokenSymbol}
    </>
  );

  return (
    <div className="px-4 py-3 text-sm border border-stroke rounded-md">
      <p className="text-subText mb-3">Your Position Price Ranges</p>
      <div className="flex items-center gap-4">
        <div className="bg-white bg-opacity-[0.04] rounded-md py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Min Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={displayLower}>
              {displayLower}
            </p>
          )}
          {initializing ? <Skeleton className="w-20 h-5" /> : <p className="text-subText">{label}</p>}
        </div>
        <div className="bg-white bg-opacity-[0.04] rounded-md px-2 py-3 w-1/2 flex flex-col items-center justify-center gap-1">
          <p className="text-subText">Max Price</p>
          {initializing ? (
            <Skeleton className="w-14 h-5" />
          ) : (
            <p className="max-w-full truncate" title={displayUpper}>
              {displayUpper}
            </p>
          )}
          {initializing ? <Skeleton className="w-20 h-5" /> : <p className="text-subText">{label}</p>}
        </div>
      </div>
    </div>
  );
}
