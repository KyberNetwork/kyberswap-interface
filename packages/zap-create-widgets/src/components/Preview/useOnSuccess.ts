import { useEffect, useState } from 'react';

import { DEXES_INFO, Pool, PoolType, ZapRouteDetail } from '@kyber/schema';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useOnSuccess({
  pool,
  txHash,
  txStatus,
  addedAmountInfo,
  zapInfo,
}: {
  pool: Pool;
  txHash: string;
  txStatus: string;
  addedAmountInfo: {
    addedAmount0: number;
    addedAmount1: number;
    addedAmount0Usd: number;
    addedAmount1Usd: number;
  };
  zapInfo: ZapRouteDetail;
}) {
  const { poolType, chainId, onSuccess } = useWidgetStore(['poolType', 'chainId', 'onSuccess']);

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);
  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered) return;

    setOnSuccessTriggered(true);

    onSuccess({
      txHash,
      position: {
        chainId,
        poolType,
        dexLogo,
        token0: {
          address: pool.token0.address,
          symbol: pool.token0.symbol,
          logo: pool.token0.logo || '',
          amount: addedAmountInfo.addedAmount0,
        },
        token1: {
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          logo: pool.token1.logo || '',
          amount: addedAmountInfo.addedAmount1,
        },
        value: +zapInfo.zapDetails.initialAmountUsd,
        createdAt: Date.now(),
      },
    });
  }, [
    addedAmountInfo.addedAmount0,
    addedAmountInfo.addedAmount1,
    chainId,
    dexLogo,
    onSuccess,
    onSuccessTriggered,
    pool.token0.address,
    pool.token1.address,
    pool.token0.logo,
    pool.token0.symbol,
    pool.token1.logo,
    pool.token1.symbol,
    poolType,
    txHash,
    txStatus,
    zapInfo.zapDetails.initialAmountUsd,
    addedAmountInfo.addedAmount0Usd,
    addedAmountInfo.addedAmount1Usd,
  ]);
}
