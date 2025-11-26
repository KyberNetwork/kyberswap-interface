import { useState } from 'react';

import { Trans } from '@lingui/macro';

import { NETWORKS_INFO } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@kyber/ui';
import { formatDisplayNumber, formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function ZapSummary() {
  const { pool, chainId } = useZapOutContext(s => s);
  const { tokenOut, mode } = useZapOutUserState();
  const { swapActions, refund, removeLiquidity, earnedFee } = useZapRoute();
  const { removedAmount0, removedAmount1 } = removeLiquidity;
  const { earnedFee0, earnedFee1 } = earnedFee;

  const [expanded, setExpanded] = useState(false);
  const onExpand = () => setExpanded(prev => !prev);

  if (mode == 'withdrawOnly') {
    return null;
  }

  const token0 = pool?.token0;
  const token1 = pool?.token1;

  return (
    <Accordion type="single" collapsible className="w-full" value={expanded ? 'item-1' : ''}>
      <AccordionItem value="item-1">
        <AccordionTrigger
          className={`px-4 !py-3 text-sm border border-stroke text-text rounded-md ${
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

          <div className="flex gap-2 mt-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">1</div>
            <div className="flex-1 text-subText text-xs">
              <Trans>
                Remove {removedAmount0 !== 0n ? formatTokenAmount(removedAmount0, token0?.decimals || 18) : ''}{' '}
                {token0?.symbol}
                {removedAmount1 !== 0n
                  ? `+ ${formatTokenAmount(removedAmount1, token1?.decimals || 18)} ${token1?.symbol}`
                  : ''}{' '}
              </Trans>
              {earnedFee0 !== 0n || earnedFee1 !== 0n ? (
                <Trans>
                  and claim fee {earnedFee0 !== 0n ? formatTokenAmount(earnedFee0, token0?.decimals || 18) : ''}{' '}
                  {earnedFee0 !== 0n ? token0?.symbol : ''}{' '}
                  {earnedFee1 !== 0n
                    ? `+ ${formatTokenAmount(earnedFee1, token1?.decimals || 18)} ${token1?.symbol}`
                    : ''}{' '}
                </Trans>
              ) : (
                ''
              )}
            </div>
          </div>

          {swapActions.length > 0 && (
            <div className="flex gap-2 mt-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
                2
              </div>
              <div className="text-xs text-subText flex-1">
                {swapActions.map((item, index) => (
                  <div className="flex gap-3 items-center text-xs" key={index}>
                    <div className="flex-1 text-subText leading-4">
                      <Trans>
                        <span>
                          Swap {formatDisplayNumber(item.amountIn)} {item.tokenInSymbol} for{' '}
                          {formatDisplayNumber(item.amountOut)}{' '}
                        </span>
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
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3 items-center">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
              {swapActions.length > 0 ? 3 : 2}
            </div>
            <div className="text-xs text-subText">
              <Trans>
                Receive {refund.refunds[0]?.amount || 0} {tokenOut?.symbol}
              </Trans>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
