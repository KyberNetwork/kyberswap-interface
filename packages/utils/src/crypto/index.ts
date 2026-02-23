import { keccak256 } from 'js-sha3';

import { directRpcFetch, ethCall, getBalance, rpcFetch } from '@kyber/rpc-client/fetch';
import { ChainId, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO } from '@kyber/schema';

export * from './address';

export interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

// Function to encode a uint256 parameter to hex (minimal ABI encoding)
export function encodeUint256(value: bigint): string {
  return value.toString(16).padStart(64, '0'); // Encode bigint as hex, pad to 32 bytes
}

export function getFunctionSelector(signature: string): string {
  // Convert the function signature to bytes and hash it using keccak256
  const hash = keccak256(signature);

  // Take the first 4 bytes (8 hex characters) as the function selector
  return hash.slice(0, 8);
}

// Function to decode an Ethereum address from hex (last 20 bytes of a 32-byte field)
export function decodeAddress(hex: string): string {
  return `0x${hex.slice(-40)}`; // Last 20 bytes = 40 hex chars
}

// Decode a uint256 (or smaller) field from the hex string
export function decodeUint(hex: string): bigint {
  return BigInt(`0x${hex}`);
}

// Function to decode an int24 from hex (handles negative values)
export function decodeInt24(hex: string): number {
  const last3Bytes = hex.slice(-6);
  const int = parseInt(last3Bytes, 16);
  // If the int is greater than the max signed value for 24 bits (2^23), it's negative
  return int >= 0x800000 ? int - 0x1000000 : int;
}

// Get current gas price for a chain
export async function getCurrentGasPrice(chainId: number): Promise<number> {
  const result = await rpcFetch<string>(chainId, 'eth_gasPrice', []);
  return parseInt(result, 16);
}

/**
 * Estimate gas for a transaction.
 * @param chainIdOrRpcUrl - Either a chainId (number) for automatic rotation, or a specific RPC URL (string)
 */
export async function estimateGas(
  chainIdOrRpcUrl: number | string,
  { from, to, value = '0x0', data = '0x' }: { from: string; to: string; value: string; data: string },
): Promise<bigint> {
  const params = [{ from, to, value, data }];

  if (typeof chainIdOrRpcUrl === 'number') {
    const result = await rpcFetch<string>(chainIdOrRpcUrl, 'eth_estimateGas', params);
    return BigInt(result);
  }

  // Legacy: direct RPC URL provided
  const result = await directRpcFetch<string>(chainIdOrRpcUrl, 'eth_estimateGas', params);
  return BigInt(result);
}

interface TxReceipt {
  status: string;
}

/**
 * Check if a transaction was successful.
 * @param chainIdOrRpcUrl - Either a chainId (number) for automatic rotation, or a specific RPC URL (string)
 */
export async function isTransactionSuccessful(
  chainIdOrRpcUrl: number | string,
  txHash: string,
): Promise<false | { status: boolean }> {
  let result: TxReceipt | null;

  if (typeof chainIdOrRpcUrl === 'number') {
    result = await rpcFetch<TxReceipt | null>(chainIdOrRpcUrl, 'eth_getTransactionReceipt', [txHash]);
  } else {
    // Legacy: direct RPC URL provided
    result = await directRpcFetch<TxReceipt | null>(chainIdOrRpcUrl, 'eth_getTransactionReceipt', [txHash]);
  }

  // Check if the transaction receipt was found
  if (!result) {
    console.log('Transaction not mined yet or invalid transaction hash.');
    return false;
  }

  // `status` is "0x1" for success, "0x0" for failure
  return {
    status: result.status === '0x1',
  };
}

/**
 * Check token approval allowance.
 * @param params.chainId - Chain ID for automatic RPC rotation (optional, falls back to rpcUrl)
 * @param params.rpcUrl - Legacy: specific RPC URL (optional if chainId is provided)
 */
export async function checkApproval({
  chainId,
  rpcUrl,
  token,
  owner,
  spender,
}: {
  chainId?: number;
  rpcUrl?: string;
  token: string;
  owner: string;
  spender: string;
}): Promise<bigint> {
  const allowanceFunctionSig = getFunctionSelector('allowance(address,address)');
  const paddedOwner = owner.replace('0x', '').padStart(64, '0');
  const paddedSpender = spender.replace('0x', '').padStart(64, '0');
  const data = `0x${allowanceFunctionSig}${paddedOwner}${paddedSpender}`;

  let result: string;

  if (chainId !== undefined) {
    result = await ethCall(chainId, token, data);
  } else if (rpcUrl) {
    // Legacy: direct RPC URL provided
    result = await directRpcFetch<string>(rpcUrl, 'eth_call', [{ to: token, data }, 'latest']);
  } else {
    throw new Error('Either chainId or rpcUrl must be provided');
  }

  return BigInt(result);
}

export function calculateGasMargin(value: bigint): string {
  const defaultGasLimitMargin = 20_000n;
  const gasMargin = (value * 5000n) / 10_000n;

  return '0x' + (gasMargin < defaultGasLimitMargin ? value + defaultGasLimitMargin : value + gasMargin).toString(16);
}

