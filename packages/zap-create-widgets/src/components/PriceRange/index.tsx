import { useEffect, useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { usePrevious } from '@kyber/hooks';
import { POOL_CATEGORY, univ3PoolNormalize } from '@kyber/schema';
import { Button, Skeleton } from '@kyber/ui';
import { toString } from '@kyber/utils/number';
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/uniswapv3';

import { DEFAULT_PRICE_RANGE, FULL_PRICE_RANGE, PRICE_RANGE } from '@/components/PriceRange/constants';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';

interface PriceRange {
  range: number | string;
  tickLower?: number;
  tickUpper?: number;
}

const PriceRange = () => {
  const { setTickLower, setTickUpper, tickLower, tickUpper } = useZapState();

  const { pool, revertPrice, poolPrice } = usePoolStore(['pool', 'revertPrice', 'poolPrice']);

  const initializing = !pool;

  const previousRevertPrice = usePrevious(revertPrice);

  const pairCategory = initializing ? undefined : pool.category;

  const [lastSelected, setLastSelected] = useState<number | string>('');

  const priceRanges = useMemo(() => {
    if (initializing || poolPrice === null || !pairCategory) return [];

    const priceOptionsForPairCategory =
      PRICE_RANGE[pairCategory as keyof typeof PRICE_RANGE] || PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR];
    if (!priceOptionsForPairCategory.length) return [];

    const { success: isUniV3, data: poolUniV3 } = univ3PoolNormalize.safeParse(pool);
    if (!isUniV3) return [];

    return priceOptionsForPairCategory
      .map(item => {
        if (item === FULL_PRICE_RANGE)
          return {
            range: item,
            tickLower: poolUniV3.minTick,
            tickUpper: poolUniV3.maxTick,
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

        if (lower === undefined || upper === undefined) return null;

        const nearestLowerTick = nearestUsableTick(lower, poolUniV3.tickSpacing);
        const nearestUpperTick = nearestUsableTick(upper, poolUniV3.tickSpacing);

        let validLowerTick = nearestLowerTick;
        let validUpperTick = nearestUpperTick;
        if (nearestLowerTick === nearestUpperTick) {
          const lowerPriceFromTick = tickToPrice(
            nearestLowerTick,
            pool.token0?.decimals,
            pool.token1?.decimals,
            revertPrice,
          );
          if (Number(lowerPriceFromTick) > poolPrice) {
            validLowerTick = validLowerTick - poolUniV3.tickSpacing;
          } else {
            validUpperTick = validLowerTick + poolUniV3.tickSpacing;
          }
        }

        return {
          range: item,
          tickLower: validLowerTick < MIN_TICK ? MIN_TICK : validLowerTick,
          tickUpper: validUpperTick > MAX_TICK ? MAX_TICK : validUpperTick,
        };
      })
      .filter(item => !!item) as PriceRange[];
  }, [pairCategory, initializing, pool, poolPrice, revertPrice]);

  const rangeSelected = useMemo(() => {
    const selecteds = (priceRanges || []).filter(item => item.tickLower === tickLower && item.tickUpper === tickUpper);
    if (selecteds.length === 1) return selecteds[0].range;
    if (selecteds.length > 1 && lastSelected && selecteds.find(item => item.range === lastSelected))
      return lastSelected;
    return;
  }, [priceRanges, tickLower, tickUpper, lastSelected]);
  const previousRangeSelected = usePrevious(rangeSelected);

  const handleSelectPriceRange = (range: string | number) => {
    if (!priceRanges.length) return;
    const priceRange = priceRanges.find(item => item?.range === range);
    if (priceRange?.tickLower === undefined || priceRange?.tickUpper === undefined) return;
    setLastSelected(range);
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
    if (!pairCategory || !priceRanges.length) return;
    if (tickLower === null || tickUpper === null)
      handleSelectPriceRange(
        DEFAULT_PRICE_RANGE[pairCategory as keyof typeof DEFAULT_PRICE_RANGE] ||
          DEFAULT_PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR],
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairCategory, priceRanges]);

  return (
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
            {item.range === FULL_PRICE_RANGE ? t`Full Range` : `${Number(item.range) * 100}%`}
          </Button>
        ))
      )}
    </div>
  );
};

export default PriceRange;
