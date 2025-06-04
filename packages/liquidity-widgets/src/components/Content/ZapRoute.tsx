import { useMemo, useState } from 'react';

import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';

import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ZapAction,
} from '@/types/zapRoute';
import { useZapState } from '@/hooks/useZapInState';
import { useWidgetContext } from '@/stores';
import { formatWei } from '@/utils';

export default function ZapRoute() {
  const { zapInfo, tokensIn } = useZapState();
  const { pool, poolType, chainId } = useWidgetContext((s) => s);
  const [expanded, setExpanded] = useState(false);

  const defaultToken = {
    decimals: undefined,
    address: '',
    logo: '',
    symbol: '',
  };
  const { symbol: symbol0 } = pool === 'loading' ? defaultToken : pool.token0;
  const { symbol: symbol1 } = pool === 'loading' ? defaultToken : pool.token1;

  const dexNameObj = DEXES_INFO[poolType].name;
  const dexName = typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const onExpand = () => setExpanded((prev) => !prev);

  const swapInfo = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    if (pool === 'loading') return [];
    const tokens = [
      ...tokensIn,
      pool.token0,
      pool.token1,
      NETWORKS_INFO[chainId].wrappedToken,
      {
        name: 'ETH',
        address: NATIVE_TOKEN_ADDRESS,
        symbol: 'ETH',
        decimals: 18,
      },
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) => token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) => token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: 'KyberSwap',
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) => token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) => token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || '--',
          tokenOutSymbol: tokenOut?.symbol || '--',
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${dexName} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [chainId, dexName, pool, tokensIn, zapInfo?.zapDetails.actions]);

  const addedLiquidityInfo = useMemo(() => {
    if (pool === 'loading') return { addedAmount0: '0', addedAmount1: '0' };
    const data = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.ADD_LIQUIDITY
    ) as AddLiquidityAction | null;

    const addedAmount0 = formatWei(data?.addLiquidity.token0.amount, pool?.token0?.decimals);
    const addedAmount1 = formatWei(data?.addLiquidity.token1.amount, pool?.token1?.decimals);

    return { addedAmount0, addedAmount1 };
  }, [pool, zapInfo?.zapDetails.actions]);

  return (
    <>
      <Accordion type="single" collapsible className="w-full mt-4" value={expanded ? 'item-1' : ''}>
        <AccordionItem value="item-1">
          <AccordionTrigger
            className={`px-4 py-3 text-sm border border-stroke text-text rounded-md ${
              expanded ? '!rounded-b-none !border-b-0 !pb-1' : ''
            }`}
            onClick={onExpand}
          >
            Zap Summary
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 border border-stroke !border-t-0 rounded-b-md">
            <p className="text-subText text-xs italic">
              The actual Zap Routes could be adjusted with on-chain states
            </p>

            <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />

            {swapInfo.map((item, index) => (
              <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                  {index + 1}
                </div>
                <div className="flex-1 text-subText leading-4">
                  Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut}{' '}
                  {item.tokenOutSymbol} via{' '}
                  <span className="font-medium text-text">{item.pool}</span>
                </div>
              </div>
            ))}

            <div className="flex gap-3 items-center text-xs mt-3">
              <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                {swapInfo.length + 1}
              </div>
              <div className="flex-1 text-subText leading-4">
                Build LP using {addedLiquidityInfo.addedAmount0} {symbol0} and{' '}
                {addedLiquidityInfo.addedAmount1} {symbol1} on{' '}
                <span className="font-medium text-text">{dexName}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
