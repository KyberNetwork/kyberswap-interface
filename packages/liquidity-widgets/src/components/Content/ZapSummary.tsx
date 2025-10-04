import { useMemo, useState } from 'react';

import {
  AddLiquidityAction,
  DEXES_INFO,
  PoolType,
  RemoveLiquidityAction,
  Token,
  ZapAction,
  defaultToken,
} from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';
import { formatTokenAmount, formatWei } from '@kyber/utils/number';

import useSwapPI from '@/hooks/useSwapPI';
import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function ZapSummary() {
  const { chainId, poolType } = useWidgetStore(['chainId', 'poolType']);
  const { zapInfo } = useZapState();
  const { pool } = usePoolStore(['pool']);
  const [expanded, setExpanded] = useState(false);

  const initializing = !pool;

  const { symbol: symbol0 } = initializing ? defaultToken : pool.token0;
  const { symbol: symbol1 } = initializing ? defaultToken : pool.token1;

  const dexNameObj = DEXES_INFO[poolType as PoolType].name;
  const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const onExpand = () => setExpanded(prev => !prev);

  const { swapActions } = useSwapPI();

  const addedLiquidityInfo = useMemo(() => {
    if (!pool) return { addedAmount0: '0', addedAmount1: '0' };
    const data = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.ADD_LIQUIDITY,
    ) as AddLiquidityAction | null;

    const addedAmount0 = formatWei(data?.addLiquidity.token0.amount, pool?.token0?.decimals);
    const addedAmount1 = formatWei(data?.addLiquidity.token1.amount, pool?.token1?.decimals);

    return { addedAmount0, addedAmount1 };
  }, [pool, zapInfo?.zapDetails.actions]);

  const actionRemoveLiq = zapInfo?.zapDetails.actions.find(item => item.type === ZapAction.REMOVE_LIQUIDITY) as
    | RemoveLiquidityAction
    | undefined;

  const { fees } = actionRemoveLiq?.removeLiquidity || {};

  const poolTokens: Token[] = !pool ? [] : [pool.token0, pool.token1];

  const feeToken0 = poolTokens.find(item => item.address.toLowerCase() === fees?.[0]?.address.toLowerCase());
  const feeToken1 = poolTokens.find(item => item.address.toLowerCase() === fees?.[1]?.address.toLowerCase());

  const feeAmount0 = BigInt(fees?.[0]?.amount || 0);
  const feeAmount1 = BigInt(fees?.[1]?.amount || 0);

  const hasFee = feeAmount0 !== 0n || feeAmount1 !== 0n;

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
            <p className="text-subText text-xs italic">The actual Zap Routes could be adjusted with on-chain states</p>
            <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />
            {hasFee && (
              <div className="flex gap-3 items-center mt-3 text-xs">
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">1</div>
                <div className="flex-1 text-subText leading-4">
                  <>
                    Claim fee {feeAmount0 !== 0n ? formatTokenAmount(feeAmount0, feeToken0?.decimals || 18) : ''}{' '}
                    {feeAmount0 !== 0n ? feeToken0?.symbol : ''}{' '}
                    {feeAmount1 !== 0n
                      ? `+ ${formatTokenAmount(feeAmount1, feeToken1?.decimals || 18)} ${feeToken1?.symbol}`
                      : ''}{' '}
                  </>
                </div>
              </div>
            )}
            {swapActions.map((item, index) => (
              <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                  {index + (hasFee ? 2 : 1)}
                </div>
                <div className="flex-1 text-subText leading-4">
                  Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut} {item.tokenOutSymbol} via{' '}
                  <span className="font-medium text-text">{item.pool}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center text-xs mt-3">
              <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                {swapActions.length + (hasFee ? 2 : 1)}
              </div>
              <div className="flex-1 text-subText leading-4">
                Build LP using {addedLiquidityInfo.addedAmount0} {symbol0} and {addedLiquidityInfo.addedAmount1}{' '}
                {symbol1} on <span className="font-medium text-text">{dexName}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
