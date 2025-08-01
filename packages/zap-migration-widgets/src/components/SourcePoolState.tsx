import { useEffect, useState } from 'react';

import { Skeleton, Slider, TokenLogo } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount, toRawString } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';
import { getPositionAmounts } from '@kyber/utils/uniswapv3';

import { PoolFee } from '@/components/PoolFee';
import { UniV2Pool, UniV2Position, UniV3Pool, UniV3Position, univ2Dexes, univ3Dexes } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useZapStateStore } from '@/stores/useZapStateStore';

export function SourcePoolState() {
  const { pools } = usePoolsStore();
  const { fromPosition: position } = usePositionStore();

  const { liquidityOut, setLiquidityOut } = useZapStateStore();

  const [percent, setPercent] = useState(100);

  useEffect(() => {
    if (position === 'loading') return;
    setLiquidityOut((BigInt(position.liquidity.toString()) * BigInt(percent)) / BigInt(100));
  }, [percent, position, setLiquidityOut]);

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
        liquidityOut,
      ));
    } else if (isUniv2) {
      const p = position as UniV2Position;
      const pool0 = pools[0] as UniV2Pool;
      amount0 = (liquidityOut * BigInt(pool0.reserves[0])) / BigInt(p.totalSupply);
      amount1 = (liquidityOut * BigInt(pool0.reserves[1])) / BigInt(p.totalSupply);
    } else {
      throw new Error('Invalid dex');
    }
  }

  return (
    <div className="flex-1">
      <div className="border border-stroke rounded-md px-4 py-3 mb-4">
        <span className="text-subText text-sm">Liquidity to Remove</span>
        <div className="flex justify-between items-center mt-2 py-1.5">
          <div className="font-medium text-lg">{percent}%</div>
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
          {pools === 'loading' ? (
            <>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1">
                <TokenLogo src={pools[0].token0.logo || ''} />
                {formatTokenAmount(amount0, pools[0].token0.decimals, 8)} {pools[0].token0.symbol}
              </div>
              <div className="text-xs text-subText">
                {formatDisplayNumber(
                  (pools[0].token0.price || 0) * Number(toRawString(amount0, pools[0].token0.decimals)),
                  { style: 'currency' },
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 items-center">
          {pools === 'loading' ? (
            <>
              <Skeleton className="h-5 w-20 mt-2" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <div className="flex items-center text-base gap-1">
                <TokenLogo src={pools[0].token1.logo || ''} />
                {formatTokenAmount(amount1, pools[0].token1.decimals, 8)} {pools[0].token1.symbol}
              </div>
              <div className="text-xs text-subText">
                {formatDisplayNumber(
                  (pools[0].token1.price || 0) * Number(toRawString(amount1, pools[0].token1.decimals)),
                  { style: 'currency' },
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <PoolFee />
    </div>
  );
}
