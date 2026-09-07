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

/**
 * One endpoint's share of the wait. Rotation only moves on once the current endpoint has failed or
 * run out of time, so a hop that hangs costs the whole call this long. A healthy endpoint answers a
 * multicall-sized `eth_call` in well under two seconds; three is generous for one and keeps a walk
 * over a full list to tens of seconds rather than minutes.
 */
const DEFAULT_TIMEOUT = 3000;
/**
 * Methods the node itself works on for a while — gas estimation searches for the limit — get a
 * longer budget than a read: giving them a read's three seconds would cut off every honest answer.
 */
const SLOW_METHOD_TIMEOUT_MS = 10000;
const SLOW_METHODS = new Set(['eth_estimateGas']);
const DEFAULT_MAX_RETRIES_PER_ENDPOINT = 1;
const DEFAULT_ENDPOINT_COOLDOWN_MS = 60000; // 1 minute
const DEFAULT_MAX_BLOCK_LAG = 50;
const DEFAULT_PROBE_INTERVAL_MS = 60000; // 1 minute
/**
 * A probe loop follows traffic: it starts with the first call and stops once no call has been made
 * for this long, so a client held for a chain nobody is reading costs the endpoints nothing.
 */
const DEFAULT_PROBE_IDLE_STOP_MS = 5 * 60000;

/**
 * JSON-RPC error codes that every healthy node answers identically, so rotating
 * to another endpoint can't change the outcome: JSON parse/request errors and
 * geth's execution-revert code. Their messages are passed through untouched — no
 * "Rpc issue:" prefix and no `[method @ host]` tag, which would only be misleading
 * noise.
 *
 * `-32601` (method not found) and `-32602` (invalid params) are deliberately NOT
 * here: in a heterogeneous public pool, endpoints disagree on which methods they
 * expose and how strictly they validate params — some Monad gateways reject a
 * valid `eth_estimateGas` with `-32602`, or lack the method entirely (`-32601`),
 * while the canonical nodes answer it fine. Those are endpoint-specific, so they
 * are treated as retryable (see `isRetryableError`) and rotation moves past them.
 * See https://www.jsonrpc.org/specification#error_object and EIP-1474.
 */
const DETERMINISTIC_ERROR_CODES = new Set([
  -32700, // Parse error
  -32600, // Invalid Request
  3, // Execution reverted (EIP-1474)
]);

/**
 * Build a standardized RPC error message.
 *
 * Endpoint/infrastructure failures (rate limits, timeouts, provider outages,
 * malformed responses) are tagged with the originating endpoint host and method
 * and prefixed with "Rpc issue:", so they're easy to spot in UI / logs. Passing
 * a JSON-RPC error `code` that is a deterministic node response (bad request or
 * execution revert) returns the raw detail as-is — the endpoint is healthy and
 * the request/transaction is at fault, so the prefix and endpoint tag would only
 * mislead.
 */
