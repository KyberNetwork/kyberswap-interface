import { useEffect, useMemo, useState } from 'react';

import { API_URLS, ChainId } from '@kyber/schema';

interface Honeypot {
  isHoneypot: boolean;
  isFOT: boolean;
  tax: number;
}

const checkTokenHoneypot = async (tokenAddress: string, chainId: ChainId) => {
  const response = await fetch(
    `${API_URLS.TOKEN_API}/v1/public/tokens/honeypot-fot-info?address=${tokenAddress.toLowerCase()}&chainId=${chainId}`,
  ).then(res => res.json());

  return response.data;
};

// Cache and in-flight request registry to deduplicate network calls across renders/mounts
const honeypotCache = new Map<string, Array<Honeypot | null>>();
const inFlightRequests = new Map<string, Promise<Array<Honeypot | null>>>();

const makeKey = (addresses: string[], chainId: ChainId) =>
  `${chainId}:${addresses.map(a => a.toLowerCase()).join(',')}`;

export function usePairHoneypot(tokenAddresses: string[], chainId: ChainId) {
  const [honeypots, setHoneypots] = useState<Array<Honeypot | null>>([]);

  const normalizedAddresses = useMemo(() => tokenAddresses.map(addr => addr.toLowerCase()), [tokenAddresses]);
  const key = useMemo(() => makeKey(normalizedAddresses, chainId), [normalizedAddresses, chainId]);

  useEffect(() => {
    let cancelled = false;

    // Parse fetch params from the stable key so this effect depends only on `key`
    const [chainIdPart, addressesPart = ''] = key.split(':');
    const addresses = addressesPart ? addressesPart.split(',').filter(Boolean) : [];
    const chainIdForFetch = Number(chainIdPart) as ChainId;

    // If there are no addresses, reset and bail out
    if (addresses.length === 0) {
      setHoneypots([]);
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      // Serve from cache if available
      if (honeypotCache.has(key)) {
        if (!cancelled) setHoneypots(honeypotCache.get(key)!);
        return;
      }

      // Join existing in-flight request or create a new one
      let promise = inFlightRequests.get(key);
      if (!promise) {
        promise = Promise.all(addresses.map(tokenAddress => checkTokenHoneypot(tokenAddress, chainIdForFetch)))
          .then(result => {
            honeypotCache.set(key, result);
            return result;
          })
          .finally(() => {
            inFlightRequests.delete(key);
          });
        inFlightRequests.set(key, promise);
      }

      const result = await promise;
      if (!cancelled) {
        setHoneypots(result);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  return honeypots;
}
