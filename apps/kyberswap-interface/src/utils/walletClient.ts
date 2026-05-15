// eslint-disable-next-line no-restricted-imports
import { getAccount, getWalletClient } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider'

import { ensureNotBlacklisted } from './sendTransaction'
import { Address } from './viem'

class ChainMismatchError extends Error {
  constructor() {
    super('Your chain is mismatched, please make sure your wallet is switch to the expected chain.')
    this.name = 'ChainMismatchError'
  }
}

// EIP-1193 methods that produce a signature or broadcast a transaction. Every method
// here goes through `walletClient.request()` under the hood in viem, so a Proxy on
// `request` is a single chokepoint for all wallet-side mutating operations.
const SIGNING_METHODS = new Set([
  'eth_sendTransaction',
  'eth_sendRawTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_sendCalls',
  'wallet_sendCalls',
])

type WalletClient = NonNullable<Awaited<ReturnType<typeof getWalletClient>>>

/**
 * Returns a wagmi walletClient with the Blackjack compliance gate installed at the
 * EIP-1193 `request` boundary: any call that would produce a signature or broadcast
 * a transaction first hits `ensureNotBlacklisted(account)` and throws
 * `BlacklistedWalletError` for sanctioned addresses.
 *
 * Use this in place of `@wagmi/core`'s `getWalletClient` everywhere. The raw import
 * is ESLint-restricted to this file.
 */
export async function getGatedWalletClient(opts: { chainId: number }): Promise<WalletClient | undefined> {
  const client = await getWalletClient(wagmiConfig, opts)
  if (!client) return client

  const originalRequest = client.request.bind(client) as WalletClient['request']
  const gatedRequest = (async (args: { method: string; params?: unknown }) => {
    if (SIGNING_METHODS.has(args.method)) {
      const walletChainId = getAccount(wagmiConfig).chainId
      if (walletChainId !== undefined && walletChainId !== opts.chainId) {
        throw new ChainMismatchError()
      }
      const account = client.account?.address as string | undefined
      if (account) await ensureNotBlacklisted(account)
    }
    return (originalRequest as (a: unknown) => Promise<unknown>)(args)
  }) as WalletClient['request']

  // Mutate in place — the wagmi cache hands us a freshly built client per call,
  // so wrapping the local instance is safe and avoids Proxy invariant pitfalls
  // (viem clients use class-private slots that a `Proxy` would break).
  client.request = gatedRequest
  return client
}

/**
 * EIP-712 signing helper that runs through the gated wallet client and strips
 * `EIP712Domain` from `types` before passing to viem — viem injects EIP712Domain
 * itself and rejects payloads that already contain it.
 */
export async function signTypedDataSafe(params: {
  chainId: number
  account: Address
  typedData: {
    domain: any
    types: Record<string, unknown>
    primaryType: string
    message: any
  }
}): Promise<string> {
  const walletClient = await getGatedWalletClient({ chainId: params.chainId })
  if (!walletClient) throw new Error('Wallet client unavailable')

  const { EIP712Domain: _omit, ...safeTypes } = (params.typedData.types ?? {}) as Record<string, unknown>

  return walletClient.signTypedData({
    account: params.account,
    domain: params.typedData.domain,
    types: safeTypes,
    primaryType: params.typedData.primaryType,
    message: params.typedData.message,
  })
}