export function buildRpcErrorMessage(endpoint: string, method: string, detail: string, code?: number): string {
  if (code !== undefined && DETERMINISTIC_ERROR_CODES.has(code)) return detail;
  // An execution revert is a deterministic node response no matter which code the
  // endpoint wraps it in (geth uses `3`, others surface it as `-32603`/`-32000`),
  // so pass it through untagged like the codes above.
  if (/execution reverted/i.test(detail)) return detail;
  // Extract host without relying on URL (DOM lib not available in this package).
  // Strip protocol, then take substring up to first `/`, `?`, or `#`.
  const noProto = endpoint.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const host = noProto.split(/[/?#]/, 1)[0] || endpoint;
  return `Rpc issue: [${method} @ ${host}] ${detail}`;
}

/**
 * Coerce a JSON-RPC `error` field into a consistent `{ code, message, data }`.
 *
 * Spec-compliant providers return an object `{ code, message }`, but some public
 * endpoints (e.g. zan.top for unregistered accounts) return `error` as a bare
 * string. Those are coerced to a retryable internal-error code so rotation moves
 * on to the next endpoint, and the original text is kept as the message instead
 * of surfacing "undefined: undefined".
 */
function normalizeRpcError(error: unknown): { code: number; message: string; data?: unknown } {
  if (typeof error === 'string') {
    return { code: -32603, message: error };
  }
  if (error && typeof error === 'object') {
    const e = error as { code?: unknown; message?: unknown; data?: unknown };
    const code = typeof e.code === 'number' ? e.code : -32603;
    const message = typeof e.message === 'string' ? e.message : JSON.stringify(error);
    return { code, message, data: e.data };
  }
  return { code: -32603, message: String(error) };
}

/**
 * One JSON-RPC POST with a real budget. The abort is the polite cancel; the rejection is the
 * guarantee: the fetch and the body read both race the deadline, and the timer lives until the body
 * is parsed, so an endpoint that sends headers and then stalls — or an environment that leaves an
 * aborted fetch pending — cannot hold the call. Every failure is an `RpcError` whose `kind` says
 * whether the endpoint failed (`http`, `timeout`, `network`) or answered; the caller reads the
 * answer's own error out of the parsed body.
 */
export async function postJsonRpc<R>(
  endpoint: string,
  method: string,
  payload: unknown,
  timeoutMs: number,
  headers: Record<string, string> = {},
): Promise<R> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(
        new RpcError(-1, buildRpcErrorMessage(endpoint, method, `Request timeout after ${timeoutMs}ms`), undefined, {
          kind: 'timeout',
        }),
      );
    }, timeoutMs);
  });
  const race = <T>(work: Promise<T>) => Promise.race([work, deadline]);

  try {
    const response = await race(
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }),
    );
    if (!response.ok) {
      const detail =
        response.status === 429 || response.status === 402
          ? 'Rate limit exceeded'
          : response.status >= 500
            ? `Provider unavailable (HTTP ${response.status} ${response.statusText})`
            : `HTTP error ${response.status} ${response.statusText}`;
      throw new RpcError(response.status, buildRpcErrorMessage(endpoint, method, detail), undefined, { kind: 'http' });
    }
    return (await race(response.json())) as R;
  } catch (error) {
    if (error instanceof RpcError) throw error;
    throw new RpcError(
      -1,
      buildRpcErrorMessage(endpoint, method, (error as Error).message || 'Network error'),
      undefined,
      {
        kind: 'network',
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * RPC Client with automatic endpoint rotation, health probing, and fallback.
 *
 * Features:
 * - Round-robin rotation through public endpoints, sorted by probe latency
 * - Block freshness probing while the client is in use, to detect stale/slow endpoints
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
  private endpoints: string[];
  private readonly kyberEndpoint: string | undefined;
  private readonly defaultRpcEndpoint: string | undefined;
  private configRpcEndpoint: string | undefined;
  private readonly useKyberFallback: boolean;
  private readonly timeout: number;
  private readonly maxRetriesPerEndpoint: number;
  private readonly endpointCooldownMs: number;
  private readonly headers: Record<string, string>;
  private readonly eventHandlers: RpcEventHandlers;
  maxBlockLag: number;
  private readonly probeIntervalMs: number;

  private currentIndex = 0;
  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private endpointLatency: Map<string, number> = new Map();
  private requestId = 1;
  private probeTimer: ReturnType<typeof setInterval> | undefined;
  private isProbing = false;
  private lastCallAt = 0;

  constructor(config: RpcClientConfig) {
    this.chainId = config.chainId;
    this.endpoints = [...(config.customEndpoints?.length ? config.customEndpoints : getRpcEndpoints(config.chainId))];
    this.kyberEndpoint = getKyberRpcEndpoint(config.chainId);
    this.defaultRpcEndpoint = NETWORKS_INFO[config.chainId as ChainId]?.defaultRpc;
    this.configRpcEndpoint = config.configRpcEndpoint;
    this.useKyberFallback = config.useKyberFallback ?? true;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetriesPerEndpoint = config.maxRetriesPerEndpoint ?? DEFAULT_MAX_RETRIES_PER_ENDPOINT;
    this.endpointCooldownMs = config.endpointCooldownMs ?? DEFAULT_ENDPOINT_COOLDOWN_MS;
    this.headers = config.headers ?? {};
    this.eventHandlers = config.eventHandlers ?? {};
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
  }

  /**
   * Probing follows traffic: the loop starts with the first call and ends once calls stop, so a
   * client nobody is reading through — or nobody remembered to destroy — costs the endpoints nothing.
   */
  private ensureProbing(): void {
    this.lastCallAt = Date.now();
    if (this.probeTimer || this.endpoints.length <= 1 || this.probeIntervalMs <= 0) return;
    this.probeEndpoints();
    this.probeTimer = setInterval(() => {
      if (Date.now() - this.lastCallAt >= DEFAULT_PROBE_IDLE_STOP_MS) {
        this.destroy();
        return;
      }
      this.probeEndpoints();
    }, this.probeIntervalMs);
  }

  getChainId(): number {
    return this.chainId;
  }

  /**
   * Make an RPC call with automatic rotation and fallback.
   *
   * Public endpoints are tried round-robin, sorted by probe latency, then the KyberSwap, config and
   * default endpoints as last resorts. A deterministic node answer (an execution revert) is thrown
   * at once: rotating cannot change it.
   */
  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    return (await this.callWithMetadata<T>(method, params)).result;
  }

  /**
   * Make an RPC call and return result with metadata.
   */
  async callWithMetadata<T>(method: string, params: unknown[] = []): Promise<RpcCallResult<T>> {
    return this.walk(method, endpoint => this.fetchRpc<T>(endpoint, method, params));
  }

  /**
   * Make a batch RPC call.
   */
  async batchCall<T extends unknown[]>(calls: Array<{ method: string; params?: unknown[] }>): Promise<T> {
    return (await this.walk('batch', endpoint => this.fetchBatchRpc<T>(endpoint, calls))).result;
  }

  /**
   * One pass over the public endpoints, then the last resorts.
   *
   * The pass walks the order the client holds when it starts: a re-ranking that lands mid-pass
   * replaces the array rather than reordering it, so the pass neither revisits nor skips an
   * endpoint. An endpoint that fails to answer, or answers with a rate limit, is benched and the
   * pass moves on; one that answers with a deterministic error ends the call, since no other node
   * would answer differently. With every endpoint benched the first is knocked on once — it may
   * have recovered — and the pass goes straight to the last resorts rather than knocking on the
   * same benched door once per slot.
   */
  private async walk<T>(
    method: string,
    attempt: (endpoint: string) => Promise<RpcCallResult<T>>,
  ): Promise<RpcCallResult<T>> {
    this.ensureProbing();
    const errors: Array<{ endpoint: string; error: Error }> = [];
    const order = this.endpoints;
    let knockedOnBenched = false;

    for (let i = 0; i < order.length; i++) {
      let endpoint = this.nextHealthy(order);
      if (!endpoint) {
        if (knockedOnBenched) break;
        knockedOnBenched = true;
        endpoint = order[0];
      }

      for (let retry = 0; retry < this.maxRetriesPerEndpoint; retry++) {
        try {
          const result = await attempt(endpoint);
          this.markEndpointHealthy(endpoint);
          this.eventHandlers.onSuccess?.(this.chainId, endpoint, method, result.latencyMs);
          return result;
        } catch (error) {
          const err = error as Error;
          this.eventHandlers.onError?.(this.chainId, endpoint, method, err);

          if (this.isRateLimitError(err)) {
            this.markEndpointFailed(endpoint);
            this.eventHandlers.onRateLimit?.(this.chainId, endpoint);
            errors.push({ endpoint, error: err });
            break;
          }
          if (!this.isRetryableError(err)) throw err;
          if (retry >= this.maxRetriesPerEndpoint - 1) {
            this.markEndpointFailed(endpoint);
            errors.push({ endpoint, error: err });
            break;
          }
        }
      }
    }

    return this.lastResorts(method, attempt, errors);
  }

  /**
   * The endpoints tried once the public ones are out, in order: KyberSwap, the one the runtime
   * config named, the chain's default — each only if it is not already one of the others.
   */
  private async lastResorts<T>(
    method: string,
    attempt: (endpoint: string) => Promise<RpcCallResult<T>>,
    errors: Array<{ endpoint: string; error: Error }>,
  ): Promise<RpcCallResult<T>> {
    const configFallback = this.getConfigFallbackEndpoint();
    const candidates = [
      this.useKyberFallback ? this.kyberEndpoint : undefined,
      configFallback,
      this.getDefaultFallbackEndpoint(configFallback),
    ].filter((endpoint): endpoint is string => !!endpoint);

    for (const endpoint of candidates) {
      try {
        if (endpoint === this.kyberEndpoint) this.eventHandlers.onFallback?.(this.chainId, endpoint);
        const result = await attempt(endpoint);
        this.eventHandlers.onSuccess?.(this.chainId, endpoint, method, result.latencyMs);
        return result;
      } catch (error) {
        const err = error as Error;
        this.eventHandlers.onError?.(this.chainId, endpoint, method, err);
        if (!this.isRetryableError(err) && !this.isRateLimitError(err)) throw err;
        errors.push({ endpoint, error: err });
      }
    }

    throw new AllEndpointsFailedError(this.chainId, errors);
  }

  /**
   * Probe all endpoints for block freshness and latency.
   * Marks stale endpoints as unhealthy and sorts endpoints by latency.
   */
  async probeEndpoints(): Promise<void> {
    if (this.isProbing || this.endpoints.length <= 1) return;
    this.isProbing = true;

    try {
      const results = await Promise.allSettled(
        this.endpoints.map(async endpoint => {
          const result = await this.fetchRpc<string>(endpoint, 'eth_blockNumber', [], this.timeout);
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

      // Update health and latency from probe results
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
            // Evict stale latency so the endpoint isn't ranked by outdated data
            this.endpointLatency.delete(r.value.endpoint);
          } else {
            this.markEndpointHealthy(r.value.endpoint);
            this.endpointLatency.set(r.value.endpoint, r.value.latency);
          }
        }
      }

      // Re-sort endpoints by latency (fastest first)
      this.sortEndpointsByLatency();
    } catch {
      // Probing is best-effort, don't let it break anything
    } finally {
      this.isProbing = false;
    }
  }

  /**
   * Stop probing. The next call starts it again, so this is safe to call at any time.
   */
  destroy(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = undefined;
    }
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
    this.endpointLatency.clear();
  }

  /**
   * Update the config RPC endpoint on an existing instance.
   * Used when ks-setting API returns a new RPC URL at runtime.
   */
  updateConfigEndpoint(configRpcEndpoint: string): void {
    this.configRpcEndpoint = configRpcEndpoint;
  }

  // ─── Fallback chain ──────────────────────────────────────────────────

  // ─── Fetch helpers ───────────────────────────────────────────────────

  /** A read's budget, or a slow method's. */
  private budgetFor(method: string): number {
    return SLOW_METHODS.has(method) ? Math.max(this.timeout, SLOW_METHOD_TIMEOUT_MS) : this.timeout;
  }

  private async fetchRpc<T>(
    endpoint: string,
    method: string,
    params: unknown[],
    timeoutOverride?: number,
  ): Promise<RpcCallResult<T>> {
    const startTime = Date.now();
    const request: JsonRpcRequest = { jsonrpc: '2.0', id: this.requestId++, method, params };
    const data = await postJsonRpc<JsonRpcResponse<T>>(
      endpoint,
      method,
      request,
      timeoutOverride ?? this.budgetFor(method),
      this.headers,
    );

    if (data.error) {
      const { code, message, data: errData } = normalizeRpcError(data.error);
      throw new RpcError(
        code,
        buildRpcErrorMessage(endpoint, method, `JSON-RPC error ${code}: ${message}`, code),
        errData,
        {
          kind: 'rpc',
          nodeMessage: message,
        },
      );
    }
    if (data.result === undefined) {
      throw new RpcError(-1, buildRpcErrorMessage(endpoint, method, 'No result in response'), undefined, {
        kind: 'network',
      });
    }
    return { result: data.result, endpoint, latencyMs: Date.now() - startTime };
  }

  private async fetchBatchRpc<T extends unknown[]>(
    endpoint: string,
    calls: Array<{ method: string; params?: unknown[] }>,
  ): Promise<RpcCallResult<T>> {
    const startTime = Date.now();
    const requests: JsonRpcRequest[] = calls.map((call, index) => ({
      jsonrpc: '2.0',
      id: index + 1,
      method: call.method,
      params: call.params ?? [],
    }));
    const budget = Math.max(...calls.map(call => this.budgetFor(call.method)));
    const data = await postJsonRpc<JsonRpcResponse[]>(endpoint, 'batch', requests, budget, this.headers);

    // Sort by id to maintain order
    const sortedData = [...data].sort((a, b) => Number(a.id) - Number(b.id));
    const results: unknown[] = [];
    for (const item of sortedData) {
      if (item.error) {
        // Requests are sent with 1-indexed numeric ids (see `requests` above), but
        // a non-compliant provider could echo back a string or null id — guard
        // against NaN/out-of-range lookups so we always surface the error even
        // if the method tag falls back to "batch".
        const rawId = Number(item.id);
        const idx = Number.isFinite(rawId) ? rawId - 1 : -1;
        const failedMethod = calls[idx]?.method ?? 'batch';
        const { code, message, data: errData } = normalizeRpcError(item.error);
        throw new RpcError(
          code,
          buildRpcErrorMessage(endpoint, failedMethod, `JSON-RPC error ${code}: ${message}`, code),
          errData,
          { kind: 'rpc', nodeMessage: message },
        );
      }
      results.push(item.result);
    }
    return { result: results as T, endpoint, latencyMs: Date.now() - startTime };
  }

  // ─── Health tracking & rotation ────────────────────────────────────

  /**
   * The next endpoint in `order` that is not benched, advancing the shared rotation cursor; an
   * endpoint whose cooldown has run out is welcomed back on the way. Undefined once every endpoint
   * is benched — the caller decides what one more knock is worth.
   */
  private nextHealthy(order: string[]): string | undefined {
    const now = Date.now();
    for (let step = 0; step < order.length; step++) {
      const endpoint = order[this.currentIndex % order.length];
      this.currentIndex = (this.currentIndex + 1) % order.length;
      const health = this.endpointHealth.get(endpoint);
      if (health && !health.isHealthy && health.failedAt && now - health.failedAt >= this.endpointCooldownMs) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        health.failedAt = undefined;
      }
      if (health?.isHealthy) return endpoint;
    }
    return undefined;
  }

  /**
   * Sort endpoints by probe latency (fastest first).
   * Only moves endpoints that have latency data; unknown-latency endpoints
   * keep their relative order at the end.
   */
  private sortEndpointsByLatency(): void {
    if (this.endpointLatency.size === 0) return;

    const withLatency: Array<{ endpoint: string; latency: number }> = [];
    const withoutLatency: string[] = [];

    for (const ep of this.endpoints) {
      const lat = this.endpointLatency.get(ep);
      if (lat !== undefined) {
        withLatency.push({ endpoint: ep, latency: lat });
      } else {
        withoutLatency.push(ep);
      }
    }

    withLatency.sort((a, b) => a.latency - b.latency);

    // A new array, not a reorder in place: a walk in progress holds the old one and finishes over
    // it; the next walk picks this one up. The cursor carries across, which is all round-robin needs.
    this.endpoints = [...withLatency.map(item => item.endpoint), ...withoutLatency];
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
    if (error instanceof RpcError) {
      if (error.kind === 'http' && (error.code === 429 || error.code === 402)) return true;
      // JSON-RPC error codes that indicate rate limiting / quota
      const rateLimitCodes = [
        429, // Non-standard but widely used (Alchemy, QuickNode, GetBlock)
        -32001, // Quota exceeded (1RPC)
        -32005, // EIP-1474 "Limit exceeded" (Infura, NodeReal, BSC/Geth)
        -32097, // Rate limit reached (BlastAPI)
      ];
      if (rateLimitCodes.includes(error.code)) return true;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429') ||
      message.includes('exceeded the quota') ||
      message.includes('quota usage') ||
      message.includes('compute units') || // Alchemy CU-based limits
      message.includes('capacity limit') || // Alchemy monthly capacity
      message.includes('request rate exceeded') || // Infura per-second
      message.includes('daily request count') || // Infura daily quota
      message.includes('requests per second') || // QuickNode, Ankr
      message.includes('request limit') || // QuickNode
      message.includes('over limit') // GetBlock
    );
  }

  private isRetryableError(error: Error): boolean {
    // Execution reverts are deterministic regardless of the JSON-RPC code the
    // endpoint chose (geth: `3`, others wrap it as `-32603`/`-32000`). Rotating
    // can't change a revert, so never retry one — otherwise a reverting call fans
    // out across every endpoint and surfaces as a generic "all endpoints failed"
    // instead of the actual revert.
    if (/execution reverted/i.test(error.message)) return false;
    if (error instanceof RpcError) {
      // Anything but the node answering is the endpoint failing — an HTTP status of any kind, a
      // timeout, a dropped connection — and says nothing about the request; another endpoint may
      // well answer it. A geo-block's 403 or a body cap's 413 is as much this endpoint's problem
      // as a 503.
      if (error.kind !== 'rpc') return true;
      // Of the node's own answers, these are the non-deterministic ones.
      const retryableCodes = [
        -32000, // Server error
        -32601, // Method not found — this endpoint lacks the method; another may serve it
        -32602, // Invalid params — some gateways reject requests the canonical nodes accept
        -32603, // Internal error
      ];
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

// One instance per chain, so every caller on it shares the health tracking.
const clientInstances: Map<number, RpcClient> = new Map();

/**
 * Get or create the RpcClient for a chain.
 *
 * Most configuration is applied when the instance is created; `configRpcEndpoint` and
 * `maxBlockLag` are applied to an existing instance too, so a caller can set them without
 * depending on being the first to ask.
 *
 * @param chainId - The chain ID to get client for
 * @param config - Optional configuration
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
  } else {
    if (config?.configRpcEndpoint) client.updateConfigEndpoint(config.configRpcEndpoint);
    if (config?.maxBlockLag !== undefined) client.maxBlockLag = config.maxBlockLag;
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
