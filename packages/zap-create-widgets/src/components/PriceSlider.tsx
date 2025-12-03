import { useMemo } from 'react';

import { univ3PoolNormalize } from '@kyber/schema';
import { Skeleton } from '@kyber/ui';

import { UniswapPriceSlider } from '@kyberswap/price-slider';
import '@kyberswap/price-slider/style.css';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';

const PriceSlider = () => {
  const { tickLower, tickUpper, setTickLower, setTickUpper } = useZapState();
  const { pool, revertPrice } = usePoolStore(['pool', 'revertPrice']);

  const poolInfo = useMemo(() => {
    if (!pool) return null;
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (!success) return null;

    return {
      tickSpacing: data.tickSpacing,
      token0Decimals: data.token0.decimals,
      token1Decimals: data.token1.decimals,
      currentTick: data.tick,
    };
  }, [pool]);

  if (!poolInfo) {
    return <Skeleton className="w-full h-[110px] mt-5" />;
  }

  return (
    <UniswapPriceSlider
      pool={poolInfo}
      invertPrice={revertPrice}
      lowerTick={tickLower ?? undefined}
      upperTick={tickUpper ?? undefined}
      setLowerTick={setTickLower}
      setUpperTick={setTickUpper}
      className="mt-5"
    />
  );
};

export default PriceSlider;
