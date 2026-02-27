import { ChainId, NETWORKS_INFO } from '@kyber/schema';

import { getKyberRpcEndpoint, getRpcEndpoints } from './endpoints';
import {
  AllEndpointsFailedError,
  EndpointHealth,
  JsonRpcRequest,
  JsonRpcResponse,
  RpcCallResult,
  RpcClientConfig,
  RpcError,
  RpcEventHandlers,
} from './types';

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_RETRIES_PER_ENDPOINT = 1;
const DEFAULT_ENDPOINT_COOLDOWN_MS = 60000; // 1 minute

/**
 * RPC Client with automatic endpoint rotation and fallback.
 *
 * Features:
 * - Round-robin rotation through public endpoints
 * - Automatic retry on rate limit (429) errors
 * - Health tracking for endpoints
 * - Kyber RPC fallback when all public endpoints fail
 * - Optional telemetry hooks for monitoring
 *
 * @example
 * ```typescript
 * const client = new RpcClient({ chainId: 1 });
 * const blockNumber = await client.call<string>('eth_blockNumber', []);
 * ```
 */
export class RpcClient {
  private readonly chainId: number;
  private readonly endpoints: string[];
  private readonly kyberEndpoint: string | undefined;
  private readonly defaultRpcEndpoint: string | undefined;
  private readonly configRpcEndpoint: string | undefined;
  private readonly useKyberFallback: boolean;
  private readonly timeout: number;
  private readonly maxRetriesPerEndpoint: number;
  private readonly endpointCooldownMs: number;
  private readonly headers: Record<string, string>;
  private readonly eventHandlers: RpcEventHandlers;

  private currentIndex = 0;
  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private requestId = 1;

  constructor(config: RpcClientConfig) {
    this.chainId = config.chainId;
    this.endpoints = config.customEndpoints?.length ? config.customEndpoints : getRpcEndpoints(config.chainId);
    this.kyberEndpoint = getKyberRpcEndpoint(config.chainId);
    this.defaultRpcEndpoint = NETWORKS_INFO[config.chainId as ChainId]?.defaultRpc;
    this.configRpcEndpoint = config.configRpcEndpoint;
    this.useKyberFallback = config.useKyberFallback ?? true;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetriesPerEndpoint = config.maxRetriesPerEndpoint ?? DEFAULT_MAX_RETRIES_PER_ENDPOINT;
    this.endpointCooldownMs = config.endpointCooldownMs ?? DEFAULT_ENDPOINT_COOLDOWN_MS;
    this.headers = config.headers ?? {};
    this.eventHandlers = config.eventHandlers ?? {};

    // Initialize health tracking
    for (const endpoint of this.endpoints) {
      this.endpointHealth.set(endpoint, {
        url: endpoint,
        consecutiveFailures: 0,
        isHealthy: true,
      });
    }
  }

  getChainId(): number {
    return this.chainId;
  }

  /**
   * Make an RPC call with automatic rotation and fallback.
   *
   * @param method - JSON-RPC method name (e.g., 'eth_call', 'eth_getBalance')
   * @param params - Method parameters
   * @returns The RPC response result
   * @throws {AllEndpointsFailedError} When all endpoints (including Kyber fallback) fail
   * @throws {RpcError} When RPC returns an error response
   *
   * @example
   * ```typescript
   * const blockNumber = await client.call<string>('eth_blockNumber', []);
   * const balance = await client.call<string>('eth_getBalance', [address, 'latest']);
   * ```
   */
  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    // Try all public endpoints
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.getNextHealthyEndpoint();
      if (!endpoint) break;

