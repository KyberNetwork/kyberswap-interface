import { useMemo } from 'react';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, getDexName } from '@kyber/schema';
import { parseZapRoute } from '@kyber/utils/liquidity/zap';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function useZapRoute() {
  const { poolType, chainId, pool, dexId } = useZapOutContext(s => s);
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
  const dexName = poolType ? getDexName(poolType, chainId, dexId) : '';

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
  } = parseZapRoute({ route: route || null, token0Address, token1Address, tokens, dexName, poolAddress });

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
