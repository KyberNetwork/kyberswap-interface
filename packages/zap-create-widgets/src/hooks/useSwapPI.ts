import { ZapRouteDetail, defaultToken } from '@kyber/schema';
import { parseSwapActions } from '@kyber/utils';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useSwapPI(zapInfo?: ZapRouteDetail) {
  const { chainId, poolType, wrappedNativeToken, nativeToken } = useWidgetStore([
    'chainId',
    'poolType',
    'wrappedNativeToken',
    'nativeToken',
  ]);
  const { pool } = usePoolStore(['pool']);
  const { zapInfo: zapCurrentInfo, tokensIn } = useZapState();

  const zapInfoToUse = zapInfo || zapCurrentInfo;

  const initializing = !pool;
  const { token0, token1 } = initializing ? { token0: defaultToken, token1: defaultToken } : pool;

  const tokensToCheck = [...tokensIn, token0, token1, wrappedNativeToken, nativeToken];
  const swapActions = parseSwapActions({
    zapInfo: zapInfoToUse,
    tokens: tokensToCheck,
    poolType,
    chainId,
    poolAddress: pool?.address,
  });

  return { swapActions };
}
