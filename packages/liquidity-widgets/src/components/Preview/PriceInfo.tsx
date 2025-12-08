import { Trans } from '@lingui/macro';

import { univ3PoolNormalize } from '@kyber/schema';
import { TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { getPriceRangeToShow } from '@/utils';

export default function PriceInfo() {
  const { pool, toggleRevertPrice, poolPrice, revertPrice } = usePoolStore([
    'pool',
    'toggleRevertPrice',
    'poolPrice',
    'revertPrice',
  ]);
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

  if (!isUniV3) return null;

  return (
    <div className="ks-lw-card border border-stroke bg-transparent text-sm">
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <div className="ks-lw-card-title">
            <Trans>Current Price</Trans>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span>1</span>
            <TokenSymbol symbol={!revertPrice ? pool?.token0.symbol || '' : pool?.token1.symbol || ''} maxWidth={100} />
            <span>=</span>
            <span>{formatDisplayNumber(poolPrice, { significantDigits: 8 })}</span>
            <TokenSymbol symbol={!revertPrice ? pool?.token1.symbol || '' : pool?.token0.symbol || ''} maxWidth={100} />
          </div>
        </div>

        <div
          className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
          onClick={toggleRevertPrice}
        >
          <RevertPriceIcon className="cursor-pointer" role="button" />
        </div>
      </div>

      {priceRange && (
        <div className="flex justify-between items-center gap-4 w-full mt-2">
          <div className="ks-lw-card flex flex-col items-center flex-1 w-1/2">
            <div className="ks-lw-card-title">
              <Trans>Min Price</Trans>
            </div>
            <div
              title={priceRange?.minPrice?.toString()}
              className="w-full text-center text-base overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {priceRange?.minPrice}
            </div>
          </div>
          <div className="ks-lw-card flex flex-col items-center flex-1 w-1/2">
            <div className="ks-lw-card-title">
              <Trans>Max Price</Trans>
            </div>
            <div
              title={priceRange?.maxPrice?.toString()}
              className="w-full text-center text-base overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {priceRange?.maxPrice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
