import { useState } from 'react';

import { API_URLS } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem } from '@kyber/ui';
import { cn } from '@kyber/utils/tailwind-helpers';

import ChevronDown from '@/assets/icons/chevron-down.svg';
import EstimatedRow from '@/components/Estimated/EstimatedRow';
import SlippageRow from '@/components/Estimated/SlippageRow';
import useZapRoute from '@/hooks/useZapRoute';
import { useZapStore } from '@/stores/useZapStore';
import { PI_LEVEL } from '@/utils';

export function Estimated({ expandable }: { expandable?: boolean }) {
  const { route, fetchingRoute } = useZapStore(['route', 'fetchingRoute']);
  const { zapFee, zapImpact } = useZapRoute();

  const [expanded, setExpanded] = useState(expandable ? false : true);
  const toggleExpanded = () => setExpanded(prev => !prev);

  return (
    <div className="border border-stroke rounded-md overflow-hidden">
      <div className="px-4 py-3">
        <Accordion type="single" collapsible className="w-full" value={expanded ? 'item-1' : undefined}>
          <AccordionItem value="item-1">
            <SlippageRow />
            <AccordionContent>
              <div className="flex flex-col gap-2">
                <EstimatedRow
                  loading={fetchingRoute}
                  label={
                    <div
                      className={cn(
                        'text-subText w-fit border-b border-dotted border-subText text-xs',
                        route
                          ? zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                            ? 'text-error border-error'
                            : zapImpact.level === PI_LEVEL.HIGH
                              ? 'text-warning border-warning'
                              : 'text-subText border-subText'
                          : '',
                      )}
                    >
                      Zap Impact
                    </div>
                  }
                  labelTooltip="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
                  value={
                    <div
                      className={`text-sm ${
                        zapImpact.level === PI_LEVEL.VERY_HIGH || zapImpact.level === PI_LEVEL.INVALID
                          ? 'text-error'
                          : zapImpact.level === PI_LEVEL.HIGH
                            ? 'text-warning'
                            : 'text-text'
                      }`}
                    >
                      {zapImpact.display}
                    </div>
                  }
                  hasRoute={!!route}
                />

                <EstimatedRow
                  loading={fetchingRoute}
                  label="Migration Fee"
                  labelTooltip={
                    <div>
                      Fees charged for automatically zapping into a liquidity pool. You still have to pay the standard
                      gas fees.{' '}
                      <a
                        className="text-accent"
                        href={API_URLS.DOCUMENT.ZAP_FEE_MODEL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        More details.
                      </a>
                    </div>
                  }
                  value={<div className="text-sm font-medium">{parseFloat(zapFee.toFixed(3))}%</div>}
                  hasRoute={!!route}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {expandable ? (
        <div className="flex items-center justify-center h-4 w-full bg-layer2 cursor-pointer" onClick={toggleExpanded}>
          <ChevronDown
            className={cn('text-subText w-4 h-4 transition-transform duration-200', expanded ? 'rotate-180' : '')}
          />
        </div>
      ) : null}
    </div>
  );
}
