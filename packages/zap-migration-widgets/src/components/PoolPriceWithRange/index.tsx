import { univ2Types } from '@kyber/schema';
import { cn } from '@kyber/utils/tailwind-helpers';

import PoolPrice from '@/components/PoolPrice';
import PriceRange from '@/components/PoolPriceWithRange/PriceRange';
import useSourceRange from '@/components/PoolPriceWithRange/useSourceRange';
import usePriceRange from '@/components/RangeInput/usePriceRange';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export enum RangeType {
  Source,
  Target,
}

export default function PoolPriceWithRange({ type, showPrice }: { type: RangeType; showPrice?: boolean }) {
  const { targetPoolType } = useWidgetStore(['targetPoolType']);
  const { targetPoolPrice } = usePoolStore(['targetPoolPrice']);
  const { minPrice, maxPrice, isMinTick: targetIsMinTick, isMaxTick: targetIsMaxTick } = usePriceRange();
  const {
    minPrice: sourceMinPrice,
    maxPrice: sourceMaxPrice,
    isMinTick: sourceIsMinTick,
    isMaxTick: sourceIsMaxTick,
  } = useSourceRange();

  const currentPrice = targetPoolPrice || 0;
  const isUniV2 = univ2Types.includes(targetPoolType as any);
  const isMinTick = type === RangeType.Target ? targetIsMinTick : sourceIsMinTick;
  const isMaxTick = type === RangeType.Target ? targetIsMaxTick : sourceIsMaxTick;

  const parsedMinPrice = +((type === RangeType.Target ? minPrice : sourceMinPrice) || 0);
  const parsedMaxPrice = +((type === RangeType.Target ? maxPrice : sourceMaxPrice) || 0);
  const isOutRange = isUniV2
    ? false
    : currentPrice < parsedMinPrice || (currentPrice > parsedMaxPrice && parsedMaxPrice !== 0);

  return (
    <div className="border border-stroke rounded-md px-4 py-3 flex flex-col">
      {showPrice ? <PoolPrice /> : null}
      <div className={cn('pb-3', showPrice ? 'pt-10' : 'pt-8')}>
        <PriceRange
          currentPrice={currentPrice}
          minPrice={parsedMinPrice}
          maxPrice={parsedMaxPrice}
          isMinTick={isMinTick}
          isMaxTick={isMaxTick}
          isOutRange={isOutRange}
          isUniV2={isUniV2}
        />
      </div>
    </div>
  );
}
