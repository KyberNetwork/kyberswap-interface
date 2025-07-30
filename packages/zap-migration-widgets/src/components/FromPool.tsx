import { Skeleton } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import { Image } from '@/components/Image';
import { UniV2Pool, UniV2Position, UniV3Pool, UniV3Position, univ2Dexes, univ3Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';

export const LiquiditySkeleton = () => (
  <>
    <Skeleton className="w-16 h-5" />
    <Skeleton className="w-20 h-4" />
  </>
);

export function FromPool({ className }: { className?: string }) {
  const { pools } = usePoolsStore();
  const { fromPosition: position } = usePositionStore();

  let amount0 = 0n;
  let amount1 = 0n;
  const isUniv3 = pools !== 'loading' && univ3Dexes.includes(pools[0].dex);
  const isUniv2 = pools !== 'loading' && univ2Dexes.includes(pools[0].dex);

  if (position !== 'loading' && pools !== 'loading') {
    if (isUniv3) {
      const p = position as UniV3Position;
      const pool0 = pools[0] as UniV3Pool;
      ({ amount0, amount1 } = getPositionAmounts(
        pool0.tick,
        p.tickLower,
        p.tickUpper,
        BigInt(pool0.sqrtPriceX96),
        p.liquidity,
      ));
    } else if (isUniv2) {
      const p = position as UniV2Position;
      const pool0 = pools[0] as UniV2Pool;

      amount0 = (BigInt(p.liquidity) * BigInt(pool0.reserves[0])) / BigInt(p.totalSupply);
      amount1 = (BigInt(p.liquidity) * BigInt(pool0.reserves[1])) / BigInt(p.totalSupply);
    } else {
      throw new Error('Invalid dex');
    }
  }

  return (
    <div className={cn('flex-1 border border-stroke rounded-md px-4 py-3', className)}>
      <div className="text-subText text-sm">Your Current Position Liquidity</div>
      <div className="mt-2 flex items-center justify-between">
        {pools === 'loading' || position === 'loading' ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image src={pools[0].token0.logo || ''} alt={pools[0].token0.symbol} className="w-4 h-4" />
              <span className="text-base">{formatTokenAmount(amount0, pools[0].token0.decimals, 10)}</span>
              <span className="text-base">{pools[0].token0.symbol}</span>
            </div>
            <div className="text-subText text-xs flex flex-col items-end">
              {formatDisplayNumber(
                (pools[0].token0.price || 0) * Number(toRawString(amount0, pools[0].token0.decimals)),
                { style: 'currency' },
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {pools === 'loading' || position === 'loading' ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image src={pools[0].token1.logo || ''} alt={pools[0].token1.symbol} className="w-4 h-4" />
              <span className="text-base">{formatTokenAmount(amount1, pools[0].token1.decimals, 10)}</span>
              <span className="text-base">{pools[0].token1.symbol}</span>
            </div>
            <div className="text-subText text-xs flex flex-col items-end">
              {formatDisplayNumber(
                (pools[0].token1.price || 0) * Number(toRawString(amount1, pools[0].token1.decimals)),
                { style: 'currency' },
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
