import { useMemo } from 'react';

import {
  AddLiquidityAction,
  AggregatorSwapAction,
  DEXES_INFO,
  NETWORKS_INFO,
  PoolSwapAction,
  RemoveLiquidityAction,
  ZapRouteDetail,
} from '@kyber/schema';
import { formatTokenAmount } from '@kyber/utils/number';

import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { formatWei } from '@/utils';

export function MigrationSummary({ route }: { route: ZapRouteDetail }) {
  const { chainId } = useWidgetStore(['chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);

  const swaps = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_AGGREGATOR_SWAP',
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      item => item.type === 'ACTION_TYPE_POOL_SWAP',
    ) as PoolSwapAction | null;

    if (!sourcePool || !targetPool) return [];
    const tokens = [
      sourcePool.token0,
      sourcePool.token1,
      targetPool.token0,
      targetPool.token1,
      NETWORKS_INFO[chainId].wrappedToken,
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: 'KyberSwap',
        };
      }) || [];

    const dexNameObj = DEXES_INFO[targetPool.poolType].name;
    const dexName = typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map(item => {
        const tokenIn = tokens.find(token => token.address.toLowerCase() === item.tokenIn.address.toLowerCase());
        const tokenOut = tokens.find(token => token.address.toLowerCase() === item.tokenOut.address.toLowerCase());
        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${dexName} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [chainId, sourcePool, targetPool, route?.zapDetails.actions]);

  if (!sourcePool || !targetPool) return null;
  const actionRemove = route.zapDetails.actions.find(action => action.type === 'ACTION_TYPE_REMOVE_LIQUIDITY') as
    | RemoveLiquidityAction
    | undefined;
  const amount0Removed =
    actionRemove?.removeLiquidity.tokens.find(
      tk => tk.address.toLowerCase() === sourcePool.token0.address.toLowerCase(),
    )?.amount || '0';
  const amount1Removed =
    actionRemove?.removeLiquidity.tokens.find(
      tk => tk.address.toLowerCase() === sourcePool.token1.address.toLowerCase(),
    )?.amount || '0';

  const addliquidityAction = route.zapDetails.actions.find(action => action.type === 'ACTION_TYPE_ADD_LIQUIDITY') as
    | AddLiquidityAction
    | undefined;

  const addedAmount0 = BigInt(addliquidityAction?.addLiquidity.token0.amount || 0);
  const addedAmount1 = BigInt(addliquidityAction?.addLiquidity.token1.amount || 0);
  const dexFrom =
    typeof DEXES_INFO[sourcePool.poolType].name === 'string'
      ? DEXES_INFO[sourcePool.poolType].name
      : DEXES_INFO[sourcePool.poolType].name[chainId];

  const dexTo =
    typeof DEXES_INFO[targetPool.poolType].name === 'string'
      ? DEXES_INFO[targetPool.poolType].name
      : DEXES_INFO[targetPool.poolType].name[chainId];

  return (
    <div className="border border-stroke rounded-md px-4 py-3 mt-8">
      <div className="text-sm">Migration Summary</div>
      <div className="h-[1px] bg-stroke w-full mt-2" />

      <div className="flex items-center text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">1</div>
        <div className="text-xs">
          Remove {formatTokenAmount(BigInt(amount0Removed), sourcePool.token0.decimals, 8)} {sourcePool.token0.symbol}{' '}
          and {formatTokenAmount(BigInt(amount1Removed), sourcePool.token1.decimals, 8)} {sourcePool.token1.symbol} from{' '}
          <span className="text-text">{dexFrom as string}</span>
        </div>
      </div>

      <div className="flex items-start text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">2</div>
        <div className="text-xs">
          {swaps.map((item, index) => (
            <div className="flex-1 text-subText leading-4" key={index}>
              Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut} {item.tokenOutSymbol} via{' '}
              <span className="font-medium text-text">{item.pool}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center text-subText gap-2 mt-3">
        <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">3</div>
        <div className="text-xs">
          Add{' '}
          {addedAmount0 !== 0n &&
            `${formatTokenAmount(addedAmount0, targetPool.token0.decimals, 8)} ${targetPool.token0.symbol} and`}{' '}
          {addedAmount0 !== 0n &&
            `${formatTokenAmount(addedAmount1, targetPool.token1.decimals, 8)} ${targetPool.token1.symbol}`}{' '}
          into <span className="text-text">{dexTo as string}</span> in the selected fee pool
        </div>
      </div>
    </div>
  );
}
