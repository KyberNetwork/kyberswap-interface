import { t } from '@lingui/macro';

import { MouseoverTooltip, Skeleton } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

import IconCurrentPrice from '@/assets/icons/ic_position_current_price.svg';

export default function PriceRange({
  currentPrice,
  minPrice,
  maxPrice,
  isOutRange,
  isMinTick,
  isMaxTick,
  isUniV2,
}: {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  isOutRange: boolean;
  isMinTick: boolean;
  isMaxTick: boolean;
  isUniV2: boolean;
}) {
  if (!currentPrice) return <Skeleton className="h-1 rounded w-full" />;
  return (
    <div className={cn('relative h-1 rounded w-full', isOutRange ? 'bg-warning-300' : 'bg-[#505050]')}>
      {isOutRange && (
        <CurrentPriceIndicator lower={currentPrice < minPrice} color="text-warning" currentPrice={currentPrice} />
      )}
      <div
        className={cn(
          'absolute flex justify-between items-center h-full rounded',
          isMinTick ? (isMaxTick ? 'w-full' : 'w-[80%]') : isMaxTick ? 'w-[80%]' : 'w-[60%]',
          isMinTick ? 'left-0' : 'left-[20%]',
          isOutRange ? 'bg-[#737373]' : 'bg-primary',
        )}
      >
        {!isOutRange && (
          <CurrentPriceIndicator
            color="text-primary"
            left={isUniV2 ? 0.2 : (currentPrice - minPrice) / (maxPrice - minPrice)}
            currentPrice={currentPrice}
          />
        )}
        <div className={cn('h-4 w-1 rounded-[4px] relative', isOutRange ? 'bg-[#737373]' : 'bg-primary')}>
          <div className="absolute top-[-20px] translate-x-[-42%] text-xs text-text max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            {isMinTick ? '0' : formatDisplayNumber(minPrice, { significantDigits: 8 })}
          </div>
        </div>
        <div className={cn('h-4 w-1 rounded-[4px] relative', isOutRange ? 'bg-[#737373]' : 'bg-primary')}>
          <div className="absolute top-[-20px] translate-x-[-42%] text-xs text-text max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            {isMaxTick ? '∞' : formatDisplayNumber(maxPrice, { significantDigits: 8 })}
          </div>
        </div>
      </div>
    </div>
  );
}

const priceIndicatorWidth = 4;
const currentPriceIndicatorWidth = 7.53;

const CurrentPriceIndicator = ({
  lower,
  color,
  left,
  currentPrice,
}: {
  lower?: boolean;
  color: string;
  left?: number;
  currentPrice: number;
}) => {
  // Position the handle from the parent width via CSS calc so it is correct on the first paint
  // (the percentage maps onto the parent's measured width at layout time). The pixel offset recenters
  // the icon and accounts for the lower/upper bound indicators (priceIndicatorWidth each).
  const offset =
    left !== undefined ? left * priceIndicatorWidth * -2 + priceIndicatorWidth - currentPriceIndicatorWidth / 2 : 0;

  return (
    <div
      className={cn('absolute top-[-5px]', lower ? 'left-[6%]' : 'left-[86%]')}
      style={{
        left: left !== undefined ? `calc(${left * 100}% ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)` : undefined,
      }}
    >
      <MouseoverTooltip
        text={t`Current Price: ${formatDisplayNumber(currentPrice, { significantDigits: 8 })}`}
        placement="bottom"
        width="max-content"
      >
        <IconCurrentPrice className={color} />
      </MouseoverTooltip>
    </div>
  );
};
