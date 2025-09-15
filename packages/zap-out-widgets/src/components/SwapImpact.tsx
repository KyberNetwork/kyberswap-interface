import { useMemo } from 'react';

import { getZapImpact } from '@kyber/utils';
import { formatUnits } from '@kyber/utils/crypto';

import { NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@/constants';
import { PoolSwapAction } from '@/hooks/types/zapInTypes';
import { useZapOutContext } from '@/stores';
import { AggregatorSwapAction, useZapOutUserState } from '@/stores/state';

export const useSwapPI = () => {
  const { route, tokenOut } = useZapOutUserState();
  const { pool, chainId } = useZapOutContext(s => s);

  const tokensIn = useMemo(
    () => (pool === 'loading' || !tokenOut ? [] : [pool.token0, pool.token1, pool.token0, pool.token1, tokenOut]),
    [pool, tokenOut],
  );

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_AGGREGATOR_SWAP',
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_POOL_SWAP',
    ) as PoolSwapAction | null;

    if (pool === 'loading') return [];

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
  }, [route?.zapDetails.actions, pool, tokensIn, chainId]);

  const zapPiRes = getZapImpact(route?.zapDetails.priceImpact, route?.zapDetails.suggestedSlippage || 0);

  return { swapPi, zapPiRes };
};
