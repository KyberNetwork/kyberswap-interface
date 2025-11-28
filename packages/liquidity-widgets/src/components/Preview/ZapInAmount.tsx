import { t } from '@lingui/macro';

import { TokenLogo } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapState } from '@/hooks/useZapState';
import { parseTokensAndAmounts } from '@/utils';

export default function ZapInAmount() {
  const { tokensIn, amountsIn } = useZapState();
  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);
  const { initUsd } = useZapRoute();

  return (
    <div className="ks-lw-card mt-4">
      <div className="ks-lw-card-title">
        <p>{t`Zap-in Amount`}</p>
        <p className="text-text font-normal text-lg">
          {formatDisplayNumber(initUsd, {
            significantDigits: 6,
            style: 'currency',
          })}
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
