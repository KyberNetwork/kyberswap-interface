import { useMemo } from 'react';

import { getZapImpact } from '@kyber/utils';
import { formatUnits } from '@kyber/utils/crypto';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@/constants';
import { ChainId } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { AggregatorSwapAction, PoolSwapAction, useZapStateStore } from '@/stores/useZapStateStore';

export const useSwapPI = (chainId: ChainId) => {
  const { route } = useZapStateStore();
  const { pools } = usePoolsStore();

  const tokensIn = useMemo(
    () => (pools === 'loading' ? [] : [pools[0].token0, pools[0].token1, pools[1].token0, pools[1].token1]),
    [pools],
  );

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_AGGREGATOR_SWAP',
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_POOL_SWAP',
    ) as PoolSwapAction | null;

    if (pools === 'loading') return [];

    const tokens = [
      ...tokensIn,
      NETWORKS_INFO[chainId].wrappedToken,
      {
        name: 'ETH',
        address: NATIVE_TOKEN_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
      },
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
        const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn,
          amountOut,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());

        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());

        const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn,
          amountOut,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [route?.zapDetails.actions, pools, tokensIn, chainId]);

  const zapPiRes = getZapImpact(route?.zapDetails.priceImpact, route?.zapDetails.suggestedSlippage || 0);

  return { swapPi, zapPiRes };
};
