import { useMemo } from 'react';

import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { parseZapRoute } from '@kyber/utils/liquidity/zap';

import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export default function useZapRoute() {
  const { chainId, targetPoolType } = useWidgetStore(['chainId', 'targetPoolType']);
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

  const sourceToken0Address = sourcePool?.token0.address || '';
  const sourceToken1Address = sourcePool?.token1.address || '';
  const dexNameObj = targetPoolType ? DEXES_INFO[targetPoolType].name : '';
  const dexName = targetPoolType ? (typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]) : '';

  const {
    addedLiquidity,
    removeLiquidity,
    earnedFee,
    refund,
    suggestedSlippage,
    initUsd,
    zapFee,
    zapImpact,
    swapActions,
  } = parseZapRoute(route || null, sourceToken0Address, sourceToken1Address, tokens, dexName);

  return {
    addedLiquidity,
    removeLiquidity,
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
