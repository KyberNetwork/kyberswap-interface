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

  /** Whether to use Kyber RPC as fallback (default: true) */
  useKyberFallback?: boolean;

  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;

  /** Maximum retries per endpoint before moving to next (default: 1) */
  maxRetriesPerEndpoint?: number;

  /** Time in ms to wait before retrying a failed endpoint (default: 60000) */
  endpointCooldownMs?: number;

  /** Custom headers to send with requests */
  headers?: Record<string, string>;

  /** Event handlers for telemetry and monitoring */
  eventHandlers?: RpcEventHandlers;
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
    super(`All RPC endpoints failed for chain ${chainId}`);
    this.name = 'AllEndpointsFailedError';
  }
}

/**
 * Error thrown when RPC returns an error response
 */
export class RpcError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}
