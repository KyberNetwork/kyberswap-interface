import { Trans } from '@lingui/macro';

import { Pool, univ3PoolNormalize } from '@kyber/schema';

import PriceInfoContent from '@/components/Content/PriceInfo';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { getPriceRangeToShow } from '@/utils';

export default function PriceInfo({ pool }: { pool: Pool }) {
  const { revertPrice } = usePoolStore(['revertPrice']);
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
      <PriceInfoContent flatten />

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
