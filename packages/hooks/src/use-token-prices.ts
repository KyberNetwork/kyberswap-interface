import { useEffect, useMemo, useState } from 'react';

import { fetchTokenPrice, getMidPrice } from '@kyber/utils';

/** Matches the swap form's route refresh, so the two never drift by more than one interval. */
const REFRESH_MS = 10_000;
/** Server-enforced cap on addresses per chain per request. */
const CHUNK_SIZE = 100;

export type TokenPriceMap = { [address: string]: number };

const EMPTY_PRICES: TokenPriceMap = {};

const shallowEqual = (a: TokenPriceMap, b: TokenPriceMap) => {
  const aKeys = Object.keys(a);
  return aKeys.length === Object.keys(b).length && aKeys.every(key => a[key] === b[key]);
};

/**
 * USD mid prices (see `getMidPrice`) for `addresses` on `chainId`, keyed by the address as passed
 * in. Refreshes while mounted and the tab is visible. `loading` is true only until the first
 * response for the current chain and address list lands; a failed refresh keeps the last good
 * prices, and an address the service cannot price reads `0`.
 */
export function useTokenPrices({ addresses, chainId }: { addresses: string[]; chainId?: number }) {
  // A primitive key so callers may rebuild the address array on every render.
  const addressKey = addresses.join(',');
  const requestKey = `${chainId ?? ''}:${addressKey}`;

  const [state, setState] = useState<{ key: string; chainId?: number; byLowercase: TokenPriceMap }>({
    key: '',
    byLowercase: EMPTY_PRICES,
  });

  useEffect(() => {
    const list = addressKey.split(',').filter(Boolean);
    if (!chainId || !list.length) return;

    let cancelled = false;

    const load = async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < list.length; i += CHUNK_SIZE) chunks.push(list.slice(i, i + CHUNK_SIZE));
      const results = await Promise.allSettled(chunks.map(chunk => fetchTokenPrice({ addresses: chunk, chainId })));
      if (cancelled) return;

      const fetched: TokenPriceMap = {};
      results.forEach(result => {
        if (result.status !== 'fulfilled') return;
        // The API may echo checksummed addresses; index by lowercase to match what was requested.
        Object.entries(result.value).forEach(([address, entry]) => {
          fetched[address.toLowerCase()] = getMidPrice(entry) || 0;
        });
      });

      setState(prev => {
        // Stale-while-revalidate: a chunk that failed leaves its previous prices in place.
        const next = prev.chainId === chainId ? { ...prev.byLowercase, ...fetched } : fetched;
        if (prev.key === requestKey && shallowEqual(prev.byLowercase, next)) return prev;
        return { key: requestKey, chainId, byLowercase: next };
      });
    };

    const refresh = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void load();
    };

    void load();
    const interval = setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [chainId, addressKey, requestKey]);

  const settled = state.key === requestKey;
  // While a changed address list is in flight, the chain's last prices still serve the addresses
  // they cover, so a token that was already priced does not blink to $0.
  const byLowercase = state.chainId === chainId ? state.byLowercase : EMPTY_PRICES;

  const prices = useMemo(
    () =>
      addressKey
        .split(',')
        .filter(Boolean)
        .reduce<TokenPriceMap>((acc, address) => {
          acc[address] = byLowercase[address.toLowerCase()] || 0;
          return acc;
        }, {}),
    [addressKey, byLowercase],
  );

  return {
    loading: !!chainId && addresses.length > 0 && !settled,
    prices,
  };
}
