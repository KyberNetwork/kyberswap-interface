import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { getRpcClient } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'

import { NETWORKS_INFO } from './networks'

/**
 * A JSON-RPC provider that automatically rotates between public RPC endpoints
 * and falls back to Kyber RPC when all public endpoints fail.
 *
 * This extends StaticJsonRpcProvider to maintain compatibility with existing code
 * while adding automatic endpoint rotation on rate limit (429) errors.
 *
 * Flow:
 * 1. Try all public RPC endpoints with rotation
 * 2. If all fail, fallback to Kyber RPC (handled by RpcClient)
 * 3. If Kyber RPC also fails, throw AllEndpointsFailedError
 */
export class AppJsonRpcProvider extends StaticJsonRpcProvider {
  private readonly rpcClient: ReturnType<typeof getRpcClient>
  private readonly _chainId: ChainId

  constructor(url: string, chainId: ChainId) {
    // Including networkish allows ethers to skip the initial detectNetwork call.
    super(url, /* networkish= */ { chainId, name: NETWORKS_INFO[chainId].name })

    this._chainId = chainId

    // Get the shared RPC client for this chain
    // The singleton pattern ensures health tracking is shared across all providers for the same chain
    this.rpcClient = getRpcClient(chainId)

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers (eg AppJsonRpcProvider) need to update less frequently to be considered responsive.
    this.pollingInterval = 12_000
  }

  /**
   * Override the send method to use RPC client with rotation.
   * The RpcClient handles all rotation and Kyber fallback logic internally.
   */
  async send(method: string, params: Array<unknown>): Promise<unknown> {
    // RpcClient.call() will:
    // 1. Try all public endpoints with rotation
    // 2. Fallback to Kyber RPC if all public endpoints fail
    // 3. Throw AllEndpointsFailedError if everything fails
    return this.rpcClient.call(method, params)
  }

  /**
   * Get the chain ID this provider is configured for.
   */
  getChainId(): ChainId {
    return this._chainId
  }
}
