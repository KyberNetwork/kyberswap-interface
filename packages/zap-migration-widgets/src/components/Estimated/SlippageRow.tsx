import { useState } from 'react';

import { t } from '@lingui/macro';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, MouseoverTooltip, Skeleton } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import SlippageInput from '@/components/Setting/SlippageInput';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';

const SlippageRow = () => {
  const { suggestedSlippage } = useZapRoute();
  const { slippage } = useZapStore(['slippage']);
  const [slippageOpen, setSlippageOpen] = useState(false);

  const isHighSlippage = suggestedSlippage > 0 ? slippage && slippage > 2 * suggestedSlippage : false;
  const isLowSlippage = suggestedSlippage > 0 ? slippage && slippage < suggestedSlippage / 2 : false;
  const isSlippageWarning = isHighSlippage || isLowSlippage;

  return (
    <div className="flex first-line:text-sm">
      <Accordion type="single" collapsible className="w-full" value={slippageOpen ? 'item-1' : undefined}>
        <AccordionItem value="item-1">
          <AccordionTrigger
            enableHighlight={!slippageOpen && suggestedSlippage > 0 && slippage !== suggestedSlippage}
            onClick={e => {
              e.preventDefault();
              setSlippageOpen(!slippageOpen);
            }}
          >
            <div className="flex items-center justify-between w-full">
              <MouseoverTooltip
                text={t`Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!`}
                width="220px"
              >
                <div
                  className={cn(
                    'text-subText text-xs border-b border-dotted border-subText',
                    isSlippageWarning ? 'text-warning border-warning' : '',
                  )}
                >
                  {t`Max Slippage`}
                </div>
              </MouseoverTooltip>
              {slippage ? (
                <div className={cn('mr-1.5 text-sm', isSlippageWarning ? 'text-warning' : 'text-text')}>
                  {((slippage * 100) / 10_000).toFixed(2)}%
                </div>
              ) : (
                <Skeleton className="w-10 h-3 mr-1.5" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <SlippageInput
              className="bg-black border border-icon-300"
              inputClassName="bg-black focus:bg-black"
              suggestionClassName="text-xs"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

SlippageRow.displayName = 'SlippageRow';

export default SlippageRow;
