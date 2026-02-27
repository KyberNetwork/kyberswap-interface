import { useCallback, useEffect, useRef, useState } from 'react';

import { ChainId } from '@kyber/schema';
import { getTokenBalances } from '@kyber/utils/crypto';

export const useTokenBalances = (chainId: ChainId, tokenAddresses: string[], account?: string) => {
  const [balances, setBalances] = useState<{ [address: string]: bigint }>({});
  const [loading, setLoading] = useState(false);
  const fetchIdRef = useRef(0);

  const tokenAddressesKey = JSON.stringify(tokenAddresses);

  const fetchBalances = useCallback(async () => {
    if (!account) {
      setBalances({});
      return;
    }

    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);

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
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, account, tokenAddressesKey]);

  useEffect(() => {
    fetchBalances();

    const interval = setInterval(() => {
      fetchBalances();
    }, 15_000);

    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    loading,
    balances,
    refetch: fetchBalances,
  };
};
