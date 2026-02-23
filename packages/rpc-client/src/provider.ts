import { getRpcClient } from './client';
import { isChainSupported } from './endpoints';
import { RpcClientConfig } from './types';

/**
 * Network type for compatibility
 */
interface Network {
  chainId: number;
  name: string;
}

/**
 * Transaction params for eth_call and eth_estimateGas
 */
interface TransactionParams {
  to?: string;
  data?: string;
  from?: string;
  value?: string;
  transaction?: {
    to?: string;
    data?: string;
    from?: string;
  };
  address?: string;
  blockTag?: string;
  includeTransactions?: boolean;
  transactionHash?: string;
}

/**
 * A JSON-RPC provider that automatically rotates between endpoints
 * and falls back to Kyber RPC when all public endpoints fail.
 *
 * This is a drop-in replacement for StaticJsonRpcProvider that adds:
 * - Automatic endpoint rotation on rate limit (429) errors
 * - Health tracking for endpoints (shared via RpcClient singleton)
 * - Fallback to Kyber RPC
 *
 * @example
 * ```typescript
 * // Instead of:
 * const provider = new StaticJsonRpcProvider(rpcUrl, chainId)
 *
 * // Use:
 * const provider = new RotatingJsonRpcProvider(chainId)
 * ```
 */
export class RotatingJsonRpcProvider {
  private readonly chainId: number;
  private readonly network: Network;
  private readonly config: Partial<RpcClientConfig>;

  // For ethers.js compatibility
  readonly _isProvider: boolean = true;
  pollingInterval: number = 12000;

  constructor(chainId: number, networkName?: string, config?: Partial<RpcClientConfig>) {
    this.chainId = chainId;
    this.network = {
      chainId,
      name: networkName || `chain-${chainId}`,
    };
    this.config = config || {};

    if (!isChainSupported(chainId) && !config?.customEndpoints?.length) {
      throw new Error(`No RPC endpoints configured for chain ${chainId}`);
    }
  }

  /**
   * Get the network this provider is connected to.
   */
  async getNetwork(): Promise<Network> {
    return this.network;
  }

  /**
   * Detect the network (returns cached network for static provider).
   */
  async detectNetwork(): Promise<Network> {
    return this.network;
  }

  /**
   * Get the current block number.
   */
  async getBlockNumber(): Promise<number> {
    const result = await this.send('eth_blockNumber', []);
    return parseInt(result as string, 16);
  }

  /**
   * Get the balance of an address.
   */
  async getBalance(address: string, blockTag?: string): Promise<bigint> {
    const result = await this.send('eth_getBalance', [address, blockTag || 'latest']);
    return BigInt(result as string);
  }

  /**
   * Get a block by number or tag.
   */
  async getBlock(blockHashOrBlockTag: string | number): Promise<unknown> {
    const blockTag =
      typeof blockHashOrBlockTag === 'number' ? `0x${blockHashOrBlockTag.toString(16)}` : blockHashOrBlockTag;

    return this.send('eth_getBlockByNumber', [blockTag, false]);
  }

  /**
   * Get a transaction receipt.
   */
  async getTransactionReceipt(transactionHash: string): Promise<unknown> {
    return this.send('eth_getTransactionReceipt', [transactionHash]);
  }

  /**
   * Call a contract method.
   */
  async call(transaction: { to: string; data: string; from?: string }, blockTag?: string): Promise<string> {
    return this.send('eth_call', [transaction, blockTag || 'latest']) as Promise<string>;
  }

  /**
   * Estimate gas for a transaction.
   */
  async estimateGas(transaction: { to: string; data?: string; from?: string; value?: string }): Promise<bigint> {
    const result = await this.send('eth_estimateGas', [transaction]);
    return BigInt(result as string);
  }

  /**
   * Get the current gas price.
   */
  async getGasPrice(): Promise<bigint> {
    const result = await this.send('eth_gasPrice', []);
    return BigInt(result as string);
  }

  /**
   * Send a raw RPC request with automatic rotation.
   */
  async send(method: string, params: unknown[]): Promise<unknown> {
    const client = getRpcClient(this.chainId, this.config);
    return client.call(method, params);
  }

  /**
   * Perform an RPC request (alias for send, for ethers.js compatibility).
   */
  async perform(method: string, params: unknown): Promise<unknown> {
    // Convert ethers.js params format to JSON-RPC format
    const rpcParams = this.convertParams(method, params as TransactionParams);
    return this.send(method, rpcParams);
  }

  /**
   * Add an event listener (stub for ethers.js compatibility).
   */
  on(_eventName: string, _listener: (...args: unknown[]) => void): this {
    // For block events, we could implement polling here
    // For now, this is a stub
    return this;
  }

  /**
   * Remove an event listener (stub for ethers.js compatibility).
   */
  off(_eventName: string, _listener?: (...args: unknown[]) => void): this {
    return this;
  }

  /**
   * Remove all event listeners (stub for ethers.js compatibility).
   */
  removeAllListeners(_eventName?: string): this {
    return this;
  }

  /**
   * Get the number of listeners (stub for ethers.js compatibility).
   */
  listenerCount(_eventName?: string): number {
    return 0;
  }

  /**
   * Get all listeners (stub for ethers.js compatibility).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  listeners(_eventName?: string): Array<(...args: unknown[]) => void> {
    return [];
  }

  private convertParams(method: string, params: TransactionParams): unknown[] {
    // Convert ethers.js style params to JSON-RPC array style
    switch (method) {
      case 'eth_call':
        return [
          {
            to: params.transaction?.to || params.to,
            data: params.transaction?.data || params.data,
            from: params.transaction?.from || params.from,
          },
          params.blockTag || 'latest',
        ];
      case 'eth_getBalance':
        return [params.address, params.blockTag || 'latest'];
      case 'eth_getBlockByNumber':
        return [params.blockTag, params.includeTransactions ?? false];
      case 'eth_getTransactionReceipt':
        return [params.transactionHash];
      case 'eth_estimateGas':
        return [params.transaction || params];
      default:
        return Object.values(params);
    }
  }
}

/**
 * Create a RotatingJsonRpcProvider instance.
 * This is a factory function for easier usage.
 */
export function createRotatingProvider(
  chainId: number,
  networkName?: string,
  config?: Partial<RpcClientConfig>,
): RotatingJsonRpcProvider {
  return new RotatingJsonRpcProvider(chainId, networkName, config);
}
