import { AllEndpointsFailedError, PUBLIC_RPC_ENDPOINTS, RpcError, getRpcClient } from '@kyber/rpc-client'
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

/** One instance per chain for the app, apart from the ones the embedded widgets configure. */
const APP_SCOPE = 'app'

/**
 * One endpoint's share of the wait. Rotation moves on only once the current endpoint has failed or
 * run out of time, so a hop that hangs costs the whole call this long. A healthy endpoint answers a
 * multicall-sized call in well under two seconds.
 */
const HOP_TIMEOUT_MS = 3_000

/**
 * The app owns its chain list. The client's built-in tables are the widgets' and cover a different
 * set of chains, so the public endpoints and the last-resort endpoint are handed in here: the public
 * list the app already uses, and this chain's `defaultRpcUrl`, which the client tries after the
 * public ones.
 */
const clientFor = (chainId: number) =>
  getRpcClient(chainId, {
    scope: APP_SCOPE,
    customEndpoints: PUBLIC_RPC_ENDPOINTS[chainId],
    configRpcEndpoint: NETWORKS_INFO[chainId as ChainId]?.defaultRpcUrl,
    timeout: HOP_TIMEOUT_MS,
  })

/**
 * The client's errors in the shapes viem reads. A timeout or an HTTP status is the transport
 * failing; anything else is the node answering, and viem takes the node's code and data from it —
 * a revert's reason lives in `data`, and only a `RpcRequestError` carries it to the decoder.
 */
const toViemError = (error: unknown, chainId: number, method: string, params: unknown): Error => {
  const body = { method, params }
  const url = `@kyber/rpc-client chain ${chainId}`
  if (error instanceof AllEndpointsFailedError) return new HttpRequestError({ body, details: error.message, url })
  if (error instanceof RpcError) {
    const transportFailure = error.code === -1 || (error.code >= 100 && error.code <= 599)
    if (transportFailure) {
      return new HttpRequestError({
        body,
        details: error.message,
        status: error.code > 0 ? error.code : undefined,
        url,
      })
    }
    return new RpcRequestError({ body, error: { code: error.code, message: error.message, data: error.data }, url })
  }
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
