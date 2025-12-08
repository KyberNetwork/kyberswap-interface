import { useMemo } from 'react';

import { UniV3Pool, univ3PoolNormalize } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';
import { nearestUsableTick, priceToClosestTick } from '@kyber/utils/uniswapv3';

import { PriceRangeSlider } from '@kyberswap/price-range-slider';
import '@kyberswap/price-range-slider/style.css';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';

const PriceSlider = () => {
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapState();
  const { pool, poolPrice, revertPrice } = usePoolStore(['pool', 'poolPrice', 'revertPrice']);

  const currentTick = useMemo(() => {
    if (!pool || !(pool as UniV3Pool).tickSpacing || poolPrice === null) return 0;
    return nearestUsableTick(
      priceToClosestTick(poolPrice.toString(), pool.token0.decimals, pool.token1.decimals, revertPrice) || 0,
      (pool as UniV3Pool).tickSpacing,
    );
  }, [pool, poolPrice, revertPrice]);

  const poolInfo = useMemo(() => {
    if (!pool) return null;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (!success) return null;

    return {
      tickSpacing: data.tickSpacing,
      token0Decimals: data.token0.decimals,
      token1Decimals: data.token1.decimals,
      currentTick,
    };
  }, [pool, currentTick]);

  if (!poolInfo) {
    return <Skeleton className="w-full h-[110px] mt-5" />;
  }

  return (
    <div className="mt-4">
      <PriceRangeSlider
        pool={poolInfo}
        invertPrice={revertPrice}
        lowerTick={tickLower ?? undefined}
        upperTick={tickUpper ?? undefined}
        setLowerTick={setTickLower}
        setUpperTick={setTickUpper}
      />
    </div>
  );
};

export default PriceSlider;
