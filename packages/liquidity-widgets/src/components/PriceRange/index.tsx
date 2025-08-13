import { useEffect, useMemo } from 'react';

import { useShallow } from 'zustand/shallow';

import { usePrevious } from '@kyber/hooks';
import { univ3PoolNormalize, univ3Types } from '@kyber/schema';
import { Button, Skeleton } from '@kyber/ui';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { DEFAULT_PRICE_RANGE, FULL_PRICE_RANGE, FeeAmount, PRICE_RANGE } from '@/components/PriceRange/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

interface PriceRange {
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

  const { poolType, positionId } = useWidgetStore(
    useShallow(s => ({ poolType: s.poolType, positionId: s.positionId })),
  );
  const { pool, revertPrice, poolPrice } = usePoolStore(
    useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice, poolPrice: s.poolPrice })),
  );

  const initializing = pool === 'loading';

  const previousRevertPrice = usePrevious(revertPrice);

  const fee = initializing ? 0 : pool.fee;
  const feeRange = getFeeRange(fee);

  const priceRanges = useMemo(() => {
    if (initializing || !poolPrice) return [];

    const priceOptionsForFeeRange = feeRange ? PRICE_RANGE[feeRange] : [];
    if (!priceOptionsForFeeRange.length) return [];

    const { success: isUniV3, data } = univ3PoolNormalize.safeParse(pool);
    if (!isUniV3) return [];

    return priceOptionsForFeeRange
      .map(item => {
        if (item === FULL_PRICE_RANGE)
          return {
            range: item,
            tickLower: data.minTick,
            tickUpper: data.maxTick,
          };

        const left = poolPrice * (1 - Number(item));
        const right = poolPrice * (1 + Number(item));

        const lower = priceToClosestTick(
          !revertPrice ? toString(Number(left)) : toString(Number(right)),
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice,
        );
        const upper = priceToClosestTick(
          !revertPrice ? toString(Number(right)) : toString(Number(left)),
          pool.token0?.decimals,
          pool.token1?.decimals,
          revertPrice,
        );

        if (!lower || !upper) return null;

        return {
          range: item,
          tickLower: nearestUsableTick(lower, data.tickSpacing),
          tickUpper: nearestUsableTick(upper, data.tickSpacing),
        };
      })
      .filter(item => !!item) as PriceRange[];
  }, [feeRange, initializing, pool, poolPrice, revertPrice]);

  const rangeSelected = useMemo(
    () => (priceRanges || []).find(item => item.tickLower === tickLower && item.tickUpper === tickUpper)?.range,
    [priceRanges, tickLower, tickUpper],
  );
  const previousRangeSelected = usePrevious(rangeSelected);

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
    if (!priceRanges.length) return;
    const priceRange = priceRanges.find(item => item?.range === range);
    if (!priceRange?.tickLower || !priceRange?.tickUpper) return;
    setTickLower(priceRange.tickLower);
    setTickUpper(priceRange.tickUpper);
  };

  useEffect(() => {
    if (revertPrice !== previousRevertPrice && rangeSelected !== previousRangeSelected && previousRangeSelected) {
      handleSelectPriceRange(previousRangeSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revertPrice, previousRevertPrice]);

  // Set default price range depending on protocol fee
  useEffect(() => {
    if (!feeRange || !priceRanges.length) return;
    if (!tickLower || !tickUpper) handleSelectPriceRange(DEFAULT_PRICE_RANGE[feeRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeRange, priceRanges]);

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
        priceRanges.map((item: PriceRange, index: number) => (
          <Button
            key={index}
            variant="outline"
            className={`flex-1 !border-none !text-icon ${rangeSelected === item.range ? ' !bg-[#ffffff14]' : ''}`}
            onClick={() => handleSelectPriceRange(item.range)}
          >
            {item.range === FULL_PRICE_RANGE ? item.range : `${Number(item.range) * 100}%`}
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
