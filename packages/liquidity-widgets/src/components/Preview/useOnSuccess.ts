import { useEffect, useState } from 'react';

import { DEXES_INFO, PoolType } from '@kyber/schema';
import { formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useOnSuccess({ txHash, txStatus }: { txHash: string; txStatus: string }) {
  const { poolType, chainId, positionId, onSuccess } = useWidgetStore([
    'poolType',
    'chainId',
    'positionId',
    'onSuccess',
  ]);
  const { pool } = usePoolStore(['pool']);
  const { position } = usePositionStore(['position']);
  const { route } = useZapState();
  const { initUsd, addedLiquidity } = useZapRoute();

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);
  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered || !route || !pool) return;

    setOnSuccessTriggered(true);

    onSuccess({
      txHash,
      position: {
        positionId,
        chainId,
        poolType,
        dexLogo,
        token0: {
          address: pool.token0.address,
          symbol: pool.token0.symbol,
          logo: pool.token0.logo || '',
          amount: +formatTokenAmount(
            position ? position.amount0 : addedLiquidity.addedAmount0,
            pool.token0.decimals || 18,
          ),
        },
        token1: {
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          logo: pool.token1.logo || '',
          amount: +formatTokenAmount(
            position ? position.amount1 : addedLiquidity.addedAmount1,
            pool.token1.decimals || 18,
          ),
        },
        pool: {
          address: pool.address,
          fee: pool.fee,
        },
        value: position
          ? addedLiquidity.addedValue0 +
            +formatTokenAmount(position.amount0, pool.token0.decimals || 18) * (pool.token0.price || 0) +
            addedLiquidity.addedValue1 +
            +formatTokenAmount(position.amount1, pool.token1.decimals || 18) * (pool.token1.price || 0)
          : +initUsd,
        createdAt: Date.now(),
      },
    });
  }, [
    addedLiquidity.addedAmount0,
    addedLiquidity.addedAmount1,
    addedLiquidity.addedValue0,
    addedLiquidity.addedValue1,
    chainId,
    dexLogo,
    initUsd,
    onSuccess,
    onSuccessTriggered,
    pool,
    poolType,
    position,
    positionId,
    route,
    txHash,
    txStatus,
  ]);
}
