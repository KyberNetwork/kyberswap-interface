import { buildRpcErrorMessage, getRpcClient, postJsonRpc } from './client';
import { JsonRpcResponse, RpcClientConfig, RpcError } from './types';

/**
 * Options for rpcFetch
 */
export interface RpcFetchOptions extends Partial<RpcClientConfig> {
  /** Specific RPC URL to use (bypasses rotation - chainId is ignored when this is set) */
  rpcUrl?: string;
}

/**
 * Make a JSON-RPC call with automatic endpoint rotation.
 *
 * This is a drop-in replacement for direct fetch calls to RPC endpoints.
 *
 * @param chainId - The chain ID (ignored if options.rpcUrl is provided)
 * @param method - JSON-RPC method name
 * @param params - Method parameters
 * @param options - Optional configuration
 * @returns The RPC response result
 *
 * @example
 * ```typescript
 * // With automatic rotation:
 * const balance = await rpcFetch<string>(1, 'eth_getBalance', [address, 'latest']);
 *
 * // With specific RPC URL (chainId is ignored):
 * const balance = await rpcFetch<string>(0, 'eth_getBalance', [address, 'latest'], {
 *   rpcUrl: 'https://my-custom-rpc.com',
 * });
 * ```
 */
export async function rpcFetch<T>(
  chainId: number,
  method: string,
  params: unknown[] = [],
  options?: RpcFetchOptions,
): Promise<T> {
  // If a specific RPC URL is provided, use it directly without rotation
  // Note: chainId is ignored in this case
  if (options?.rpcUrl) {
    return fetchDirectRpc<T>(options.rpcUrl, method, params, options.timeout);
  }

  const client = getRpcClient(chainId, options);
  return client.call<T>(method, params);
}

/**
 * Make a direct RPC call to a specific URL without rotation.
 * This is a convenience function for legacy code that has a specific RPC URL.
 *
 * @param rpcUrl - The RPC endpoint URL
 * @param method - JSON-RPC method name
 * @param params - Method parameters
 * @param timeout - Optional timeout in milliseconds
 * @returns The RPC response result
 *
 * @example
 * ```typescript
 * const balance = await directRpcFetch<string>(
 *   'https://my-rpc.com',
 *   'eth_getBalance',
 *   [address, 'latest'],
 * );
 * ```
 */
export async function directRpcFetch<T>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
  timeout?: number,
): Promise<T> {
  return fetchDirectRpc<T>(rpcUrl, method, params, timeout);
}

/**
 * Make a batch JSON-RPC call with automatic endpoint rotation.
 *
 * Usage:
 * ```typescript
 * const [balance, blockNumber] = await rpcBatchFetch<[string, string]>(chainId, [
 *   { method: 'eth_getBalance', params: [address, 'latest'] },
 *   { method: 'eth_blockNumber', params: [] },
 * ]);
 * ```
 */
export async function rpcBatchFetch<T extends unknown[]>(
  chainId: number,
  calls: Array<{ method: string; params?: unknown[] }>,
  options?: RpcFetchOptions,
): Promise<T> {
  const client = getRpcClient(chainId, options);
  return client.batchCall<T>(calls);
}

/**
 * Direct RPC fetch without rotation (for when you have a specific URL).
 * Still includes timeout and error handling. With nowhere to rotate to, the budget is a generous
 * one: cutting a lone endpoint short only turns a slow answer into no answer.
 */
async function fetchDirectRpc<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
  timeout: number = 10000,
): Promise<T> {
  const data = await postJsonRpc<JsonRpcResponse<T>>(
    rpcUrl,
    method,
    { jsonrpc: '2.0', id: 1, method, params },
    timeout,
  );
  if (data.error) {
    throw new RpcError(
      data.error.code,
      buildRpcErrorMessage(rpcUrl, method, `JSON-RPC error ${data.error.code}: ${data.error.message}`, data.error.code),
      data.error.data,
      { kind: 'rpc', nodeMessage: data.error.message },
    );
  }
  if (data.result === undefined) {
    throw new RpcError(-1, buildRpcErrorMessage(rpcUrl, method, 'No result in response'), undefined, {
      kind: 'network',
    });
  }
  return data.result;
}

// ============================================================================
// Convenience functions for common RPC methods
// ============================================================================

/**
 * Get native token balance.
 */
export async function getBalance(
  chainId: number,
  address: string,
  blockTag: string = 'latest',
  options?: RpcFetchOptions,
): Promise<bigint> {
  const result = await rpcFetch<string>(chainId, 'eth_getBalance', [address, blockTag], options);
  return BigInt(result);
}

/**
 * Get current block number.
 */
export async function getBlockNumber(chainId: number, options?: RpcFetchOptions): Promise<number> {
  const result = await rpcFetch<string>(chainId, 'eth_blockNumber', [], options);
  return parseInt(result, 16);
}

/**
 * Get current gas price.
 */
export async function getGasPrice(chainId: number, options?: RpcFetchOptions): Promise<bigint> {
  const result = await rpcFetch<string>(chainId, 'eth_gasPrice', [], options);
  return BigInt(result);
}

/**
 * Call a contract method (read-only).
 */
export async function ethCall(
  chainId: number,
  to: string,
  data: string,
  blockTag: string = 'latest',
  options?: RpcFetchOptions,
): Promise<string> {
  return rpcFetch<string>(chainId, 'eth_call', [{ to, data }, blockTag], options);
}

/**
 * Estimate gas for a transaction.
 */
export async function estimateGas(
  chainId: number,
  transaction: {
    from?: string;
    to: string;
    value?: string;
    data?: string;
  },
  options?: RpcFetchOptions,
): Promise<bigint> {
  const result = await rpcFetch<string>(chainId, 'eth_estimateGas', [transaction], options);
  return BigInt(result);
}

/**
 * Get transaction receipt.
 */
export async function getTransactionReceipt(
  chainId: number,
  txHash: string,
  options?: RpcFetchOptions,
): Promise<{
  status: string;
  blockNumber: string;
  transactionHash: string;
  gasUsed: string;
} | null> {
  return rpcFetch(chainId, 'eth_getTransactionReceipt', [txHash], options);
}

/**
 * Get block by number or tag.
 */
export async function getBlock(
  chainId: number,
  blockTag: string | number,
  includeTransactions: boolean = false,
  options?: RpcFetchOptions,
): Promise<unknown> {
  const tag = typeof blockTag === 'number' ? `0x${blockTag.toString(16)}` : blockTag;
  return rpcFetch(chainId, 'eth_getBlockByNumber', [tag, includeTransactions], options);
}
