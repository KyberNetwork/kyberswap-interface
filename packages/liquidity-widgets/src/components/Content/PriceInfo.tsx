import { defaultToken } from '@kyber/schema';
import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function PriceInfo() {
  const { theme } = useWidgetStore(['theme']);
  const { pool, poolPrice, revertPrice, toggleRevertPrice } = usePoolStore([
    'pool',
    'poolPrice',
    'revertPrice',
    'toggleRevertPrice',
  ]);

  const initializing = pool === 'loading';

  const token0 = initializing ? defaultToken : revertPrice ? pool.token1 : pool.token0;
  const token1 = initializing ? defaultToken : revertPrice ? pool.token0 : pool.token1;

  return (
    <>
      <div className="rounded-md border border-stroke py-3 px-4 mt-[6px]">
        <div className="flex justify-between">
          <div className="flex items-center justify-start gap-1 text-sm flex-wrap">
            <span className="text-subText">Current price</span>
            {initializing ? (
              <Skeleton className="w-20 h-5" />
            ) : (
              <>
                <span>1</span>
                <TokenSymbol symbol={token0.symbol} maxWidth={100} />
                <span>=</span>
                <span>{formatDisplayNumber(poolPrice, { significantDigits: 8 })}</span>

                <TokenSymbol symbol={token1.symbol} maxWidth={100} />
              </>
            )}
          </div>

          <div
            className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
            onClick={toggleRevertPrice}
          >
            <RevertPriceIcon className="cursor-pointer" role="button" />
          </div>
        </div>
      </div>

      {poolPrice === null && !initializing && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <span className="italic text-text">Unable to get the market price. Please be cautious!</span>
        </div>
      )}
    </>
  );
}
