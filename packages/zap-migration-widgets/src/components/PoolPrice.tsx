import { t } from '@lingui/macro';

import { defaultToken } from '@kyber/schema';
import { Skeleton, TokenSymbol } from '@kyber/ui';
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
        <span>{t`Current Price`}</span>
        {!targetPool || !targetPoolPrice ? (
          <Skeleton className="w-[150px] h-3.5" />
        ) : (
          <div className="text-text flex items-center gap-1">
            1{' '}
            {revertPrice ? (
              <TokenSymbol symbol={token1.symbol} maxWidth={80} />
            ) : (
              <TokenSymbol symbol={token0.symbol} maxWidth={80} />
            )}{' '}
            ={formatDisplayNumber(targetPoolPrice, { significantDigits: 8 })}
            {revertPrice ? (
              <TokenSymbol symbol={token0.symbol} maxWidth={80} />
            ) : (
              <TokenSymbol symbol={token1.symbol} maxWidth={80} />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6" onClick={toggleRevertPrice}>
        <RevertPriceIcon className="cursor-pointer" role="button" />
      </div>
    </div>
  );
}
