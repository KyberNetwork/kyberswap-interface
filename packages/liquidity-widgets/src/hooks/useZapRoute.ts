import { useMemo } from 'react';

import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { parseZapRoute } from '@kyber/utils/liquidity/zap';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function useZapRoute() {
  const { chainId, poolType } = useWidgetStore(['chainId', 'poolType']);
  const { pool } = usePoolStore(['pool']);
  const { route, tokensIn } = useZapState();

  const tokens = useMemo(() => {
    if (!tokensIn.length) return [];
    const pair = !pool ? [] : [pool.token0, pool.token1];

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;
    const nativeToken = {
      name: 'ETH',
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
    };

    return [...tokensIn, ...pair, wrappedNativeToken, nativeToken];
  }, [pool, chainId, tokensIn]);

  const token0Address = pool?.token0.address || '';
  const token1Address = pool?.token1.address || '';
  const poolAddress = pool?.address || '';
  const dexNameObj = poolType ? DEXES_INFO[poolType].name : '';
  const dexName = poolType ? (typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]) : '';

  const { initUsd, suggestedSlippage, zapImpact, earnedFee, addedLiquidity, swapActions, zapFee, refund } =
    parseZapRoute({
      route: route || null,
      token0Address,
      token1Address,
      tokens,
      dexName,
      poolAddress,
    });

  return { initUsd, suggestedSlippage, zapImpact, earnedFee, addedLiquidity, swapActions, zapFee, refund };
}
