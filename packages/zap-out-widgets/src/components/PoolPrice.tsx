import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { useZapOutContext } from '@/stores';

export function PoolPrice() {
  const { pool, revertPrice, toggleRevertPrice, poolPrice } = useZapOutContext(s => s);

  return !pool || !poolPrice ? (
    <Skeleton className="w-[200px] h-3.5" />
  ) : (
    <div className="rounded-lg flex items-center justify-between flex-wrap border border-stroke px-4 py-3 text-subText text-sm">
      <div className="flex items-center gap-1">
        <span> Current Price</span>
        <div className="text-text flex items-center gap-1">
          1 <TokenSymbol symbol={revertPrice ? pool.token1.symbol : pool.token0.symbol} maxWidth={80} /> ={' '}
          {formatDisplayNumber(poolPrice, { significantDigits: 8 })}
          <TokenSymbol symbol={revertPrice ? pool.token0.symbol : pool.token1.symbol} maxWidth={80} />
        </div>
      </div>

      <div
        className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
        onClick={() => toggleRevertPrice()}
      >
        <RevertPriceIcon className="cursor-pointer" role="button" />
      </div>
    </div>
  );
}
