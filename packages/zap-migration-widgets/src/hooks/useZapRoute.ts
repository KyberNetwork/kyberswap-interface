import { useMemo } from 'react';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, ZapRouteDetail } from '@kyber/schema';

import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';
import { parseZapRoute } from '@/utils';

export default function useZapRoute(customRoute?: ZapRouteDetail) {
  const { chainId } = useWidgetStore(['chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { route, fetchingRoute } = useZapStore(['route', 'fetchingRoute']);

  const tokens = useMemo(() => {
    const sourceTokens = !sourcePool ? [] : [sourcePool.token0, sourcePool.token1];
    const targetTokens = !targetPool ? [] : [targetPool.token0, targetPool.token1];

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;
    const nativeToken = {
      name: 'ETH',
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
    };

    return [...sourceTokens, ...targetTokens, wrappedNativeToken, nativeToken];
  }, [sourcePool, targetPool, chainId]);

  const { addedLiquidity, earnedFee, refund, suggestedSlippage, initUsd, zapFee, zapImpact, swapActions } =
    parseZapRoute(customRoute || route || null, tokens);

  return {
    addedLiquidity,
    earnedFee,
    suggestedSlippage,
    refund,
    initUsd,
    zapFee,
    zapImpact,
    swapActions,
    fetchingRoute,
  };
}
