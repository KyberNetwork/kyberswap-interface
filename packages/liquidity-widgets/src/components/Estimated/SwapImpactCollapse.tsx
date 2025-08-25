import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, MouseoverTooltip, Skeleton } from '@kyber/ui';
import { PI_LEVEL, SwapAction } from '@kyber/utils';

export default function SwapImpactCollapse({
  initializing,
  swapActions,
  swapPriceImpact,
}: {
  initializing: boolean;
  swapActions: SwapAction[];
  swapPriceImpact:
    | SwapAction
    | {
        piRes: {
          level: PI_LEVEL;
          msg: string;
        };
      };
}) {
  return (
    <div className="flex justify-between items-start mt-3 text-xs">
      {swapActions.length ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <MouseoverTooltip text="View all the detailed estimated price impact of each swap" width="220px">
                <div
                  className={`text-subText mt-[2px] w-fit border-b border-dotted border-subText text-xs ${
                    swapPriceImpact.piRes.level === PI_LEVEL.NORMAL
                      ? ''
                      : swapPriceImpact.piRes.level === PI_LEVEL.HIGH
                        ? '!text-warning !border-warning'
                        : '!text-error !border-error'
                  }`}
                >
                  Swap Price Impact
                </div>
              </MouseoverTooltip>
            </AccordionTrigger>
            <AccordionContent>
              {swapActions.map((item, index: number) => (
                <div
                  className={`text-xs flex justify-between align-middle ${
                    item.piRes.level === PI_LEVEL.NORMAL
                      ? 'text-subText brightness-125'
                      : item.piRes.level === PI_LEVEL.HIGH
                        ? 'text-warning'
                        : 'text-error'
                  }`}
                  key={index}
                >
                  <div className="ml-3">
                    {item.amountIn} {item.tokenInSymbol} {'→ '}
                    {item.amountOut} {item.tokenOutSymbol}
                  </div>
                  <div>{item.piRes.display}</div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <>
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="text-subText mt-[2px] w-fit border-b border-dotted border-subText">Swap Price Impact</div>
          </MouseoverTooltip>
          {initializing ? <Skeleton className="w-14 h-4" /> : <span>--</span>}
        </>
      )}
    </div>
  );
}
