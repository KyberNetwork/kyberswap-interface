import { useEffect, useState } from 'react';

import { DEXES_INFO, PoolType } from '@kyber/schema';
import { formatUnits } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useOnSuccess({ txHash, txStatus }: { txHash: string; txStatus: string }) {
  const { chainId, targetPoolType, onSuccess } = useWidgetStore(['chainId', 'targetPoolType', 'onSuccess']);
  const { targetPool } = usePoolStore(['targetPool']);
  const { targetPositionId } = usePositionStore(['targetPositionId']);
  const { addedLiquidity, initUsd } = useZapRoute();

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);
  const poolType = targetPoolType as PoolType;
  const { icon: dexLogo } = DEXES_INFO[poolType] || { icon: '' };

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered || !targetPool) return;

    setOnSuccessTriggered(true);

    onSuccess({
      txHash,
      position: {
        positionId: targetPositionId,
        chainId,
        poolType,
        dexLogo,
        token0: {
          address: targetPool.token0.address,
          symbol: targetPool.token0.symbol,
          logo: targetPool.token0.logo || '',
          amount: +formatUnits(addedLiquidity.addedAmount0.toString(), targetPool.token0.decimals || 18),
        },
        token1: {
          address: targetPool.token1.address,
          symbol: targetPool.token1.symbol,
          logo: targetPool.token1.logo || '',
          amount: +formatUnits(addedLiquidity.addedAmount1.toString(), targetPool.token1.decimals || 18),
        },
        pool: {
          address: targetPool.address,
          fee: targetPool.fee,
        },
        value: +initUsd,
        createdAt: Date.now(),
      },
    });
  }, [
    addedLiquidity.addedAmount0,
    addedLiquidity.addedAmount1,
    chainId,
    dexLogo,
    initUsd,
    onSuccess,
    onSuccessTriggered,
    poolType,
    targetPool,
    targetPositionId,
    txHash,
    txStatus,
  ]);
}