      for (let retry = 0; retry < this.maxRetriesPerEndpoint; retry++) {
        try {
          const result = await this.fetchRpc<T>(endpoint, method, params);
          this.markEndpointHealthy(endpoint);
          this.eventHandlers.onSuccess?.(this.chainId, endpoint, method, result.latencyMs);
          return result.result;
        } catch (error) {
          const err = error as Error;
          this.eventHandlers.onError?.(this.chainId, endpoint, method, err);

          if (this.isRateLimitError(err)) {
            this.markEndpointFailed(endpoint);
            this.eventHandlers.onRateLimit?.(this.chainId, endpoint);
            errors.push({ endpoint, error: err });
            break; // Move to next endpoint immediately on rate limit
          }

          if (this.isRetryableError(err) && retry < this.maxRetriesPerEndpoint - 1) {
            continue; // Retry same endpoint
          }

          if (!this.isRetryableError(err)) {
            // Deterministic error (e.g., execution reverted) — throw immediately,
            // rotating to other endpoints won't help
            throw err;
          }

          this.markEndpointFailed(endpoint);
          errors.push({ endpoint, error: err });
          break; // Move to next endpoint
        }
      }
    }

    // Fallback to Kyber RPC
    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        this.eventHandlers.onFallback?.(this.chainId, this.kyberEndpoint);
        const result = await this.fetchRpc<T>(this.kyberEndpoint, method, params);
        this.eventHandlers.onSuccess?.(this.chainId, this.kyberEndpoint, method, result.latencyMs);
        return result.result;
      } catch (error) {
        this.eventHandlers.onError?.(this.chainId, this.kyberEndpoint, method, error as Error);
        errors.push({ endpoint: this.kyberEndpoint, error: error as Error });
      }
    }

    // Fallback to config RPC (from ks-setting API)
    const configFallback = this.getConfigFallbackEndpoint();
    if (configFallback) {
      try {
        const result = await this.fetchRpc<T>(configFallback, method, params);
        return result.result;
      } catch (error) {
        errors.push({ endpoint: configFallback, error: error as Error });
      }
    }

    // Final fallback to defaultRpc from NETWORKS_INFO
    const defaultFallback = this.getDefaultFallbackEndpoint(configFallback);
    if (defaultFallback) {
      try {
        const result = await this.fetchRpc<T>(defaultFallback, method, params);
        return result.result;
      } catch (error) {
        errors.push({ endpoint: defaultFallback, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  /**
   * Make an RPC call and return result with metadata.
   */
  async callWithMetadata<T>(method: string, params: unknown[] = []): Promise<RpcCallResult<T>> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    // Try all public endpoints
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.getNextHealthyEndpoint();
      if (!endpoint) break;

      for (let retry = 0; retry < this.maxRetriesPerEndpoint; retry++) {
        try {
          const result = await this.fetchRpc<T>(endpoint, method, params);
          this.markEndpointHealthy(endpoint);
          return result;
        } catch (error) {
          const err = error as Error;

          if (this.isRateLimitError(err)) {
            this.markEndpointFailed(endpoint);
            errors.push({ endpoint, error: err });
            break;
          }

          if (this.isRetryableError(err) && retry < this.maxRetriesPerEndpoint - 1) {
            continue;
          }

          if (!this.isRetryableError(err)) {
            throw err;
          }

          this.markEndpointFailed(endpoint);
          errors.push({ endpoint, error: err });
          break;
        }
      }
    }

    // Fallback to Kyber RPC
    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        return await this.fetchRpc<T>(this.kyberEndpoint, method, params);
      } catch (error) {
        errors.push({ endpoint: this.kyberEndpoint, error: error as Error });
      }
    }

    // Fallback to config RPC (from ks-setting API)
    const configFallback2 = this.getConfigFallbackEndpoint();
    if (configFallback2) {
      try {
        return await this.fetchRpc<T>(configFallback2, method, params);
      } catch (error) {
        errors.push({ endpoint: configFallback2, error: error as Error });
      }
    }

    // Final fallback to defaultRpc from NETWORKS_INFO
    const defaultFallback2 = this.getDefaultFallbackEndpoint(configFallback2);
    if (defaultFallback2) {
      try {
        return await this.fetchRpc<T>(defaultFallback2, method, params);
      } catch (error) {
        errors.push({ endpoint: defaultFallback2, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  /**
   * Make a batch RPC call.
   */
  async batchCall<T extends unknown[]>(calls: Array<{ method: string; params?: unknown[] }>): Promise<T> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    // Try all public endpoints
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.getNextHealthyEndpoint();
      if (!endpoint) break;

      try {
        const result = await this.fetchBatchRpc<T>(endpoint, calls);
        this.markEndpointHealthy(endpoint);
        return result;
      } catch (error) {
        const err = error as Error;
        this.markEndpointFailed(endpoint);
        errors.push({ endpoint, error: err });

        if (!this.isRateLimitError(err) && !this.isRetryableError(err)) {
          // Non-retryable error, throw immediately
          throw err;
        }
      }
    }

    // Fallback to Kyber RPC
    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        return await this.fetchBatchRpc<T>(this.kyberEndpoint, calls);
      } catch (error) {
        errors.push({ endpoint: this.kyberEndpoint, error: error as Error });
      }
    }

    // Fallback to config RPC (from ks-setting API)
    const configFallback3 = this.getConfigFallbackEndpoint();
    if (configFallback3) {
      try {
        return await this.fetchBatchRpc<T>(configFallback3, calls);
      } catch (error) {
        errors.push({ endpoint: configFallback3, error: error as Error });
      }
    }

    // Final fallback to defaultRpc from NETWORKS_INFO
    const defaultFallback3 = this.getDefaultFallbackEndpoint(configFallback3);
    if (defaultFallback3) {
      try {
        return await this.fetchBatchRpc<T>(defaultFallback3, calls);
      } catch (error) {
        errors.push({ endpoint: defaultFallback3, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  /**
   * Get the current endpoint being used.
   */
  getCurrentEndpoint(): string | undefined {
    return this.endpoints[this.currentIndex];
  }

  /**
   * Get health status of all endpoints.
   */
  getEndpointHealth(): EndpointHealth[] {
    return Array.from(this.endpointHealth.values());
  }

  /**
   * Reset health status of all endpoints.
   */
  resetHealth(): void {
    for (const endpoint of this.endpoints) {
      this.endpointHealth.set(endpoint, {
        url: endpoint,
        consecutiveFailures: 0,
        isHealthy: true,
      });
    }
    this.currentIndex = 0;
  }

  private async fetchRpc<T>(endpoint: string, method: string, params: unknown[]): Promise<RpcCallResult<T>> {
    const startTime = Date.now();

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new RpcError(429, 'Rate limit exceeded');
        }
        throw new RpcError(response.status, `HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as JsonRpcResponse<T>;

      if (data.error) {
        throw new RpcError(data.error.code, data.error.message, data.error.data);
      }

      if (data.result === undefined) {
        throw new RpcError(-1, 'No result in response');
      }

      return {
        result: data.result,
        endpoint,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof RpcError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new RpcError(-1, `Request timeout after ${this.timeout}ms`);
      }

      throw new RpcError(-1, (error as Error).message);
    }
  }

  private async fetchBatchRpc<T extends unknown[]>(
    endpoint: string,
    calls: Array<{ method: string; params?: unknown[] }>,
  ): Promise<T> {
    const requests: JsonRpcRequest[] = calls.map((call, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: call.method,
      params: call.params ?? [],
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(requests),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new RpcError(429, 'Rate limit exceeded');
        }
        throw new RpcError(response.status, `HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as JsonRpcResponse[];

      // Sort by id to maintain order
      const sortedData = data.sort((a, b) => Number(a.id) - Number(b.id));

      const results: unknown[] = [];
      for (const item of sortedData) {
        if (item.error) {
          throw new RpcError(item.error.code, item.error.message, item.error.data);
        }
        results.push(item.result);
      }

      return results as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof RpcError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new RpcError(-1, `Request timeout after ${this.timeout}ms`);
      }

      throw new RpcError(-1, (error as Error).message);
    }
  }

  private getNextHealthyEndpoint(): string | undefined {
    const now = Date.now();
    const startIndex = this.currentIndex;

    // Try to find a healthy endpoint
    do {
      const endpoint = this.endpoints[this.currentIndex];
      const health = this.endpointHealth.get(endpoint);

      // Check if endpoint has recovered from cooldown
      if (health && !health.isHealthy && health.failedAt) {
        if (now - health.failedAt >= this.endpointCooldownMs) {
          health.isHealthy = true;
          health.consecutiveFailures = 0;
          health.failedAt = undefined;
        }
      }

      this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;

      if (health?.isHealthy) {
        return endpoint;
      }
    } while (this.currentIndex !== startIndex);

    // All endpoints are unhealthy, return the first one anyway
    // (it might have recovered)
    return this.endpoints[0];
  }

  private markEndpointFailed(endpoint: string): void {
    const health = this.endpointHealth.get(endpoint);
    if (health) {
      health.consecutiveFailures++;
      health.failedAt = Date.now();

      // Mark as unhealthy after consecutive failures
      if (health.consecutiveFailures >= 2) {
        health.isHealthy = false;
      }
    }
  }

  private markEndpointHealthy(endpoint: string): void {
    const health = this.endpointHealth.get(endpoint);
    if (health) {
      health.consecutiveFailures = 0;
      health.isHealthy = true;
      health.failedAt = undefined;
    }
  }

  private isRateLimitError(error: Error): boolean {
    if (error instanceof RpcError && error.code === 429) {
      return true;
    }

    const message = error.message.toLowerCase();
    return message.includes('rate limit') || message.includes('too many requests') || message.includes('429');
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof RpcError) {
      // Retryable RPC error codes
      const retryableCodes = [-32000, -32603, -1]; // Server error, internal error, timeout
      return retryableCodes.includes(error.code);
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    );
  }

  /**
   * Get config RPC endpoint if it's not already tried as public or Kyber endpoint.
   */
  private getConfigFallbackEndpoint(): string | undefined {
    if (!this.configRpcEndpoint) return undefined;
    if (this.configRpcEndpoint === this.kyberEndpoint) return undefined;
    if (this.endpoints.includes(this.configRpcEndpoint)) return undefined;
    return this.configRpcEndpoint;
  }

  /**
   * Get default RPC endpoint if it's not already tried as public, Kyber, or config endpoint.
   */
  private getDefaultFallbackEndpoint(configFallback: string | undefined): string | undefined {
    if (!this.defaultRpcEndpoint) return undefined;
    if (this.defaultRpcEndpoint === this.kyberEndpoint) return undefined;
    if (this.defaultRpcEndpoint === configFallback) return undefined;
    if (this.endpoints.includes(this.defaultRpcEndpoint)) return undefined;
    return this.defaultRpcEndpoint;
  }
}

// Singleton instances per chain - keyed by chainId only for proper health tracking sharing
const clientInstances: Map<number, RpcClient> = new Map();

/**
 * Get or create an RpcClient instance for a chain.
 *
 * Uses singleton pattern to reuse health tracking across calls.
 * Note: Only chainId is used as cache key, so custom config is only applied on first creation.
 *
 * @param chainId - The chain ID to get client for
 * @param config - Optional configuration (only applied on first creation for this chainId)
 * @returns RpcClient instance for the chain
 *
 * @example
 * ```typescript
 * const client = getRpcClient(1); // Ethereum mainnet
 * const result = await client.call('eth_blockNumber', []);
 * ```
 */
export function getRpcClient(chainId: number, config?: Partial<RpcClientConfig>): RpcClient {
  let client = clientInstances.get(chainId);
  if (!client) {
    client = new RpcClient({ chainId, ...config });
    clientInstances.set(chainId, client);
  }

  return client;
}

/**
 * Clear all cached RpcClient instances.
 * Useful for testing or when you need to reset all health tracking.
 */
export function clearRpcClients(): void {
  clientInstances.clear();
}
