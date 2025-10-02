import { usePairHoneypot } from '@kyber/hooks';
import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';

import AlertIcon from '@/assets/svg/alert.svg';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function HoneypotWarning() {
  const { chainId, pool } = useZapOutContext(s => s);
  const { tokenOut } = useZapOutUserState();

  const tokensToCheck =
    !pool || pool === 'loading' || !tokenOut
      ? []
      : [pool.token0, pool.token1, tokenOut].filter(
          token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase(),
        );
  const honeypots = usePairHoneypot(
    tokensToCheck.map(token => token.address),
    chainId,
  );
  const honeypotTokens = honeypots
    .map((honeypot, index) => (honeypot.isFOT || honeypot.isHoneypot ? tokensToCheck[index].symbol : ''))
    .filter(honeypot => honeypot !== '')
    .join(', ');

  return honeypotTokens ? (
    <div className="py-3 px-4 text-sm rounded-md bg-warning-200 flex gap-2 mt-4">
      <AlertIcon className="text-warning w-4 h-4 relative top-0.5" />
      <p className="flex-1">
        Our security checks detected that {honeypotTokens} may be a honeypot token (cannot be sold or carries extremely
        high sell fee). Please research carefully before adding liquidity or trading.
      </p>
    </div>
  ) : null;
}
