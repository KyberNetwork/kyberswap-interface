import { useEffect, useState } from 'react';

import { DEXES_INFO, Pool, PoolType, ZapRouteDetail } from '@kyber/schema';

import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useOnSuccess({
  pool,
  txHash,
  txStatus,
  positionAmountInfo,
  addedAmountInfo,
  zapInfo,
}: {
  pool: Pool;
  txHash: string;
  txStatus: string;
  positionAmountInfo: {
    amount0: number;
    amount1: number;
    positionAmount0Usd: number;
    positionAmount1Usd: number;
  };
  addedAmountInfo: {
    addedAmount0: number;
    addedAmount1: number;
    addedAmount0Usd: number;
    addedAmount1Usd: number;
  };
  zapInfo: ZapRouteDetail;
}) {
  const { poolType, chainId, positionId, onSuccess } = useWidgetStore([
    'poolType',
    'chainId',
    'positionId',
    'onSuccess',
  ]);
  const { position } = usePositionStore(['position']);

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);
  const { icon: dexLogo } = DEXES_INFO[poolType as PoolType];

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered) return;

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
          amount: positionId !== undefined ? positionAmountInfo.amount0 : addedAmountInfo.addedAmount0,
        },
        token1: {
          address: pool.token1.address,
          symbol: pool.token1.symbol,
          logo: pool.token1.logo || '',
          amount: positionId !== undefined ? positionAmountInfo.amount1 : addedAmountInfo.addedAmount1,
        },
        pool: {
          address: pool.address,
          fee: pool.fee,
        },
        value:
          position !== undefined
            ? addedAmountInfo.addedAmount0Usd +
              positionAmountInfo.positionAmount0Usd +
              addedAmountInfo.addedAmount1Usd +
              positionAmountInfo.positionAmount1Usd
            : +zapInfo.zapDetails.initialAmountUsd,
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
    pool.address,
    pool.fee,
    pool.token0.address,
    pool.token1.address,
    pool.token0.logo,
    pool.token0.symbol,
    pool.token1.logo,
    pool.token1.symbol,
    poolType,
    positionAmountInfo.amount0,
    positionAmountInfo.amount1,
    positionId,
    txHash,
    txStatus,
    zapInfo.zapDetails.initialAmountUsd,
    positionAmountInfo.positionAmount0Usd,
    positionAmountInfo.positionAmount1Usd,
    addedAmountInfo.addedAmount0Usd,
    addedAmountInfo.addedAmount1Usd,
    position,
  ]);
}
