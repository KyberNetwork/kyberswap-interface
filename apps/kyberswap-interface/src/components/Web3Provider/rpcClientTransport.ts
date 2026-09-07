import { AllEndpointsFailedError, RpcError, getRpcClient } from '@kyber/rpc-client'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { HttpRequestError, RpcRequestError, custom } from 'viem'

import { NETWORKS_INFO } from 'constants/networks'

/**
 * Chains whose reads go through `@kyber/rpc-client` rather than viem's own `fallback()`. The client
 * rotates across the public endpoints and keeps the KyberSwap endpoint as the last resort — the
 * public ones are free, the KyberSwap one is paid for — and it remembers which endpoints failed, so
 * a rate-limited or hanging endpoint is skipped for a cooldown rather than paid for on every call.
 * Chains not listed keep viem's fallback; adding a chain here is the whole rollout for it.
 */
export const RPC_CLIENT_CHAINS: ReadonlySet<number> = new Set([ChainId.BASE])

/**
 * How far behind the freshest endpoint a node may be before it is benched, in blocks — about half a
 * minute of each chain's block time. Consecutive reads land on different nodes, so a node further
 * behind than this would show a balance from before the transaction the user just watched confirm.
 */
const MAX_BLOCK_LAG: Partial<Record<number, number>> = { [ChainId.BASE]: 15 }

/**
 * The client shared by everything on the chain — the wagmi transport here, gas estimation before a
 * signature, the widgets — so what one learns about an endpoint the others use. The chain's own
 * `defaultRpcUrl` is named as the last resort for chains the client's tables do not cover.
 */
const clientFor = (chainId: number) =>
  getRpcClient(chainId, {
    configRpcEndpoint: NETWORKS_INFO[chainId as ChainId]?.defaultRpcUrl,
    maxBlockLag: MAX_BLOCK_LAG[chainId],
  })

/**
 * The client's errors in the shapes viem reads. The node answering is a `RpcRequestError` carrying
 * the node's own code, message and data — the message untouched, since viem decodes a revert only
 * when it reads exactly what the node said; the endpoint failing is a `HttpRequestError`.
 */
const toViemError = (error: unknown, chainId: number, method: string, params: unknown): Error => {
  const body = { method, params }
  const url = `@kyber/rpc-client chain ${chainId}`
  if (error instanceof RpcError && error.kind === 'rpc') {
    return new RpcRequestError({
      body,
      error: { code: error.code, message: error.nodeMessage ?? error.message, data: error.data },
      url,
    })
  }
  if (error instanceof RpcError) {
    return new HttpRequestError({
      body,
      details: error.message,
      status: error.kind === 'http' ? error.code : undefined,
      url,
    })
  }
  if (error instanceof AllEndpointsFailedError) return new HttpRequestError({ body, details: error.message, url })
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * A viem transport over `@kyber/rpc-client`, for `RPC_CLIENT_CHAINS`. The client is created on the
 * first request, not when the transport is built, so building one per chain at startup sends nothing.
 */
export const rpcClientTransport = (chainId: number) =>
  custom(
    {
      request: async ({ method, params }: { method: string; params?: unknown }) => {
        try {
          return await clientFor(chainId).call(method, (params ?? []) as unknown[])
        } catch (error) {
          throw toViemError(error, chainId, method, params)
        }
      },
    },
    // The client rotates and retries on its own. A second layer of retries here would walk the
    // whole list again for a call every endpoint has just refused, and double the load on
    // endpoints already rate-limiting the user.
    { key: 'kyberRpcClient', name: 'KyberSwap RPC client', retryCount: 0 },
  )
