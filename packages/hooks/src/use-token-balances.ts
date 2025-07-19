import { useCallback, useEffect, useState } from 'react';

import { ChainId } from '@kyber/schema';
import { getTokenBalances } from '@kyber/utils/crypto';

export const useTokenBalances = (chainId: ChainId, tokenAddresses: string[], account?: string) => {
  const [balances, setBalances] = useState<{ [address: string]: bigint }>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!account) {
      setBalances({});
      return;
    }

    setLoading(true);

    try {
      const balancesMap = await getTokenBalances({
        tokenAddresses,
        chainId,
        account,
      });

      setBalances(balancesMap);
    } catch (error) {
      setBalances({});
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, account, JSON.stringify(tokenAddresses)]);

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
