import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { AddLiquidityAction, DEXES_INFO, PoolType, ZapAction, defaultToken } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';
import { parseSwapActions } from '@kyber/utils';
import { formatWei } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function ZapSummary() {
  const { nativeToken, wrappedNativeToken, chainId, poolType } = useWidgetStore(
    useShallow(s => ({
      nativeToken: s.nativeToken,
      wrappedNativeToken: s.wrappedNativeToken,
      chainId: s.chainId,
      poolType: s.poolType,
    })),
  );
  const { zapInfo, tokensIn } = useZapState();
  const pool = usePoolStore(s => s.pool);
  const [expanded, setExpanded] = useState(false);

  const initializing = pool === 'loading';

  const { symbol: symbol0 } = initializing ? defaultToken : pool.token0;
  const { symbol: symbol1 } = initializing ? defaultToken : pool.token1;
  const { token0 = defaultToken, token1 = defaultToken } = !initializing ? pool : {};

  const dexNameObj = DEXES_INFO[poolType as PoolType].name;
  const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const onExpand = () => setExpanded(prev => !prev);

  const tokensToCheck = useMemo(
    () => [...tokensIn, token0, token1, wrappedNativeToken, nativeToken],
    [tokensIn, token0, token1, wrappedNativeToken, nativeToken],
  );
  const swapActions = useMemo(
    () => parseSwapActions({ zapInfo, tokens: tokensToCheck, poolType, chainId }),
    [chainId, poolType, tokensToCheck, zapInfo],
  );

  const addedLiquidityInfo = useMemo(() => {
    if (pool === 'loading') return { addedAmount0: '0', addedAmount1: '0' };
    const data = zapInfo?.zapDetails.actions.find(
      item => item.type === ZapAction.ADD_LIQUIDITY,
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
            <p className="text-subText text-xs italic">The actual Zap Routes could be adjusted with on-chain states</p>

            <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />

            {swapActions.map((item, index) => (
              <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                  {index + 1}
                </div>
                <div className="flex-1 text-subText leading-4">
                  Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut} {item.tokenOutSymbol} via{' '}
                  <span className="font-medium text-text">{item.pool}</span>
                </div>
              </div>
            ))}

            <div className="flex gap-3 items-center text-xs mt-3">
              <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                {swapActions.length + 1}
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
