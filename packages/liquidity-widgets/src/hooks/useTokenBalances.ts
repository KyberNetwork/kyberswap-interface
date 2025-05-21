import { useCallback, useEffect, useState } from 'react';

import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';
import { getFunctionSelector } from '@kyber/utils/crypto';

function encodeBytes(data: string) {
  const length = data.length / 2; // Hex string length divided by 2 for bytes
  const lengthEncoded = length.toString(16).padStart(64, '0');
  const paddedData = data.padEnd(Math.ceil(data.length / 64) * 64, '0');
  return lengthEncoded + paddedData;
}

// Helper to manually encode ABI data
function encodeMulticallInput(
  requireSuccess: boolean,
  calls: { target: string; callData: string }[]
): string {
  const functionSelector = getFunctionSelector('tryBlockAndAggregate(bool,(address,bytes)[])');

  // Encode `requireSuccess` as a 32-byte boolean
  const requireSuccessEncoded = requireSuccess ? '01'.padStart(64, '0') : '00'.padStart(64, '0');

  // `callsOffset` is fixed at 64 bytes (0x40 in hex)
  const offset = '40'.padStart(64, '0');

  const callsLength = calls.length.toString(16).padStart(64, '0');

  const encodedCalls = calls.map((call) => {
    const encodedTarget = call.target.toLowerCase().replace('0x', '').padStart(64, '0');

    const encodedCallData = encodeBytes(call.callData.replace(/^0x/, ''));

    return encodedTarget + offset + encodedCallData;
  });

  const staticPart = `${functionSelector}${requireSuccessEncoded}${offset}${callsLength}`;

  const dynamicDataLocaitons: number[] = [];
  dynamicDataLocaitons.push(calls.length * 32);
  encodedCalls.forEach((call, index) => {
    if (index === encodedCalls.length - 1) return;
    dynamicDataLocaitons.push(call.length / 2 + dynamicDataLocaitons[index]);
  });

  const encodedDynamicDataLocaitons = dynamicDataLocaitons.map((location) =>
    location.toString(16).padStart(64, '0')
  );

  const dynamicData = encodedDynamicDataLocaitons.join('') + encodedCalls.join('');

  return `0x${staticPart}${dynamicData}`;
}

// Decode the results from the Multicall response
function decodeMulticallOutput(result: string | undefined): bigint[] {
  if (!result) return [];
  const res = result.startsWith('0x') ? result.slice(2) : result;
  let offset = 0;

  // Decode blockNumber (first 32 bytes, uint256)
  //const blockNumber = BigInt("0x" + res.slice(offset, offset + 64));
  offset += 64;

  // Decode blockHash (next 32 bytes, bytes32)
  //const blockHash = "0x" + res.slice(offset, offset + 64);
  offset += 64;

  // Decode returnData array offset (not used directly)
  //const returnDataOffset = parseInt(res.slice(offset, offset + 64), 16);
  offset += 64;

  // Decode returnData array length (next 32 bytes, uint256)
  const returnDataLength = parseInt(res.slice(offset, offset + 64), 16);
  offset += 64;

  const dynamicData = res.slice(offset);

  const offsetsOfEachData = [];
  for (let i = 0; i < returnDataLength; i++) {
    const returnDataOffset = parseInt(res.slice(offset, offset + 64), 16);
    offsetsOfEachData.push(returnDataOffset);
    offset += 64;
  }

  const returnData: { success: boolean; returnData: string }[] = [];

  for (let i = 0; i < returnDataLength; i++) {
    const currentData = dynamicData.slice(offsetsOfEachData[i] * 2);

    let currentOffset = 0;
    // Decode success (bool, first 32 bytes of each tuple)
    const success = currentData.slice(currentOffset, 64).endsWith('1');
    currentOffset += 64;

    // Decode returnData offset (relative to the start of the tuple array)
    //const innerReturnDataOffset = currentData.slice(currentOffset , currentOffset + 64);
    currentOffset += 64;

    // Decode returnData length from the specified offset
    const currentDataLength = parseInt(currentData.slice(currentOffset, currentOffset + 64), 16);
    currentOffset += 64;

    const returnDataHex =
      '0x' + (currentData.slice(currentOffset, currentOffset + currentDataLength * 2) || '0');

    returnData.push({ success, returnData: returnDataHex });
  }

  return returnData.map((item) => {
    if (item.success) return BigInt(item.returnData);
    return BigInt(0);
  });
}

const ERC20_BALANCE_OF_SELECTOR = getFunctionSelector('balanceOf(address)'); // "70a08231"; // Function selector for "";

const useTokenBalances = (chainId: ChainId, tokenAddresses: string[], account?: string) => {
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
        .then((res) => res.json())
        .then((res) => BigInt(res.result || '0'));

      // Prepare calls for the Multicall contract
      const calls = tokenAddresses.map((token) => {
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
        {} as Record<string, bigint>
      );
      balancesMap[NATIVE_TOKEN_ADDRESS] = nativeBalance;

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
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    loading,
    balances,
    refetch: fetchBalances,
  };
};

export default useTokenBalances;
