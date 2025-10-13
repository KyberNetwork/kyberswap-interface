import { useState } from 'react';

import { DEXES_INFO, NETWORKS_INFO } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';
import { formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export function MigrationSummary() {
  const { chainId, sourcePoolType, targetPoolType } = useWidgetStore(['chainId', 'sourcePoolType', 'targetPoolType']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { swapActions, addedLiquidity, removeLiquidity } = useZapRoute();

  const [expanded, setExpanded] = useState(false);
  const onExpand = () => setExpanded(prev => !prev);

  if (!sourcePool || !targetPool || !sourcePoolType || !targetPoolType) return null;

  const sourceDexName =
    typeof DEXES_INFO[sourcePoolType].name === 'string'
      ? DEXES_INFO[sourcePoolType].name
      : DEXES_INFO[sourcePoolType].name[chainId];

  const targetDexName =
    typeof DEXES_INFO[targetPoolType].name === 'string'
      ? DEXES_INFO[targetPoolType].name
      : DEXES_INFO[targetPoolType].name[chainId];

  return (
    <Accordion type="single" collapsible className="w-full" value={expanded ? 'item-1' : ''}>
      <AccordionItem value="item-1">
        <AccordionTrigger
          className={`px-4 py-3 text-sm border border-stroke text-text rounded-md ${
            expanded ? '!rounded-b-none !border-b-0 !pb-1' : ''
          }`}
          onClick={onExpand}
        >
          Migration Summary
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0 border border-stroke !border-t-0 rounded-b-md">
          <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />

          <div className="flex items-start text-subText gap-2 mt-3">
            <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">1</div>
            <div className="flex-1 text-xs">
              Remove {formatTokenAmount(removeLiquidity.removedAmount0, sourcePool.token0.decimals, 8)}{' '}
              {sourcePool.token0.symbol} and{' '}
              {formatTokenAmount(removeLiquidity.removedAmount1, sourcePool.token1.decimals, 8)}{' '}
              {sourcePool.token1.symbol} from <span className="text-text">{sourceDexName as string}</span>
            </div>
          </div>

          <div className="flex items-start text-subText gap-2 mt-3">
            <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">2</div>
            <div className="flex-1 text-xs">
              {swapActions.map((item, index) => (
                <div className="flex-1 text-subText leading-4" key={index}>
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
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start text-subText gap-2 mt-3">
            <div className="rounded-full w-4 h-4 bg-layer2 text-xs text-center">3</div>
            <div className="flex-1 text-xs">
              Add{' '}
              {`${formatTokenAmount(addedLiquidity.addedAmount0, targetPool.token0.decimals, 8)} ${targetPool.token0.symbol} and`}{' '}
              {`${formatTokenAmount(addedLiquidity.addedAmount1, targetPool.token1.decimals, 8)} ${targetPool.token1.symbol}`}{' '}
              into <span className="text-text">{targetDexName as string}</span> in the selected fee pool
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
