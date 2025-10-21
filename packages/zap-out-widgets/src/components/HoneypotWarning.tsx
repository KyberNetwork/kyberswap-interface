import { Trans } from '@lingui/macro';

import { usePairHoneypot } from '@kyber/hooks';
import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';
import { isNotNull } from '@kyber/utils';

import AlertIcon from '@/assets/svg/alert.svg';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function HoneypotWarning() {
  const { chainId, pool } = useZapOutContext(s => s);
  const { tokenOut } = useZapOutUserState();

  const tokensToCheck =
    !pool || !tokenOut
      ? []
      : (() => {
          const seenAddresses = new Set<string>();
          return [pool.token0, pool.token1, tokenOut]
            .filter(token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase())
            .filter(token => {
              const address = token.address.toLowerCase();
              if (seenAddresses.has(address)) {
                return false;
              }
              seenAddresses.add(address);
              return true;
            });
        })();
  const honeypots = usePairHoneypot(
    tokensToCheck.map(token => token.address),
    chainId,
  );

  const honeypotTokens = honeypots
    .map((honeypot, index) =>
      honeypot && honeypot.isHoneypot
        ? {
            ...honeypot,
            symbol: tokensToCheck[index].symbol,
          }
        : null,
    )
    .filter(isNotNull);
  const honeypotTokensNames = honeypotTokens.map(honeypot => honeypot.symbol).join(', ');

  const fotTokens = honeypots
    .map((honeypot, index) =>
      honeypot && honeypot.isFOT
        ? {
            ...honeypot,
            symbol: tokensToCheck[index].symbol,
          }
        : null,
    )
    .filter(isNotNull);

  return (
    <>
      {honeypotTokensNames ? (
        <div className="py-3 px-4 text-sm rounded-md bg-warning-200 flex gap-2">
          <AlertIcon className="text-warning w-4 h-4 relative top-0.5" />
          <p className="flex-1">
            <Trans>
              Our security checks detected that {honeypotTokensNames} may be a honeypot token (cannot be sold or carries
              extremely high sell fee). Please research carefully before adding liquidity or trading.
            </Trans>
          </p>
        </div>
      ) : null}

      {fotTokens.length
        ? fotTokens.map(fotToken => (
            <div key={fotToken.symbol} className="py-3 px-4 text-sm rounded-md bg-warning-200 flex gap-2">
              <AlertIcon className="text-warning w-4 h-4 relative top-0.5" />
              <p className="flex-1">
                <Trans>
                  {fotToken.symbol} is a Fee-On-Transfer token with a {Math.round(fotToken.tax * 100)}% transaction fee
                  applied on every transfer, please beware before triggering trades with this token.
                </Trans>
              </p>
            </div>
          ))
        : null}
    </>
  );
}
