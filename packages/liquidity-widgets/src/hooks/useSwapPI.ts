import { defaultToken } from '@kyber/schema';
import { getSwapPriceImpactFromActions, parseSwapActions } from '@kyber/utils';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useSwapPi() {
  const { chainId, poolType, wrappedNativeToken, nativeToken } = useWidgetStore([
    'chainId',
    'poolType',
    'wrappedNativeToken',
    'nativeToken',
  ]);
  const { pool } = usePoolStore(['pool']);
  const { zapInfo, tokensIn } = useZapState();

  const initializing = pool === 'loading';
  const { token0, token1 } = initializing ? { token0: defaultToken, token1: defaultToken } : pool;

  const tokensToCheck = [...tokensIn, token0, token1, wrappedNativeToken, nativeToken];
  const swapActions = parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId });
  const swapPriceImpact = getSwapPriceImpactFromActions(swapActions);

  return { swapActions, swapPriceImpact };
}
