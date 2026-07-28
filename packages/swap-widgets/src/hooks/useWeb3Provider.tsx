import { createContext, ReactNode, useContext } from 'react'
import { getRpcClient } from '@kyber/rpc-client'
import { DefaultRpcUrl } from '../constants'

type Web3ContextValue = {
  chainId: number
  connectedAccount: {
    address?: string
    chainId: number
  }
  // The RPC URL to dial. ALWAYS resolves to a string (integrator URL or
  // DefaultRpcUrl[chainId]) for callers that need a concrete endpoint.
  rpcUrl: string
  // True when the integrator passed an `rpcUrl` prop. Callers that can use
  // @kyber/rpc-client rotation should prefer chainId-based calls in that case.
  hasIntegratorRpcUrl: boolean
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
}

const Web3Context = createContext<Web3ContextValue | null>(null)

export const Web3Provider = ({
  children,
  chainId,
  connectedAccount,
  rpcUrl,
  onSubmitTx,
}: {
  chainId: number
  connectedAccount: {
    address?: string
    chainId: number
  }
  rpcUrl?: string
  children: ReactNode
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>
}) => {
  const hasIntegratorRpcUrl = !!rpcUrl
  const resolvedRpcUrl = rpcUrl || DefaultRpcUrl[chainId] || ''

  // Seed @kyber/rpc-client with DefaultRpcUrl[chainId] as its config-fallback
  // endpoint when the integrator did NOT supply an rpcUrl. Done synchronously
  // during render (instead of in useEffect) so the singleton is configured
  // before any child component's effect fires its first RPC call — otherwise
  // chains absent from PUBLIC_RPC_ENDPOINTS (Rise, Monad, HyperEvm, …) would
  // throw AllEndpointsFailedError on first mount. `getRpcClient` is idempotent
  // and side-effect-free beyond mutating its in-memory singleton cache.
  if (!hasIntegratorRpcUrl) {
    const fallback = DefaultRpcUrl[chainId]
    if (fallback) getRpcClient(chainId, { configRpcEndpoint: fallback })
  }

  return (
    <Web3Context.Provider
      value={{
        chainId,
        onSubmitTx,
        connectedAccount,
        rpcUrl: resolvedRpcUrl,
        hasIntegratorRpcUrl,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useActiveWeb3 = (): Web3ContextValue => {
  return (
    useContext(Web3Context) || {
      chainId: 1,
      connectedAccount: { address: undefined, chainId: 1 },
      rpcUrl: DefaultRpcUrl[1],
      hasIntegratorRpcUrl: false,
      onSubmitTx: async () => '',
    }
  )
}

/**
 * Returns the right RPC target to pass into @kyber/utils / @kyber/rpc-client
 * helpers that accept `number | string`:
 * - When the integrator supplied an rpcUrl, return that string (direct call,
 *   no rotation).
 * - Otherwise return the chainId (number) so the helper uses rotation through
 *   @kyber/rpc-client, with DefaultRpcUrl[chainId] seeded as its config
 *   fallback by Web3Provider.
 */
export const useRpcTarget = (): number | string => {
  const { chainId, rpcUrl, hasIntegratorRpcUrl } = useActiveWeb3()
  return hasIntegratorRpcUrl ? rpcUrl : chainId
}