export function parseUnits(value: string | number, decimals: number): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Value must be a string or number');
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('Decimals must be a non-negative integer');
  }

  // Convert the value to a string if it is a number
  value = value.toString();

  // Split the value into integer and fractional parts
  const parts = value.split('.');
  const integerPart = parts[0];
  let fractionalPart = parts[1] || '';

  // Truncate the fractional part to the specified decimals
  fractionalPart = fractionalPart.slice(0, decimals);

  // Normalize the fractional part to match the decimals
  const normalizedFractional = fractionalPart.padEnd(decimals, '0');

  // Construct the full value as an integer
  const fullValue = integerPart + normalizedFractional;

  // Remove leading zeros and handle edge cases
  return fullValue.replace(/^0+(?=\d)|^$/, '0');
}

export function formatUnits(value: string | number, decimals = 18): string {
  if (Number.isNaN(decimals)) return '0';
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Value must be a string or number');
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error('Decimals must be a non-negative integer');
  }

  // Convert the value to a string to handle it consistently
  value = value.toString();

  // Handle the case where value is shorter than the decimals
  if (value.length <= decimals) {
    const paddedValue = value.padStart(decimals + 1, '0'); // Ensure there is at least one integer digit
    const integerPart = '0';
    const fractionalPart = paddedValue.slice(-decimals);
    return integerPart + '.' + fractionalPart;
  }

  // Split the value into integer and fractional parts
  const integerPart = value.slice(0, -decimals);
  const fractionalPart = value.slice(-decimals);

  // Remove trailing zeros from fractional part
  const cleanedFractional = fractionalPart.replace(/0+$/, '');

  return cleanedFractional ? `${integerPart}.${cleanedFractional}` : integerPart;
}

/**
 * Get token balances for multiple tokens.
 * Uses RPC client with automatic rotation for better reliability.
 */
export const getTokenBalances = async ({
  tokenAddresses,
  chainId,
  account,
}: {
  tokenAddresses: string[];
  chainId: ChainId;
  account: string;
}) => {
  const { multiCall } = NETWORKS_INFO[chainId];

  try {
    // Get native balance with rotation
    const nativeBalance = await getBalance(chainId, account);

    const paddedAccount = account.replace('0x', '').padStart(64, '0');
    const ERC20_BALANCE_OF_SELECTOR = getFunctionSelector('balanceOf(address)');

    // Prepare calls for the Multicall contract
    const calls = tokenAddresses.map(token => {
      const callData = `0x${ERC20_BALANCE_OF_SELECTOR}${paddedAccount}`;
      return {
        target: token,
        callData,
      };
    });

    const encodedData = encodeMulticallInput(false, calls);

    // Call multicall with rotation
    const result = await ethCall(chainId, multiCall, encodedData);

    // Decode balances from the multicall output
    const decodedBalances = decodeMulticallOutput(result);

    // Map balances to token addresses
    const balancesMap = tokenAddresses.reduce(
      (acc, token, index) => ({
        ...acc,
        [token]: decodedBalances[index],
      }),
      {} as Record<string, bigint>,
    );
    balancesMap[NATIVE_TOKEN_ADDRESS.toLowerCase()] = nativeBalance;

    return balancesMap;
  } catch (error) {
    console.error('Failed to fetch balances:', error);
    return {};
  }
};

// Helper to manually encode ABI data
export const encodeMulticallInput = (
  requireSuccess: boolean,
  calls: { target: string; callData: string }[],
): string => {
  const functionSelector = getFunctionSelector('tryBlockAndAggregate(bool,(address,bytes)[])');

  // Encode `requireSuccess` as a 32-byte boolean
  const requireSuccessEncoded = requireSuccess ? '01'.padStart(64, '0') : '00'.padStart(64, '0');

  // `callsOffset` is fixed at 64 bytes (0x40 in hex)
  const offset = '40'.padStart(64, '0');

  const callsLength = calls.length.toString(16).padStart(64, '0');

  const encodedCalls = calls.map(call => {
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

  const encodedDynamicDataLocaitons = dynamicDataLocaitons.map(location => location.toString(16).padStart(64, '0'));

  const dynamicData = encodedDynamicDataLocaitons.join('') + encodedCalls.join('');

  return `0x${staticPart}${dynamicData}`;
};

// Decode the results from the Multicall response
export const decodeMulticallOutput = (result: string | undefined): bigint[] => {
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

    const returnDataHex = '0x' + (currentData.slice(currentOffset, currentOffset + currentDataLength * 2) || '0');

    returnData.push({ success, returnData: returnDataHex });
  }

  return returnData.map(item => {
    if (item.success) return BigInt(item.returnData);
    return BigInt(0);
  });
};

const encodeBytes = (data: string) => {
  const length = data.length / 2; // Hex string length divided by 2 for bytes
  const lengthEncoded = length.toString(16).padStart(64, '0');
  const paddedData = data.padEnd(Math.ceil(data.length / 64) * 64, '0');

  return lengthEncoded + paddedData;
};
