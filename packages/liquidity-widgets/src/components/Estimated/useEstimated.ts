import { useMemo } from 'react';

import { defaultToken } from '@kyber/schema';
import { getSwapPriceImpactFromActions, parseSwapActions, parseZapInfo } from '@kyber/utils';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useEstimated() {
  const { chainId, poolType, wrappedNativeToken, nativeToken } = useWidgetStore([
    'chainId',
    'poolType',
    'wrappedNativeToken',
    'nativeToken',
  ]);
  const { zapInfo, tokensIn } = useZapState();
  const { pool } = usePoolStore(['pool']);
  const { position } = usePositionStore(['position']);

  return useMemo(() => {
    const initializing = pool === 'loading';
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
    } = parseZapInfo({ zapInfo, token0, token1, position });

    const tokensToCheck = [...tokensIn, token0, token1, wrappedNativeToken, nativeToken];
    const swapActions = parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId });
    const swapPriceImpact = getSwapPriceImpactFromActions(swapActions);

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
      swapActions,
      swapPriceImpact,
      zapImpact,
      feeInfo,
    };
  }, [chainId, nativeToken, pool, poolType, position, tokensIn, wrappedNativeToken, zapInfo]);
}
