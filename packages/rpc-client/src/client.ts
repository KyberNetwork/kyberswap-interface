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
const DEFAULT_RACE_CONCURRENCY = 3;
const DEFAULT_MAX_BLOCK_LAG = 50;
const DEFAULT_PROBE_INTERVAL_MS = 60000; // 1 minute

/**
 * RPC Client with automatic endpoint racing, health probing, and fallback.
 *
 * Features:
 * - Race multiple endpoints in parallel, use fastest response
 * - Background block freshness probing to detect stale endpoints
 * - Health tracking with cooldown for failed endpoints
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
  private configRpcEndpoint: string | undefined;
  private readonly useKyberFallback: boolean;
  private readonly timeout: number;
  private readonly maxRetriesPerEndpoint: number;
  private readonly endpointCooldownMs: number;
  private readonly headers: Record<string, string>;
  private readonly eventHandlers: RpcEventHandlers;
  private readonly raceConcurrency: number;
  private readonly maxBlockLag: number;
  private readonly probeIntervalMs: number;

  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private requestId = 1;
  private probeTimer: ReturnType<typeof setInterval> | undefined;
  private isProbing = false;

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
    this.raceConcurrency = config.raceConcurrency ?? DEFAULT_RACE_CONCURRENCY;
    this.maxBlockLag = config.maxBlockLag ?? DEFAULT_MAX_BLOCK_LAG;
    this.probeIntervalMs = config.probeIntervalMs ?? DEFAULT_PROBE_INTERVAL_MS;

    // Initialize health tracking
    for (const endpoint of this.endpoints) {
      this.endpointHealth.set(endpoint, {
        url: endpoint,
        consecutiveFailures: 0,
        isHealthy: true,
      });
    }

    // Start background probing
    if (this.endpoints.length > 1 && this.probeIntervalMs > 0) {
      this.probeEndpoints();
      this.probeTimer = setInterval(() => this.probeEndpoints(), this.probeIntervalMs);
    }
  }

  getChainId(): number {
    return this.chainId;
  }

  /**
   * Make an RPC call by racing multiple healthy endpoints in parallel.
   * Falls back to Kyber/config/default RPC if all public endpoints fail.
   */
  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    // Try racing public endpoints
    const raceResult = await this.raceEndpoints<RpcCallResult<T>>(
      (endpoint, signal) => this.fetchRpc<T>(endpoint, method, params, signal),
      method,
    );

    if (raceResult) {
      this.eventHandlers.onSuccess?.(this.chainId, raceResult.endpoint, method, raceResult.latencyMs);
      return raceResult.result;
    }

    // Fallback chain
    return this.fallbackCall<T>(method, params);
  }

  /**
   * Make an RPC call and return result with metadata.
   */
  async callWithMetadata<T>(method: string, params: unknown[] = []): Promise<RpcCallResult<T>> {
    const raceResult = await this.raceEndpoints<RpcCallResult<T>>(
      (endpoint, signal) => this.fetchRpc<T>(endpoint, method, params, signal),
      method,
    );

    if (raceResult) {
      return raceResult;
    }

    return this.fallbackCallWithMetadata<T>(method, params);
  }

  /**
   * Make a batch RPC call by racing multiple endpoints.
   */
  async batchCall<T extends unknown[]>(calls: Array<{ method: string; params?: unknown[] }>): Promise<T> {
    const raceResult = await this.raceEndpoints<T>(
      (endpoint, signal) => this.fetchBatchRpc<T>(endpoint, calls, signal),
      'batch',
    );

    if (raceResult) {
      return raceResult;
    }

    return this.fallbackBatchCall<T>(calls);
  }

  /**
   * Probe all endpoints for block freshness.
   * Marks endpoints returning stale blocks as unhealthy.
   */
  async probeEndpoints(): Promise<void> {
    if (this.isProbing || this.endpoints.length <= 1) return;
    this.isProbing = true;

    try {
      const probeTimeout = 5000;
      const results = await Promise.allSettled(
        this.endpoints.map(async endpoint => {
          const result = await this.fetchRpc<string>(endpoint, 'eth_blockNumber', [], undefined, probeTimeout);
          const block = parseInt(result.result, 16);
          if (!Number.isFinite(block)) throw new Error('Invalid block number');
          return { endpoint, block, latency: result.latencyMs };
        }),
      );

      // Find max block across all successful responses
      let maxBlock = 0;
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.block > maxBlock) {
          maxBlock = r.value.block;
        }
      }

      if (maxBlock === 0) return; // All probes failed, don't change health

      // Mark stale endpoints as unhealthy
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const lag = maxBlock - r.value.block;
          if (lag > this.maxBlockLag) {
            this.markEndpointFailed(r.value.endpoint);
            // Force unhealthy immediately (don't wait for 2 consecutive failures)
            const health = this.endpointHealth.get(r.value.endpoint);
            if (health) {
              health.isHealthy = false;
            }
          } else {
            this.markEndpointHealthy(r.value.endpoint);
          }
        } else {
          // Probe failed — mark failed but don't force unhealthy
          // (transient network issues shouldn't immediately block an endpoint)
        }
      }
    } catch {
      // Probing is best-effort, don't let it break anything
    } finally {
      this.isProbing = false;
    }
  }

  /**
   * Stop background probing. Call this when the client is no longer needed.
   */
  destroy(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = undefined;
    }
  }

  /**
   * Get the first healthy endpoint.
   */
  getCurrentEndpoint(): string | undefined {
    const healthy = this.getHealthyEndpoints();
    return healthy[0] ?? this.endpoints[0];
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
  }

  /**
   * Update the config RPC endpoint on an existing instance.
   * Used when ks-setting API returns a new RPC URL at runtime.
   */
  updateConfigEndpoint(configRpcEndpoint: string): void {
    this.configRpcEndpoint = configRpcEndpoint;
  }

  // ─── Race logic ──────────────────────────────────────────────────────

  /**
   * Race N healthy endpoints in parallel. Returns the first successful result,
   * or null if all fail (caller should then try fallbacks).
   *
   * Non-retryable errors (e.g. execution reverted) are thrown immediately
   * because switching endpoints won't help.
   */
  private async raceEndpoints<T>(
    fn: (endpoint: string, signal: AbortSignal) => Promise<T>,
    method = '',
  ): Promise<T | null> {
    const healthyEndpoints = this.getHealthyEndpoints();
    if (healthyEndpoints.length === 0) return null;

    // Limit race concurrency: never use more than half (rounded up) of available endpoints
    // so we always keep some endpoints un-hit to avoid burning all of them at once.
    // e.g. 2 endpoints → race 1, 3 → race 2, 4 → race 2, 5 → race 3, 6 → race 3
    const maxRace = Math.max(1, Math.ceil(healthyEndpoints.length / 2));
    const effectiveConcurrency = Math.min(this.raceConcurrency, maxRace);
    const candidates = healthyEndpoints.slice(0, effectiveConcurrency);

    // If only 1 candidate, no need for race overhead
    if (candidates.length === 1) {
      try {
        const result = await this.callSingleEndpoint(candidates[0], fn, method);
        return result;
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error; // Non-retryable, throw immediately
        }
        return null;
      }
    }

    const abortController = new AbortController();
    const errors: Array<{ endpoint: string; error: Error }> = [];
    let nonRetryableError: Error | null = null;

    try {
      const result = await new Promise<T>((resolve, reject) => {
        let settled = false;
        let pending = candidates.length;

        for (const endpoint of candidates) {
          fn(endpoint, abortController.signal)
            .then(result => {
              this.markEndpointHealthy(endpoint);
              if (!settled) {
                settled = true;
                resolve(result);
              }
            })
            .catch((error: Error) => {
              this.eventHandlers.onError?.(this.chainId, endpoint, method, error);

              if (this.isRateLimitError(error)) {
                this.markEndpointFailed(endpoint);
                this.eventHandlers.onRateLimit?.(this.chainId, endpoint);
              } else if (!this.isRetryableError(error)) {
                // Non-retryable error — abort race and throw
                nonRetryableError = error;
                if (!settled) {
                  settled = true;
                  reject(error);
                }
                return;
              } else {
                this.markEndpointFailed(endpoint);
              }

              errors.push({ endpoint, error });
              pending--;

              if (pending === 0 && !settled) {
                settled = true;
                reject(new AllEndpointsFailedError(this.chainId, errors));
              }
            });
        }
      });

      return result;
    } catch (error) {
      if (nonRetryableError) {
        throw nonRetryableError;
      }
      // All race candidates failed — return null to trigger fallback
      return null;
    } finally {
      abortController.abort();
    }
  }

  /**
   * Call a single endpoint with retry logic (used when raceConcurrency=1
   * or only 1 healthy endpoint).
   */
  private async callSingleEndpoint<T>(
    endpoint: string,
    fn: (endpoint: string, signal: AbortSignal) => Promise<T>,
    method = '',
  ): Promise<T> {
    for (let retry = 0; retry < this.maxRetriesPerEndpoint; retry++) {
      const controller = new AbortController();
      try {
        const result = await fn(endpoint, controller.signal);
        this.markEndpointHealthy(endpoint);
        return result;
      } catch (error) {
        const err = error as Error;
        this.eventHandlers.onError?.(this.chainId, endpoint, method, err);

        if (this.isRateLimitError(err)) {
          this.markEndpointFailed(endpoint);
          this.eventHandlers.onRateLimit?.(this.chainId, endpoint);
          throw err;
        }

        if (!this.isRetryableError(err)) {
          throw err;
        }

        if (retry >= this.maxRetriesPerEndpoint - 1) {
          this.markEndpointFailed(endpoint);
          throw err;
        }
      }
    }
    // Unreachable, but TypeScript needs this
    throw new Error('Unreachable');
  }

  // ─── Fallback chain ──────────────────────────────────────────────────

  private async fallbackCall<T>(method: string, params: unknown[]): Promise<T> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    // Fallback to Kyber RPC
    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        this.eventHandlers.onFallback?.(this.chainId, this.kyberEndpoint);
        const result = await this.fetchRpc<T>(this.kyberEndpoint, method, params);
        this.eventHandlers.onSuccess?.(this.chainId, this.kyberEndpoint, method, result.latencyMs);
        return result.result;
      } catch (error) {
        this.eventHandlers.onError?.(this.chainId, this.kyberEndpoint, method, error as Error);
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error; // Non-retryable (e.g. execution reverted), no point trying next fallback
        }
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
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
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
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: defaultFallback, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  private async fallbackCallWithMetadata<T>(method: string, params: unknown[]): Promise<RpcCallResult<T>> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        this.eventHandlers.onFallback?.(this.chainId, this.kyberEndpoint);
        return await this.fetchRpc<T>(this.kyberEndpoint, method, params);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: this.kyberEndpoint, error: error as Error });
      }
    }

    const configFallback = this.getConfigFallbackEndpoint();
    if (configFallback) {
      try {
        return await this.fetchRpc<T>(configFallback, method, params);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: configFallback, error: error as Error });
      }
    }

    const defaultFallback = this.getDefaultFallbackEndpoint(configFallback);
    if (defaultFallback) {
      try {
        return await this.fetchRpc<T>(defaultFallback, method, params);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: defaultFallback, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  private async fallbackBatchCall<T extends unknown[]>(
    calls: Array<{ method: string; params?: unknown[] }>,
  ): Promise<T> {
    const errors: Array<{ endpoint: string; error: Error }> = [];

    if (this.useKyberFallback && this.kyberEndpoint) {
      try {
        this.eventHandlers.onFallback?.(this.chainId, this.kyberEndpoint);
        return await this.fetchBatchRpc<T>(this.kyberEndpoint, calls);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: this.kyberEndpoint, error: error as Error });
      }
    }

    const configFallback = this.getConfigFallbackEndpoint();
    if (configFallback) {
      try {
        return await this.fetchBatchRpc<T>(configFallback, calls);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: configFallback, error: error as Error });
      }
    }

    const defaultFallback = this.getDefaultFallbackEndpoint(configFallback);
    if (defaultFallback) {
      try {
        return await this.fetchBatchRpc<T>(defaultFallback, calls);
      } catch (error) {
        if (!this.isRetryableError(error as Error) && !this.isRateLimitError(error as Error)) {
          throw error;
        }
        errors.push({ endpoint: defaultFallback, error: error as Error });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  // ─── Fetch helpers ───────────────────────────────────────────────────

  private async fetchRpc<T>(
    endpoint: string,
    method: string,
    params: unknown[],
    externalSignal?: AbortSignal,
    timeoutOverride?: number,
  ): Promise<RpcCallResult<T>> {
    const startTime = Date.now();
    const effectiveTimeout = timeoutOverride ?? this.timeout;

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    // If external signal fires (race winner found), abort this request too
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort);

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
        // Distinguish between timeout and external abort (race lost)
        if (externalSignal?.aborted) {
          throw new RpcError(-2, 'Aborted by race winner');
        }
        throw new RpcError(-1, `Request timeout after ${effectiveTimeout}ms`);
      }

      throw new RpcError(-1, (error as Error).message);
    } finally {
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async fetchBatchRpc<T extends unknown[]>(
    endpoint: string,
    calls: Array<{ method: string; params?: unknown[] }>,
    externalSignal?: AbortSignal,
  ): Promise<T> {
    const requests: JsonRpcRequest[] = calls.map((call, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: call.method,
      params: call.params ?? [],
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener('abort', onExternalAbort);

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
        if (externalSignal?.aborted) {
          throw new RpcError(-2, 'Aborted by race winner');
        }
        throw new RpcError(-1, `Request timeout after ${this.timeout}ms`);
      }

      throw new RpcError(-1, (error as Error).message);
    } finally {
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  // ─── Health tracking ─────────────────────────────────────────────────

  /**
   * Get all currently healthy endpoints, recovering any that have passed cooldown.
   */
  private getHealthyEndpoints(): string[] {
    const now = Date.now();
    const healthy: string[] = [];

    for (const endpoint of this.endpoints) {
      const health = this.endpointHealth.get(endpoint);
      if (!health) continue;

      // Check if endpoint has recovered from cooldown
      if (!health.isHealthy && health.failedAt) {
        if (now - health.failedAt >= this.endpointCooldownMs) {
          health.isHealthy = true;
          health.consecutiveFailures = 0;
          health.failedAt = undefined;
        }
      }

      if (health.isHealthy) {
        healthy.push(endpoint);
      }
    }

    return healthy;
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
      // -2 = aborted by race winner, not a real failure
      if (error.code === -2) return false;
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
  } else if (config?.configRpcEndpoint) {
    client.updateConfigEndpoint(config.configRpcEndpoint);
  }

  return client;
}

/**
 * Clear all cached RpcClient instances.
 * Useful for testing or when you need to reset all health tracking.
 */
export function clearRpcClients(): void {
  for (const client of clientInstances.values()) {
    client.destroy();
  }
  clientInstances.clear();
}
