import { useMemo } from 'react';

import { Skeleton } from '@kyber/ui';
import { divideBigIntToString, formatDisplayNumber } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import RevertPriceIcon from '@/assets/svg/ic_revert_price.svg';
import { univ2PoolNormalize, univ3PoolNormalize } from '@/schema';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { assertUnreachable } from '@/utils';

export function PoolPrice() {
  const { pool, poolType } = useZapOutContext(s => s);

  const { revertPrice, toggleRevertPrice } = useZapOutUserState();

  const price = useMemo(() => {
    if (pool === 'loading') return '--';
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return formatDisplayNumber(tickToPrice(data.tick, data.token0.decimals, data.token1.decimals, revertPrice), {
        significantDigits: 8,
      });
    }

    const { success: isUniV2, data: uniV2Pool } = univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * 10n ** BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * 10n ** BigInt(uniV2Pool.token1.decimals),
        18,
      );
      return formatDisplayNumber(revertPrice ? 1 / +p : p, {
        significantDigits: 8,
      });
    }
    return assertUnreachable(poolType as never, 'poolType is not handled');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, revertPrice]);

  return pool === 'loading' || !price ? (
    <Skeleton className="w-[200px] h-3.5" />
  ) : (
    <div className="rounded-lg flex items-center justify-between flex-wrap border border-stroke px-4 py-3 text-subText text-sm">
      <div className="flex items-center gap-1">
        <span> Current Price</span>
        <div className="text-text">
          1 {revertPrice ? pool.token1.symbol : pool.token0.symbol} = {price}{' '}
          {revertPrice ? pool.token0.symbol : pool.token1.symbol}
        </div>
      </div>

      <div
        className="flex items-center justify-center rounded-full bg-[#ffffff14] w-6 h-6"
        onClick={() => toggleRevertPrice()}
      >
        <RevertPriceIcon className="cursor-pointer" role="button" />
      </div>
    </div>
  );
}
