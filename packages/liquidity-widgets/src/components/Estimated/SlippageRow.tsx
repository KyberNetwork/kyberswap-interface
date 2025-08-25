import { useEffect } from 'react';

import { usePrevious } from '@kyber/hooks';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, MouseoverTooltip } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import SlippageInput from '@/components/Setting/SlippageInput';
import { useZapState } from '@/hooks/useZapState';

const MAX_SLIPPAGE_LABEL_TEXT =
  'Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!';

export default function SlippageRow({ suggestedSlippage }: { suggestedSlippage: number }) {
  const { slippage, slippageOpen, setSlippageOpen } = useZapState();

  const isHighSlippage = suggestedSlippage > 0 ? slippage && slippage > 2 * suggestedSlippage : false;
  const isLowSlippage = suggestedSlippage > 0 ? slippage && slippage < suggestedSlippage / 2 : false;
  const isSlippageWarning = isHighSlippage || isLowSlippage;

  const previousSuggestedSlippage = usePrevious(suggestedSlippage);

  useEffect(() => {
    if (previousSuggestedSlippage !== suggestedSlippage && slippage !== suggestedSlippage && suggestedSlippage > 0) {
      setSlippageOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSlippage]);

  return (
    <div className="flex justify-between items-start mt-3 text-xs">
      <Accordion type="single" collapsible className="w-full" value={slippageOpen ? 'item-1' : undefined}>
        <AccordionItem value="item-1">
          <AccordionTrigger iconClassName={isSlippageWarning ? 'text-warning' : ''}>
            <div className="flex items-center justify-between w-full">
              <MouseoverTooltip text={MAX_SLIPPAGE_LABEL_TEXT} width="220px">
                <div
                  className={cn(
                    'text-subText text-xs border-b border-dotted border-subText',
                    isSlippageWarning ? 'text-warning border-warning' : '',
                  )}
                >
                  Max Slippage
                </div>
              </MouseoverTooltip>
              <div className={cn('mr-1', isSlippageWarning ? 'text-warning' : 'text-text')}>
                {slippage ? `${((slippage * 100) / 10_000).toFixed(2)}%` : ''}
              </div>
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
}
