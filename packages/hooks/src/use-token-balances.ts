import { useCallback, useEffect, useRef, useState } from 'react';

import { ChainId } from '@kyber/schema';
import { getTokenBalances } from '@kyber/utils/crypto';

const EMPTY: { [address: string]: bigint } = {};

export const useTokenBalances = (chainId: ChainId, tokenAddresses: string[], account?: string) => {
  const [balances, setBalances] = useState<{ [address: string]: bigint }>(EMPTY);
  // Which (chain, account, list) the balances on hand answer for; `loading` stays true until the
  // current one has landed, so a caller never reads a previous request's map as this one's. A
  // periodic refresh of an already-settled key is not loading: the map on screen stays valid.
  const [settledKey, setSettledKey] = useState('');
  const fetchIdRef = useRef(0);
  const prevAccountRef = useRef(account);

  // Clear stale balances immediately when account changes
  if (prevAccountRef.current !== account) {
    prevAccountRef.current = account;
    setBalances(EMPTY);
  }

  const tokenAddressesKey = JSON.stringify(tokenAddresses);
  const requestKey = `${chainId}:${account ?? ''}:${tokenAddressesKey}`;
  const active = !!account && tokenAddresses.length > 0;

  const fetchBalances = useCallback(async () => {
    if (!active || !account) {
      // Retire any request still in flight so its result cannot land after the caller stopped asking.
      fetchIdRef.current += 1;
      setBalances(previous => (Object.keys(previous).length ? EMPTY : previous));
      return;
    }

    const currentFetchId = ++fetchIdRef.current;

    try {
      const balancesMap = await getTokenBalances({
        tokenAddresses,
        chainId,
        account,
      });

      // Only update state if this is still the latest request
      if (currentFetchId === fetchIdRef.current) {
        setBalances(balancesMap);
      }
    } catch (error) {
      // Don't clear balances on error — keep the previous valid data
      console.error('Failed to fetch balances:', error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        // An attempt settles the key whatever its outcome: a failed poll leaves the previous map
        // on screen rather than a loader that nothing would ever clear.
        setSettledKey(requestKey);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, account, tokenAddressesKey, active]);

  useEffect(() => {
    fetchBalances();
    if (!active) return;

    const interval = setInterval(() => {
      fetchBalances();
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchBalances, active]);

  return {
    loading: active && settledKey !== requestKey,
    balances,
    refetch: fetchBalances,
  };
};
