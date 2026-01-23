import { Trans } from '@lingui/macro';

import { Skeleton, TokenLogo } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';

export default function ReInvest() {
  const pool = usePoolStore(s => s.pool);
  const position = usePositionStore(s => s.position);
  const { tokensIn, amountsIn, tokenPrices } = useZapState();

  const listAmountsIn = amountsIn.split(',');

  const initializing = pool === 'loading' || position === 'loading' || tokensIn.length === 0;

  const totalValue = tokensIn.reduce((acc, token, index) => {
    return acc + parseFloat(listAmountsIn[index]) * (tokenPrices[token.address] || 0);
  }, 0);

  return (
    <div className="px-4 py-3 border border-stroke rounded-md">
      <div className="flex justify-between mb-3">
        <p className="text-subText text-sm">
          <Trans>Your Earning to Reinvest</Trans>
        </p>
        {initializing ? (
          <Skeleton className="w-16 h-5" />
        ) : (
          <p>~ {formatDisplayNumber(totalValue, { significantDigits: 6, style: 'currency' })}</p>
        )}
      </div>
      {initializing ? (
        <>
          <div className="flex justify-between">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-14 h-5" />
          </div>
          <div className="flex justify-between mt-2">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-14 h-5" />
          </div>
        </>
      ) : tokensIn.length > 0 ? (
        tokensIn.map((token, index) => (
          <div className={`flex justify-between ${index !== 0 ? 'mt-2' : ''}`} key={index}>
            <div className="flex items-center gap-2">
              <TokenLogo src={token.logo} size={16} />
              <span>{formatDisplayNumber(listAmountsIn[index], { significantDigits: 6 })}</span>
              <span>{token.symbol}</span>
            </div>
            <p className="text-subText text-xs">
              {formatDisplayNumber(parseFloat(listAmountsIn[index]) * (tokenPrices[token.address] || 0), {
                significantDigits: 6,
                style: 'currency',
              })}
            </p>
          </div>
        ))
      ) : null}
    </div>
  );
}
