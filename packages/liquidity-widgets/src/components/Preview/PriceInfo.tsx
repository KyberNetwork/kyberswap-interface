import { Pool, univ3PoolNormalize } from '@kyber/schema';
import { formatDisplayNumber } from '@kyber/utils/number';

import SwitchIcon from '@/assets/svg/switch.svg';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { getPriceRangeToShow } from '@/utils';

export default function PriceInfo({ pool }: { pool: Pool }) {
  const { toggleRevertPrice, poolPrice, revertPrice } = usePoolStore(['toggleRevertPrice', 'poolPrice', 'revertPrice']);
  const { success: isUniV3 } = univ3PoolNormalize.safeParse(pool);
  const { tickLower, tickUpper, minPrice, maxPrice } = useZapState();

  const priceRange = getPriceRangeToShow({
    pool,
    revertPrice,
    tickLower,
    tickUpper,
    minPrice,
    maxPrice,
  });

  const quote = !revertPrice
    ? `${pool?.token1.symbol} per ${pool?.token0.symbol}`
    : `${pool?.token0.symbol} per ${pool?.token1.symbol}`;

  return isUniV3 ? (
    <div className="ks-lw-card border border-stroke bg-transparent mt-4 text-sm">
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="ks-lw-card-title">Current pool price</div>
        <div className="flex items-center gap-1 text-sm">
          <span>{formatDisplayNumber(poolPrice, { significantDigits: 6 })}</span>
          <span>{quote}</span>
          <SwitchIcon className="cursor-pointer" onClick={() => toggleRevertPrice()} role="button" />
        </div>
      </div>

      {priceRange && (
        <div className="flex justify-between items-center gap-4 w-full mt-2">
          <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
            <div className="ks-lw-card-title">Min Price</div>
            <div
              title={priceRange?.minPrice?.toString()}
              className="overflow-hidden text-ellipsis whitespace-nowrap w-full text-center"
            >
              {priceRange?.minPrice}
            </div>
            <div className="ks-lw-card-title">
              <span>{quote}</span>
            </div>
          </div>
          <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
            <div className="ks-lw-card-title">Max Price</div>
            <div
              title={priceRange?.maxPrice?.toString()}
              className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {priceRange?.maxPrice}
            </div>
            <div className="ks-lw-card-title">
              <span>{quote}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
}
