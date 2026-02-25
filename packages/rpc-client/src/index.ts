// Core client
export { RpcClient, getRpcClient, clearRpcClients } from './client';

// Fetch helpers
export {
  rpcFetch,
  rpcBatchFetch,
  directRpcFetch,
  getBalance,
  getBlockNumber,
  getGasPrice,
  ethCall,
  estimateGas,
  getTransactionReceipt,
  getBlock,
} from './fetch';
export type { RpcFetchOptions } from './fetch';

// Endpoints configuration
export {
  PUBLIC_RPC_ENDPOINTS,
  KYBER_RPC_ENDPOINTS,
  getRpcEndpoints,
  getKyberRpcEndpoint,
  isChainSupported,
  getSupportedChainIds,
} from './endpoints';

// Types
export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  RpcClientConfig,
  RpcEventHandlers,
  EndpointHealth,
  RpcCallResult,
} from './types';
export { AllEndpointsFailedError, RpcError } from './types';
