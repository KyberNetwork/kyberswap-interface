import { useMemo } from 'react';

import { defaultToken } from '@kyber/schema';
import { parseZapInfo } from '@kyber/utils';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';

export default function useEstimated() {
  const { zapInfo } = useZapState();
  const { pool } = usePoolStore(['pool']);

  return useMemo(() => {
    const initializing = !pool;
    const { token0, token1 } = initializing ? { token0: defaultToken, token1: defaultToken } : pool;
    const {
      refundInfo,
      addedAmountInfo,
      initUsd,
      suggestedSlippage,
      isHighRemainingAmount,
      feeInfo,
      positionAmountInfo,
      zapImpact,
    } = parseZapInfo({ zapInfo, token0, token1 });

    return {
      initializing,
      token0,
      token1,
      zapInfo,
      positionAmountInfo,
      addedAmountInfo,
      isHighRemainingAmount,
      refundInfo,
      initUsd,
      suggestedSlippage,
      zapImpact,
      feeInfo,
    };
  }, [pool, zapInfo]);
}
