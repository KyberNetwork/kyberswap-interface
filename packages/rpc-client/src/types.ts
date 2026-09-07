/**
 * JSON-RPC request structure
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[];
}

/**
 * JSON-RPC response structure
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: number | string;
  result?: T;
  error?: JsonRpcError;
}

/**
 * JSON-RPC error structure
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * Event handlers for RPC client telemetry and monitoring.
 * All handlers are optional and called asynchronously (fire-and-forget).
 */
export interface RpcEventHandlers {
  /**
   * Called when an RPC call succeeds.
   * @param chainId - The chain ID
   * @param endpoint - The endpoint URL that succeeded
   * @param method - The RPC method called
   * @param latencyMs - Response time in milliseconds
   */
  onSuccess?: (chainId: number, endpoint: string, method: string, latencyMs: number) => void;

  /**
   * Called when an RPC call fails.
   * @param chainId - The chain ID
   * @param endpoint - The endpoint URL that failed
   * @param method - The RPC method called
   * @param error - The error that occurred
   */
  onError?: (chainId: number, endpoint: string, method: string, error: Error) => void;

  /**
   * Called when a rate limit (429) error is detected.
   * @param chainId - The chain ID
   * @param endpoint - The endpoint URL that returned rate limit
   */
  onRateLimit?: (chainId: number, endpoint: string) => void;

  /**
   * Called when falling back to Kyber RPC after all public endpoints fail.
   * @param chainId - The chain ID
   * @param kyberEndpoint - The Kyber RPC endpoint being used
   */
  onFallback?: (chainId: number, kyberEndpoint: string) => void;
}

/**
 * RPC Client configuration
 */
export interface RpcClientConfig {
  /** Chain ID */
  chainId: number;

  /** Custom RPC endpoints to use instead of defaults */
  customEndpoints?: string[];

  /** RPC endpoint from external config (e.g. ks-setting API). Used as final fallback. */
  configRpcEndpoint?: string;

  /** Whether to use Kyber RPC as fallback (default: true) */
  useKyberFallback?: boolean;

  /** Time one endpoint gets to answer before rotation moves on, in milliseconds (default: 3000) */
  timeout?: number;

  /** Maximum retries per endpoint before moving to next (default: 1) */
  maxRetriesPerEndpoint?: number;

  /** Time in ms to wait before retrying a failed endpoint (default: 60000) */
  endpointCooldownMs?: number;

  /** Custom headers to send with requests */
  headers?: Record<string, string>;

  /** Event handlers for telemetry and monitoring */
  eventHandlers?: RpcEventHandlers;

  /**
   * Blocks an endpoint may trail the freshest one before it is benched as stale (default: 50).
   * `getRpcClient` applies it to an existing instance too, so the value is not first-caller's.
   */
  maxBlockLag?: number;

  /**
   * Interval in ms between block freshness probes while the client is in use (default: 60000).
   * Probing starts with the first call and stops after five minutes without one. Set to 0 to disable.
   */
  probeIntervalMs?: number;
}

/**
 * Endpoint health status
 */
export interface EndpointHealth {
  url: string;
  failedAt?: number;
  consecutiveFailures: number;
  isHealthy: boolean;
}

/**
 * RPC call result with metadata
 */
export interface RpcCallResult<T> {
  result: T;
  endpoint: string;
  latencyMs: number;
}

/**
 * Error thrown when all RPC endpoints fail
 */
export class AllEndpointsFailedError extends Error {
  constructor(
    public readonly chainId: number,
    public readonly errors: Array<{ endpoint: string; error: Error }>,
  ) {
    // Inner error.message already carries the `Rpc issue: [method @ host] ...`
    // prefix from the client's throw sites. Strip it so the composed message
    // keeps a single leading "Rpc issue:" instead of nesting it per-endpoint.
    const reasons = errors.map(({ error }) => error.message.replace(/^Rpc issue:\s*/, '')).join(' | ');
    super(
      `Rpc issue: all ${errors.length} RPC endpoint${errors.length === 1 ? '' : 's'} failed for chain ${chainId}` +
        (reasons ? ` — ${reasons}` : ''),
    );
    this.name = 'AllEndpointsFailedError';
  }
}

/**
 * Where an RPC failure came from. Only `rpc` is the node answering — with a JSON-RPC error whose
 * `code` and `data` are the node's own; the rest are the endpoint failing to answer, and mean
 * nothing about the request.
 */
export type RpcErrorKind = 'rpc' | 'http' | 'timeout' | 'network';

/**
 * Error thrown when a request fails. `message` is composed for logs and tags infrastructure
 * failures with the endpoint; `nodeMessage` is the node's own text when the node answered, which is
 * what a caller matching on it (a revert reason, viem's decoder) needs untouched.
 */
export class RpcError extends Error {
  readonly kind: RpcErrorKind;
  readonly nodeMessage?: string;

  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown,
    options: { kind?: RpcErrorKind; nodeMessage?: string } = {},
  ) {
    super(message);
    this.name = 'RpcError';
    this.kind = options.kind ?? 'rpc';
    this.nodeMessage = options.nodeMessage;
  }
}
