import { useCallback } from 'react';

import { DEXES_INFO, PoolType } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps } from '@/types/index';

/**
 * Describes the position the current zap route produces. Consumers read it both when the transaction is
 * submitted and when it succeeds, so the two report identical numbers for the same route.
 */
export default function usePositionSnapshot(): () => OnSuccessProps['position'] | null {
  const { poolType, chainId, positionId } = useWidgetStore(['poolType', 'chainId', 'positionId']);
  const { pool } = usePoolStore(['pool']);
  const { position } = usePositionStore(['position']);
  const { initUsd, addedLiquidity } = useZapRoute();

  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];

  return useCallback(() => {
    if (!pool) return null;

    return {
      positionId,
      chainId,
      dexLogo,
      token0: {
        address: pool.token0.address,
        symbol: pool.token0.symbol,
        logo: pool.token0.logo || '',
        decimals: pool.token0.decimals,
        amount: +formatUnits(
          position ? position.amount0.toString() : addedLiquidity.addedAmount0.toString(),
          pool.token0.decimals || 18,
        ),
      },
      token1: {
        address: pool.token1.address,
        symbol: pool.token1.symbol,
        logo: pool.token1.logo || '',
        decimals: pool.token1.decimals,
        amount: +formatUnits(
          position ? position.amount1.toString() : addedLiquidity.addedAmount1.toString(),
          pool.token1.decimals || 18,
        ),
      },
      pool: {
        address: pool.address,
        fee: pool.fee,
      },
      value: position
        ? addedLiquidity.addedValue0 +
          +formatUnits(position.amount0.toString(), pool.token0.decimals || 18) * (pool.token0.price || 0) +
          addedLiquidity.addedValue1 +
          +formatUnits(position.amount1.toString(), pool.token1.decimals || 18) * (pool.token1.price || 0)
        : +initUsd,
      createdAt: Date.now(),
    };
  }, [addedLiquidity, chainId, dexLogo, initUsd, pool, position, positionId]);
}
