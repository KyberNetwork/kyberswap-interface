import { useMemo } from 'react';

import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { parseZapRoute } from '@kyber/utils/liquidity/zap';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function useZapRoute() {
  const { poolType, chainId, pool } = useZapOutContext(s => s);
  const { route, tokenOut } = useZapOutUserState();

  const tokens = useMemo(() => {
    if (!tokenOut) return [];
    const pair = !pool ? [] : [pool.token0, pool.token1];

    const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;
    const nativeToken = {
      name: 'ETH',
      address: NATIVE_TOKEN_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
    };

    return [...pair, tokenOut, wrappedNativeToken, nativeToken];
  }, [pool, chainId, tokenOut]);

  const token0Address = pool?.token0.address || '';
  const token1Address = pool?.token1.address || '';
  const poolAddress = pool?.address || '';
  const dexNameObj = poolType ? DEXES_INFO[poolType].name : '';
  const dexName = poolType ? (typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]) : '';

  const {
    removeLiquidity,
    earnedFee,
    refund,
    suggestedSlippage,
    finalAmountUsd,
    gasUsd,
    zapFee,
    zapImpact,
    swapActions,
  } = parseZapRoute(route || null, token0Address, token1Address, tokens, dexName, poolAddress);

  return {
    swapActions,
    refund,
    removeLiquidity,
    suggestedSlippage,
    zapImpact,
    finalAmountUsd,
    zapFee,
    gasUsd,
    earnedFee,
  };
}
