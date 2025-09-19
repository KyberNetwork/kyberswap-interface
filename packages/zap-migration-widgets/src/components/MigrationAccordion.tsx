import { useState } from 'react';

import { Pool, defaultToken } from '@kyber/schema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Skeleton, TokenLogo } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';
import { cn } from '@kyber/utils/tailwind-helpers';

export default function MigrationAccordion({
  title,
  amount0,
  amount1,
  amountLoading,
  pool,
  className,
}: {
  title: string;
  amount0: number;
  amount1: number;
  amountLoading?: boolean;
  pool: Pool | null;
  className?: string;
}) {
  const { token0 = defaultToken, token1 = defaultToken } = pool || {};

  const [expanded, setExpanded] = useState(false);
  const onExpand = () => setExpanded(prev => !prev);

  const value0 = (token0.price || 0) * amount0;
  const value1 = (token1.price || 0) * amount1;
  const totalValue = value0 + value1;

  return (
    <Accordion type="single" collapsible className={cn('w-full', className)} value={expanded ? 'item-1' : ''}>
      <AccordionItem value="item-1">
        <AccordionTrigger onClick={onExpand}>
          <div className="flex items-center justify-between w-full pr-1.5">
            <div className="text-sm text-subText">{title}</div>
            {!pool || amountLoading ? (
              <Skeleton className="w-[60px] h-6" />
            ) : (
              <div>
                {formatDisplayNumber(totalValue, {
                  style: 'currency',
                })}
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <TokenLogo src={token0.logo} alt={token0.symbol} />
              {amountLoading ? (
                <Skeleton className="w-10 h-5" />
              ) : (
                <span className="text-base">{formatDisplayNumber(amount0, { significantDigits: 8 })}</span>
              )}
              <span className="text-base">{token0.symbol}</span>
            </div>
            {amountLoading ? (
              <Skeleton className="w-20 h-4" />
            ) : (
              <div className="text-subText text-xs">{formatDisplayNumber(value0, { style: 'currency' })}</div>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <TokenLogo src={token1.logo} alt={token1.symbol} />
              {amountLoading ? (
                <Skeleton className="w-10 h-5" />
              ) : (
                <span className="text-base">{formatDisplayNumber(amount1, { significantDigits: 8 })}</span>
              )}
              <span className="text-base">{token1.symbol}</span>
            </div>
            {amountLoading ? (
              <Skeleton className="w-20 h-4" />
            ) : (
              <div className="text-subText text-xs">{formatDisplayNumber(value1, { style: 'currency' })}</div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
