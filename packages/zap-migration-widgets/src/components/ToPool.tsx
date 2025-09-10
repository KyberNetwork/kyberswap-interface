import { Skeleton, TokenLogo } from '@kyber/ui';
import { formatUnits } from '@kyber/utils/crypto';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import { LiquiditySkeleton } from '@/components/FromPool';
import useZapRoute from '@/hooks/use-zap-route';
import { UniV2Pool, UniV3Pool, UniV3Position, univ2Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useZapStateStore } from '@/stores/useZapStateStore';

export function ToPool({ className }: { className?: string }) {
  const { pools } = usePoolsStore();
  const { toPosition } = usePositionStore();
  const { fetchingRoute, route } = useZapStateStore();

  const { addedLiquidity } = useZapRoute(route || undefined);

  const targetPool = pools === 'loading' ? 'loading' : pools[1];
  const isTargetUniV2 = targetPool !== 'loading' && univ2Dexes.includes(targetPool.dex);

  let amount0 = 0n;
  let amount1 = 0n;

  if (toPosition && toPosition !== 'loading' && targetPool !== 'loading') {
    if (isTargetUniV2) {
      const pool = targetPool as UniV2Pool;
      amount0 = (BigInt(toPosition.liquidity) * BigInt(pool.reserves[0])) / BigInt(pool.totalSupply || 0n);
      amount1 = (BigInt(toPosition.liquidity) * BigInt(pool.reserves[1])) / BigInt(pool.totalSupply || 0n);
    } else {
      const pool = targetPool as UniV3Pool;
      const position = toPosition as UniV3Position;
      ({ amount0, amount1 } = getPositionAmounts(
        pool.tick,
        position.tickLower,
        position.tickUpper,
        BigInt(pool.sqrtPriceX96),
        BigInt(position.liquidity),
      ));
    }
  }

  const totalAmount0 = BigInt(addedLiquidity.addedAmount0) + amount0;
  const totalAmount1 = BigInt(addedLiquidity.addedAmount1) + amount1;

  const referenceToken0Price =
    targetPool !== 'loading' && addedLiquidity.addedAmount0 !== '0'
      ? addedLiquidity.addedValue0 / +formatUnits(addedLiquidity.addedAmount0, targetPool.token0.decimals)
      : 0;
  const referenceToken1Price =
    targetPool !== 'loading' && addedLiquidity.addedAmount1 !== '0'
      ? addedLiquidity.addedValue1 / +formatUnits(addedLiquidity.addedAmount1, targetPool.token1.decimals)
      : 0;

  const totalValue0 =
    targetPool !== 'loading'
      ? addedLiquidity.addedValue0 + referenceToken0Price * +toRawString(amount0, targetPool.token0.decimals)
      : 0;

  const totalValue1 =
    targetPool !== 'loading'
      ? addedLiquidity.addedValue1 + referenceToken1Price * +toRawString(amount1, targetPool.token1.decimals)
      : 0;

  return (
    <div className={cn('flex-1 border border-stroke rounded-md px-4 py-3', className)}>
      <div className="text-subText text-sm">Est. Updated Position Liquidity</div>
      <div className="mt-2 flex items-center justify-between">
        {targetPool === 'loading' ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <TokenLogo src={targetPool.token0.logo || ''} alt={targetPool.token0.symbol} />
              <span className="text-base">{formatTokenAmount(totalAmount0, targetPool.token0.decimals, 10)}</span>
              <span className="text-base">{targetPool.token0.symbol}</span>
            </div>

            {fetchingRoute ? (
              <div className="flex flex-col items-end">
                <Skeleton className="w-20 h-4" />
              </div>
            ) : (
              <div className="text-xs flex flex-col items-end text-subText">
                ~{formatDisplayNumber(totalValue0, { style: 'currency' })}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {targetPool === 'loading' ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <TokenLogo src={targetPool.token1.logo || ''} alt={targetPool.token1.symbol} />
              <span className="text-base">{formatTokenAmount(totalAmount1, targetPool.token1.decimals, 10)}</span>
              <span className="text-base">{targetPool.token1.symbol}</span>
            </div>

            {fetchingRoute ? (
              <div className="flex flex-col items-end">
                <Skeleton className="w-20 h-4" />
              </div>
            ) : (
              <div className="text-xs text-subText flex flex-col items-end">
                ~{formatDisplayNumber(totalValue1, { style: 'currency' })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
