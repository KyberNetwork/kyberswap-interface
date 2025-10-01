import { usePairHoneypot } from '@kyber/hooks';
import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';

import AlertIcon from '@/assets/svg/alert.svg';
import { usePoolStore } from '@/stores/usePoolStore';
import { useWidgetStore } from '@/stores/useWidgetStore';

export default function LeftWarning() {
  const { chainId } = useWidgetStore(['chainId']);
  const { pool } = usePoolStore(['pool']);

  const tokensToCheck =
    pool === 'loading'
      ? []
      : [pool.token0, pool.token1].filter(token => token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase());
  const honeypots = usePairHoneypot(pool === 'loading' ? [] : tokensToCheck.map(token => token.address), chainId);
  const honeypotTokens = honeypots
    .map((honeypot, index) => (honeypot.isFOT || honeypot.isHoneypot ? tokensToCheck[index].symbol : ''))
    .filter(honeypot => honeypot !== '')
    .join(', ');

  return (
    <>
      {honeypotTokens ? (
        <div className="py-3 px-4 text-sm rounded-md bg-warning-200 mt-4 flex gap-2">
          <AlertIcon className="text-warning w-4 h-4 relative top-0.5" />
          <p className="flex-1">
            Our security checks detected that {honeypotTokens} may be a honeypot token (cannot be sold or carries
            extremely high sell fee). Please research carefully before adding liquidity or trading.
          </p>
        </div>
      ) : null}
    </>
  );
}
