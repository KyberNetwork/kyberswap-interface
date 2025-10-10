import { useRef } from 'react';

import { univ2PoolNormalize } from '@kyber/schema';
import { Skeleton, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export const PoolFee = () => {
  const { route } = useZapOutUserState();
  const { pool } = useZapOutContext(s => s);
  const { success: isUniv2 } = univ2PoolNormalize.safeParse(pool);
  const { earnedFee } = useZapRoute();
  const { earnedFee0, earnedFee1 } = earnedFee;

  const feeAmount0Ref = useRef(earnedFee0);
  if (route) feeAmount0Ref.current = earnedFee0;

  const feeAmount1Ref = useRef(earnedFee1);
  if (route) feeAmount1Ref.current = earnedFee1;

  if (isUniv2) return null;

  return (
    <div className="rounded-lg px-4 py-3 border border-stroke text-sm text-subText flex items-start justify-between">
      <div>Fees to Claim</div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-end items-center gap-2">
          {!pool ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                {formatTokenAmount(feeAmount0Ref.current, pool.token0.decimals, 8)}{' '}
                <TokenSymbol symbol={pool.token0.symbol} maxWidth={120} />
              </div>
              <div className="text-xs text-subText">
                {formatDisplayNumber(
                  (pool.token0.price || 0) * Number(toRawString(feeAmount0Ref.current, pool.token0.decimals)),
                  { style: 'currency' },
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end items-center gap-2">
          {!pool ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                {formatTokenAmount(feeAmount1Ref.current, pool.token1.decimals, 8)}{' '}
                <TokenSymbol symbol={pool.token1.symbol} maxWidth={120} />
              </div>
              <div className="text-xs text-subText">
                {formatDisplayNumber(
                  (pool.token1.price || 0) * Number(toRawString(feeAmount1Ref.current, pool.token1.decimals)),
                  { style: 'currency' },
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
