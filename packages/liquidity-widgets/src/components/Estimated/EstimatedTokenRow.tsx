import { Token } from '@kyber/schema';
import { Skeleton, TokenLogo } from '@kyber/ui';
import { formatCurrency, formatNumber } from '@kyber/utils/number';

export default function EstimatedTokenRow({
  initializing,
  token,
  addedAmount,
  addedValue,
  previousAmount,
  previousValue,
}: {
  initializing: boolean;
  token: Token;
  addedAmount: number;
  addedValue: number;
  previousAmount?: number;
  previousValue?: number;
}) {
  return (
    <div className="flex justify-between items-start mt-3 text-xs">
      <div className="text-subText mt-[2px] w-fit flex items-center">
        Est. Pooled {initializing ? <Skeleton className="w-10 h-4 ml-2" /> : token.symbol}
      </div>

      {initializing ? (
        <Skeleton className="w-14 h-4" />
      ) : addedAmount ? (
        <div>
          <div className="flex justify-end items-start gap-1">
            {token.logo && <TokenLogo src={token.logo} size={14} className="mt-[2px]" />}
            <div className="text-end">
              {formatNumber(previousAmount ? previousAmount : addedAmount)} {token.symbol}
            </div>
          </div>
          {previousAmount && (
            <div className="text-end">
              + {formatNumber(addedAmount)} {token.symbol}
            </div>
          )}

          <div className="text-subText mt-[2px] w-fit ml-auto">
            ~{formatCurrency(addedValue + (previousValue || 0))}
          </div>
        </div>
      ) : (
        '--'
      )}
    </div>
  );
}
