import { useEffect, useMemo, useState } from 'react';

import { t } from '@lingui/macro';

import { usePrevious } from '@kyber/hooks';
import { POOL_CATEGORY, univ3PoolNormalize } from '@kyber/schema';
import { Button, Skeleton } from '@kyber/ui';
import { toString } from '@kyber/utils/number';
import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/uniswapv3';

import { DEFAULT_PRICE_RANGE, FULL_PRICE_RANGE, PRICE_RANGE_PRESETS } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useZapStore } from '@/stores/useZapStore';

interface PriceRangePreset {
  range: number | string;
  tickLower?: number;
  tickUpper?: number;
}

export default function RangePreset({ initialTick }: { initialTick?: { tickLower: number; tickUpper: number } }) {
  const { targetPool, targetPoolPrice, revertPrice } = usePoolStore(['targetPool', 'targetPoolPrice', 'revertPrice']);
  const { targetPositionId } = usePositionStore(['targetPositionId']);
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapStore([
    'tickLower',
    'tickUpper',
    'setTickLower',
    'setTickUpper',
  ]);

  const previousRevertPrice = usePrevious(revertPrice);
  const [lastSelected, setLastSelected] = useState<number | string>('');

  const priceRanges = useMemo(() => {
    if (!targetPool || !targetPoolPrice) return [];

    const category = targetPool.category;
    const priceOptionsForPairCategory =
      PRICE_RANGE_PRESETS[category as keyof typeof PRICE_RANGE_PRESETS] ||
      PRICE_RANGE_PRESETS[POOL_CATEGORY.EXOTIC_PAIR];
    if (!priceOptionsForPairCategory.length) return [];

    const { success: isUniV3, data: pool } = univ3PoolNormalize.safeParse(targetPool);
    if (!isUniV3) return [];

    return priceOptionsForPairCategory
      .map(item => {
        if (item === FULL_PRICE_RANGE)
          return {
            range: item,
            tickLower: pool.minTick,
            tickUpper: pool.maxTick,
          };

        const left = targetPoolPrice * (1 - Number(item));
        const right = targetPoolPrice * (1 + Number(item));

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

        const nearestLowerTick = nearestUsableTick(lower, pool.tickSpacing);
        const nearestUpperTick = nearestUsableTick(upper, pool.tickSpacing);

        let validLowerTick = nearestLowerTick;
        let validUpperTick = nearestUpperTick;
        if (nearestLowerTick === nearestUpperTick) {
          const lowerPriceFromTick = tickToPrice(
            nearestLowerTick,
            pool.token0?.decimals,
            pool.token1?.decimals,
            revertPrice,
          );
          if (Number(lowerPriceFromTick) > targetPoolPrice) {
            validLowerTick = validLowerTick - pool.tickSpacing;
          } else {
            validUpperTick = validLowerTick + pool.tickSpacing;
          }
        }

        return {
          range: item,
          tickLower: validLowerTick,
          tickUpper: validUpperTick,
        };
      })
      .filter(item => !!item) as PriceRangePreset[];
  }, [revertPrice, targetPool, targetPoolPrice]);

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
    if (!targetPool || !priceRanges.length || initialTick || targetPositionId) return;
    if (tickLower === null || tickUpper === null)
      handleSelectPriceRange(
        DEFAULT_PRICE_RANGE[targetPool.category as keyof typeof DEFAULT_PRICE_RANGE] ||
          DEFAULT_PRICE_RANGE[POOL_CATEGORY.EXOTIC_PAIR],
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPool, priceRanges]);

  return (
    <div className="flex gap-[6px] mt-1 mb-3 border border-stroke rounded-md">
      {!targetPool || !targetPoolPrice || !priceRanges.length ? (
        <>
          <div className="w-full py-2 px-0.5 pl-2">
            <Skeleton className="w-full h-4" />
          </div>
          <div className="w-full my-2 px-0.5">
            <Skeleton className="w-full h-4" />
          </div>
          <div className="w-full my-2 px-0.5">
            <Skeleton className="w-full h-4" />
          </div>
          <div className="w-full my-2 px-0.5 pr-2">
            <Skeleton className="w-full h-4" />
          </div>
        </>
      ) : (
        priceRanges.map((item: PriceRangePreset, index: number) => (
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
}
