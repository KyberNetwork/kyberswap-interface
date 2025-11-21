import { useState } from 'react';

import { Trans } from '@lingui/macro';

import { DEXES_INFO, NETWORKS_INFO, PoolType, defaultToken } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';
import { formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function ZapSummary() {
  const { chainId, poolType } = useWidgetStore(['chainId', 'poolType']);
  const { pool } = usePoolStore(['pool']);
  const { earnedFee, addedLiquidity, swapActions } = useZapRoute();
  const [expanded, setExpanded] = useState(false);

  const initializing = !pool;

  const { symbol: symbol0, decimals: decimals0 } = initializing ? defaultToken : pool.token0;
  const { symbol: symbol1, decimals: decimals1 } = initializing ? defaultToken : pool.token1;

  const dexNameObj = DEXES_INFO[poolType as PoolType].name;
  const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId];

  const onExpand = () => setExpanded(prev => !prev);

  const hasFee = earnedFee.earnedFee0 !== 0n || earnedFee.earnedFee1 !== 0n;

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
            <Trans>Zap Summary</Trans>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 border border-stroke !border-t-0 rounded-b-md">
            <p className="text-subText text-xs italic">
              <Trans>The actual Zap Routes could be adjusted with on-chain states</Trans>
            </p>
            <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />
            {hasFee && (
              <div className="flex gap-3 items-center mt-3 text-xs">
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">1</div>
                <div className="flex-1 text-subText leading-4">
                  <Trans>
                    Claim fee
                    {earnedFee.earnedFee0 !== 0n
                      ? ` ${formatTokenAmount(earnedFee.earnedFee0, decimals0 || 18)} ${symbol0}`
                      : ''}
                    {earnedFee.earnedFee1 !== 0n
                      ? ` + ${formatTokenAmount(earnedFee.earnedFee1, decimals1 || 18)} ${symbol1}`
                      : ''}
                  </Trans>
                </div>
              </div>
            )}
            {swapActions.map((item, index) => (
              <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                  {index + (hasFee ? 2 : 1)}
                </div>
                <div className="flex-1 text-subText leading-4">
                  <Trans>
                    Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut} {item.tokenOutSymbol} via{' '}
                    {item.poolAddress ? (
                      <a
                        href={`${NETWORKS_INFO[chainId].scanLink}/address/${item.poolAddress}`}
                        className="font-medium text-text"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.pool}
                      </a>
                    ) : (
                      <span className="font-medium text-text">{item.pool}</span>
                    )}
                  </Trans>
                </div>
              </div>
            ))}
            <div className="flex gap-3 items-center text-xs mt-3">
              <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                {swapActions.length + (hasFee ? 2 : 1)}
              </div>
              <div className="flex-1 text-subText leading-4">
                <Trans>
                  Build LP using {formatTokenAmount(addedLiquidity.addedAmount0, decimals0 || 18)} {symbol0} and{' '}
                  {formatTokenAmount(addedLiquidity.addedAmount1, decimals1 || 18)} {symbol1} on{' '}
                  <span className="font-medium text-text">{dexName}</span>
                  {symbol1} on <span className="font-medium text-text">{dexName}</span>
                </Trans>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
