import { t } from '@lingui/macro';

import { useTokenPrices } from '@kyber/hooks';
import { TokenLogo } from '@kyber/ui';
import { formatDisplayNumber } from '@kyber/utils/number';

import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { parseTokensAndAmounts } from '@/utils';

export default function ZapInAmount() {
  const { chainId } = useWidgetStore(['chainId']);
  const { tokensIn, amountsIn } = useZapState();
  const { tokensIn: listValidTokensIn, amountsIn: listValidAmountsIn } = parseTokensAndAmounts(tokensIn, amountsIn);

  const { prices: tokenPrices } = useTokenPrices({
    addresses: listValidTokensIn.map(token => token.address.toLowerCase()),
    chainId,
  });

  const formatTokenUsdValue = (tokenAddress: string, amount: string) => {
    const price = tokenPrices[tokenAddress.toLowerCase()];
    if (!price) return null;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return null;
    return numericAmount * price;
  };

  return (
    <div className="ks-lw-card">
      <div className="ks-lw-card-title">
        <p>{t`Zap-in Amount`}</p>
      </div>
      <div className="flex flex-col gap-1 mt-2">
        {listValidTokensIn.map((token, index: number) => {
          const usdValue = formatTokenUsdValue(token.address, listValidAmountsIn[index]);
          return (
            <div className="flex items-center gap-2 mt-1" key={token.address}>
              <TokenLogo src={token.logo} size={18} />
              <span>
                {formatDisplayNumber(listValidAmountsIn[index], { significantDigits: 6 })} {token.symbol}
              </span>
              <span className="text-xs text-subText">
                {usdValue === null
                  ? '--'
                  : `~${formatDisplayNumber(usdValue, { significantDigits: 6, style: 'currency' })}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
