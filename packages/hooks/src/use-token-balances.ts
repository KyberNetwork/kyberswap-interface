import { useCallback, useEffect, useState } from 'react';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { getFunctionSelector } from '@kyber/utils/crypto';

import { decodeMulticallOutput, encodeMulticallInput } from './utils';

const ERC20_BALANCE_OF_SELECTOR = getFunctionSelector('balanceOf(address)'); // "70a08231"; // Function selector for "";

export const useTokenBalances = (chainId: ChainId, tokenAddresses: string[], account?: string) => {
  const { defaultRpc: rpcUrl, multiCall } = NETWORKS_INFO[chainId];

  const [balances, setBalances] = useState<{ [address: string]: bigint }>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!rpcUrl || !account) {
      setBalances({});
      return;
    }

    if (tokenAddresses.length < 10) return;
    setLoading(true);

    try {
      const nativeBalance = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [
            account, // Address
            'latest', // Block number or state
          ],
          id: 1,
        }),
      })
        .then(res => res.json())
        .then(res => BigInt(res.result || '0'));

      // Prepare calls for the Multicall contract
      const calls = tokenAddresses.map(token => {
        const paddedAccount = account.replace('0x', '').padStart(64, '0');
        const callData = `0x${ERC20_BALANCE_OF_SELECTOR}${paddedAccount}`;
        return {
          target: token,
          callData,
        };
      });

      const encodedData = encodeMulticallInput(false, calls);

      // Encode multicall transaction
      const data = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: multiCall,
            data: encodedData,
          },
          'latest',
        ],
      };

      // Send request to the RPC endpoint
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Decode balances from the multicall output
      const decodedBalances = decodeMulticallOutput(result.result);

      // Map balances to token addresses
      const balancesMap = tokenAddresses.reduce(
        (acc, token, index) => ({
          ...acc,
          [token]: decodedBalances[index],
        }),
        {} as Record<string, bigint>,
      );
      balancesMap[NATIVE_TOKEN_ADDRESS.toLowerCase()] = nativeBalance;

      setBalances(balancesMap);
    } catch (error) {
      setBalances({});
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpcUrl, account, multiCall, JSON.stringify(tokenAddresses)]);

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
