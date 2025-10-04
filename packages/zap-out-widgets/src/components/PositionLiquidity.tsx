import { Skeleton, TokenLogo, TokenSymbol } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';

import { useZapOutContext } from '@/stores';

export default function PositionLiquidity() {
  const { position, pool } = useZapOutContext(s => s);

  const loading = position === 'loading' || pool === 'loading';

  const { amount0, amount1 } = position && position !== 'loading' ? position : { amount0: 0n, amount1: 0n };

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-subText text-sm">
      <div>Your Position Liquidity</div>

      <div className="flex justify-between mt-4 items-start">
        {loading ? (
          <>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <TokenLogo src={pool.token0.logo || ''} alt={pool.token0.symbol} />
              <div className="text-text text-base">{formatTokenAmount(amount0, pool.token0.decimals, 8)}</div>

              <TokenSymbol symbol={pool.token0.symbol} />
            </div>
            <div className="text-xs text-subText text-right">
              {formatDisplayNumber((pool.token0.price || 0) * Number(toRawString(amount0, pool.token0.decimals)), {
                style: 'currency',
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between mt-2 items-start">
        {loading ? (
          <>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-14" />
          </>
        ) : (
          <>
            <div className="flex items-center text-base gap-1 text-text">
              <TokenLogo src={pool.token1.logo || ''} alt={pool.token1.symbol} />
              <div className="text-text text-base">{formatTokenAmount(amount1, pool.token1.decimals, 8)}</div>
              <TokenSymbol symbol={pool.token1.symbol} />
            </div>
            <div className="text-xs text-subText text-right">
              {formatDisplayNumber((pool.token1.price || 0) * Number(toRawString(amount1, pool.token1.decimals)), {
                style: 'currency',
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
