import { usePairHoneypot } from '@kyber/hooks';
import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';
import { isNotNull } from '@kyber/utils';

import AlertIcon from '@/assets/icons/alert.svg';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function HoneypotWarning() {
  const { chainId } = useWidgetStore(['chainId']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);

  const tokensToCheck =
    !sourcePool || !targetPool
      ? []
      : (() => {
          const seenAddresses = new Set<string>();
          return [sourcePool.token0, sourcePool.token1, targetPool.token0, targetPool.token1]
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
            Our security checks detected that {honeypotTokensNames} may be a honeypot token (cannot be sold or carries
            extremely high sell fee). Please research carefully before adding liquidity or trading.
          </p>
        </div>
      ) : null}

      {fotTokens.length
        ? fotTokens.map(fotToken => (
            <div key={fotToken.symbol} className="py-3 px-4 text-sm rounded-md bg-warning-200 flex gap-2">
              <AlertIcon className="text-warning w-4 h-4 relative top-0.5" />
              <p className="flex-1">
                {fotToken.symbol} is a Fee-On-Transfer token with a {Math.round(fotToken.tax * 100)}% transaction fee
                applied on every transfer, please beware before triggering trades with this token.
              </p>
            </div>
          ))
        : null}
    </>
  );
}
