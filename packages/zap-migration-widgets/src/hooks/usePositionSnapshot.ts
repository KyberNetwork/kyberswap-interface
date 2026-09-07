import { useCallback } from 'react';

import { DEXES_INFO, PoolType } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { OnSuccessProps } from '@/types/index';

/**
 * Describes the position the current migration route produces. Consumers read it both when the transaction
 * is submitted and when it succeeds, so the two report identical numbers for the same route.
 */
export default function usePositionSnapshot(): () => OnSuccessProps['position'] | null {
  const { chainId, targetPoolType } = useWidgetStore(['chainId', 'targetPoolType']);
  const { targetPool } = usePoolStore(['targetPool']);
  const { targetPositionId } = usePositionStore(['targetPositionId']);
  const { addedLiquidity, initUsd } = useZapRoute();

  const { icon: dexLogo } = DEXES_INFO[targetPoolType as PoolType] || { icon: '' };

  return useCallback(() => {
    if (!targetPool) return null;

    return {
      positionId: targetPositionId,
      chainId,
      dexLogo,
      token0: {
        address: targetPool.token0.address,
        symbol: targetPool.token0.symbol,
        logo: targetPool.token0.logo || '',
        decimals: targetPool.token0.decimals,
        amount: +formatUnits(addedLiquidity.addedAmount0.toString(), targetPool.token0.decimals || 18),
      },
      token1: {
        address: targetPool.token1.address,
        symbol: targetPool.token1.symbol,
        logo: targetPool.token1.logo || '',
        decimals: targetPool.token1.decimals,
        amount: +formatUnits(addedLiquidity.addedAmount1.toString(), targetPool.token1.decimals || 18),
      },
      pool: {
        address: targetPool.address,
        fee: targetPool.fee,
      },
      value: +initUsd,
      createdAt: Date.now(),
    };
  }, [addedLiquidity, chainId, dexLogo, initUsd, targetPool, targetPositionId]);
}
