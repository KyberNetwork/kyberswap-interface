import { defaultToken } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import RevertPriceIcon from '@/assets/icons/ic_revert_price.svg';
import { usePoolStore } from '@/stores/usePoolStore';

export default function PoolPrice() {
  const { targetPool, targetPoolPrice, revertPrice, toggleRevertPrice } = usePoolStore([
    'targetPool',
    'targetPoolPrice',
    'revertPrice',
    'toggleRevertPrice',
  ]);

  const { token0 = defaultToken, token1 = defaultToken } = targetPool || {};

  return (
    <div className="text-subText text-sm flex items-center gap-1 flex-wrap justify-between">
      <div className="flex items-center gap-1.5">
        <span> Current Price</span>
        {!targetPool || !targetPoolPrice ? (
          <Skeleton className="w-[150px] h-3.5" />
        ) : (
          <div className="text-text">
            1 {revertPrice ? token1.symbol : token0.symbol} ={' '}
            {formatDisplayNumber(targetPoolPrice, { significantDigits: 8 })}{' '}
            {revertPrice ? token0.symbol : token1.symbol}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6" onClick={toggleRevertPrice}>
        <RevertPriceIcon className="cursor-pointer" role="button" />
      </div>
    </div>
  );
}
