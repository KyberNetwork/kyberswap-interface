import { ZapRouteDetail } from '@kyber/schema';
import { TokenLogo } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { parseTokensAndAmounts } from '@/utils';

export default function ZapInAmount({ zapInfo }: { zapInfo: ZapRouteDetail }) {
  const { tokensIn, amountsIn } = useZapState();
  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  return (
    <div className="ks-lw-card mt-4">
      <div className="ks-lw-card-title">
        <p>Zap-in Amount</p>
        <p className="text-text font-normal text-lg">
          {formatDisplayNumber(+zapInfo.zapDetails.initialAmountUsd, { significantDigits: 6, style: 'currency' })}
        </p>
      </div>
      <div className="mt-2">
        {listValidTokensIn.map((token, index: number) => (
          <div className="flex items-center gap-2 mt-1" key={token.address}>
            <TokenLogo src={token.logo} size={18} />
            <span>
              {formatDisplayNumber(listValidAmountsIn[index], {
                significantDigits: 6,
              })}{' '}
              {token.symbol}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
