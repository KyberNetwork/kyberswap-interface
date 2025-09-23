import { useRef } from 'react';

import { Skeleton } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';

import { univ2PoolNormalize } from '@/schema';
import { useZapOutContext } from '@/stores';
import { RemoveLiquidityAction, useZapOutUserState } from '@/stores/state';

export const PoolFee = () => {
  const { route } = useZapOutUserState();
  const { pool } = useZapOutContext(s => s);
  const { success: isUniv2 } = univ2PoolNormalize.safeParse(pool);

  const actionRemoveLiq = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') as
    | RemoveLiquidityAction
    | undefined;

  const { fees } = actionRemoveLiq?.removeLiquidity || {};

  const fee0 = pool !== 'loading' && fees?.find(f => f.address.toLowerCase() === pool.token0.address.toLowerCase());
  const fee1 = pool !== 'loading' && fees?.find(f => f.address.toLowerCase() === pool.token1.address.toLowerCase());

  const feeAmount0 = BigInt(fee0 ? fee0.amount : 0);
  const feeAmount1 = BigInt(fee1 ? fee1.amount : 0);

  const feeAmount0Ref = useRef(feeAmount0);
  if (route) feeAmount0Ref.current = feeAmount0;

  const feeAmount1Ref = useRef(feeAmount1);
  if (route) feeAmount1Ref.current = feeAmount1;

  if (isUniv2) return null;

  return (
    <div className="rounded-lg px-4 py-3 border border-stroke text-sm text-subText flex items-start justify-between">
      <div>Fees to Claim</div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-end items-center gap-2">
          {pool === 'loading' ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                {formatTokenAmount(feeAmount0Ref.current, pool.token0.decimals, 8)} {pool.token0.symbol}
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
          {pool === 'loading' ? (
            <Skeleton className="h-5 w-20" />
          ) : (
            <>
              <div className="flex items-center text-base gap-1 text-text">
                {formatTokenAmount(feeAmount1Ref.current, pool.token1.decimals, 8)} {pool.token1.symbol}
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
