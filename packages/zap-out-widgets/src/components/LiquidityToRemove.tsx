import { useEffect, useState } from 'react';

import {
  RemoveLiquidityAction,
  UniV2Position,
  UniV3Position,
  univ2PoolNormalize,
  univ3PoolNormalize,
} from '@kyber/schema';
import { Skeleton, Slider, TokenLogo } from '@kyber/ui';
import { assertUnreachable } from '@kyber/utils';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function LiquidityToRemove() {
  const { position, pool, poolType } = useZapOutContext(s => s);
  const [percent, setPercent] = useState(100);
  const loading = !position || !pool;

  const { liquidityOut, setLiquidityOut, route } = useZapOutUserState();

  useEffect(() => {
    if (!position) return;
    setLiquidityOut((BigInt(position.liquidity) * BigInt(percent)) / BigInt(100));
  }, [percent, position, setLiquidityOut]);

  let amount0 = 0n;
  let amount1 = 0n;
  if (!loading) {
    const { success: isUniv3, data: univ3Pool } = univ3PoolNormalize.safeParse(pool);

    const { success: isUniv2, data: univ2Pool } = univ2PoolNormalize.safeParse(pool);

    if (isUniv3) {
      ({ amount0, amount1 } = getPositionAmounts(
        univ3Pool.tick,
        (position as UniV3Position).tickLower,
        (position as UniV3Position).tickUpper,
        BigInt(univ3Pool.sqrtPriceX96),
        liquidityOut,
      ));
    } else if (isUniv2) {
      amount0 = (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[0])) / (position as UniV2Position).totalSupply;
      amount1 = (BigInt(liquidityOut) * BigInt(univ2Pool.reserves[1])) / (position as UniV2Position).totalSupply;
    } else assertUnreachable(poolType as never, `${poolType} is not handled`);
  }

  const actionRemoveLiq = route?.zapDetails.actions.find(item => item.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') as
    | RemoveLiquidityAction
    | undefined;
  const { fees } = actionRemoveLiq?.removeLiquidity || {};

  const fee0 = pool !== null && fees?.find(f => f.address.toLowerCase() === pool.token0.address.toLowerCase());
  const fee1 = pool !== null && fees?.find(f => f.address.toLowerCase() === pool.token1.address.toLowerCase());

  const feeAmount0 = BigInt(fee0 ? fee0.amount : 0);
  const feeAmount1 = BigInt(fee1 ? fee1.amount : 0);

  const amount0ToRemove = amount0 + feeAmount0;
  const amount1ToRemove = amount1 + feeAmount1;

  return (
    <div className="rounded-lg px-4 py-3 border border-stroke text-sm text-subText">
      <div>Liquidity To Remove</div>
      <div className="flex justify-between items-center mt-2 py-1.5">
        <div className="font-medium text-lg text-text">{percent}%</div>
        <div className="flex gap-2">
          {[25, 50, 75, 100].map(item => (
            <button
              key={item}
              className={cn(
                'w-10 h-6 rounded-full flex items-center justify-center border text-xs font-medium',
                item === percent
                  ? 'bg-primary-20 text-primary border-primary'
                  : 'bg-transparent border-stroke  text-subText',
              )}
              onClick={() => setPercent(item)}
            >
              {item === 100 ? 'Max' : `${item}%`}
            </button>
          ))}
        </div>
      </div>
      <Slider
        value={[percent]}
        max={100}
        step={1}
        className="mt-3"
        onValueChange={v => {
          setPercent(v[0]);
        }}
      />

      <div className="flex justify-between mt-4 items-center">
        {loading ? (
          <>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <TokenLogo src={pool.token0.logo || ''} />
              {formatTokenAmount(amount0ToRemove, pool.token0.decimals, 8)} {pool.token0.symbol}
            </div>
            <div className="text-xs text-subText">
              {formatDisplayNumber(
                (pool.token0.price || 0) * Number(toRawString(amount0ToRemove, pool.token0.decimals)),
                {
                  style: 'currency',
                },
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex justify-between mt-2 items-center">
        {loading ? (
          <>
            <Skeleton className="h-5 w-20 mt-2" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <TokenLogo src={pool.token1.logo || ''} />
              {formatTokenAmount(amount1ToRemove, pool.token1.decimals, 8)} {pool.token1.symbol}
            </div>
            <div className="text-xs text-subText">
              {formatDisplayNumber(
                (pool.token1.price || 0) * Number(toRawString(amount1ToRemove, pool.token1.decimals)),
                {
                  style: 'currency',
                },
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
