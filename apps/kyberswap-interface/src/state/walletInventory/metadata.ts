import { ChainId } from '@kyberswap/ks-sdk-core'

import { fetchListTokenByAddresses } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/**
 * Catalog metadata (name, logo, canonical symbol) for tokens the wallet holds off any list. The
 * indexer only carries a symbol and decimals, so a discovery row built from it alone renders with a
 * placeholder logo and an indexer-cased symbol — and, once imported, keeps that look everywhere while
 * the swap form resolving the same address resolves it from the token catalog. Reading the catalog
 * here gives both surfaces the same token.
 *
 * Each address is asked about once per session: the answer (a token, or `null` for a token the
 * catalog does not know) is kept in an immutable snapshot that consumers derive their rows from.
 */

/** Catalog answers keyed by `chainId:lowercase address`; `null` means the catalog does not know it. */
export type TokenMetadata = ReadonlyMap<string, WrappedTokenInfo | null>

/** A failed lookup is left alone for this long before a consumer may ask for it again. */
const METADATA_RETRY_MS = 30_000

let resolved: Map<string, WrappedTokenInfo | null> = new Map()
const inflight = new Map<string, Promise<void>>()
const retryAt = new Map<string, number>()

const listeners = new Set<() => void>()

const metadataKey = (chainId: ChainId, address: string) => `${chainId}:${address.toLowerCase()}`

export const subscribeTokenMetadata = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The current snapshot; a new map each time a batch adds tokens, unchanged otherwise. */
export const getTokenMetadata = (): TokenMetadata => resolved

export const readTokenMetadata = (
  metadata: TokenMetadata,
  chainId: ChainId,
  address: string,
): WrappedTokenInfo | undefined => metadata.get(metadataKey(chainId, address)) ?? undefined

const lookup = async (chainId: ChainId, batch: Map<string, string>): Promise<void> => {
  const keys = Array.from(batch.keys())
  let tokens: WrappedTokenInfo[]
  try {
    tokens = await fetchListTokenByAddresses(Array.from(batch.values()), chainId)
  } catch {
    const until = Date.now() + METADATA_RETRY_MS
    keys.forEach(key => retryAt.set(key, until))
    return
  } finally {
    keys.forEach(key => inflight.delete(key))
  }

  const byAddress = new Map(tokens.map(token => [token.address.toLowerCase(), token]))
  const next = new Map(resolved)
  let found = 0
  batch.forEach((address, key) => {
    const token = byAddress.get(address.toLowerCase())
    if (token) found += 1
    next.set(key, token ?? null)
  })
  resolved = next
  // Only an answer that carries a token changes any row; negatives are recorded silently.
  if (found) listeners.forEach(listener => listener())
}

/**
 * Fetches catalog metadata for every address not yet asked about and resolves once all of them have
 * an answer. Addresses already answered cost a map lookup; an address whose lookup is in flight
 * shares that request; one whose lookup failed is skipped until its retry time.
 */
export const ensureTokenMetadata = async (chainId: ChainId, addresses: readonly string[]): Promise<void> => {
  const now = Date.now()
  const waits: Promise<void>[] = []
  const batch = new Map<string, string>()
  addresses.forEach(address => {
    const key = metadataKey(chainId, address)
    if (resolved.has(key) || batch.has(key)) return
    const request = inflight.get(key)
    if (request) {
      waits.push(request)
      return
    }
    if ((retryAt.get(key) ?? 0) > now) return
    batch.set(key, address)
  })

  if (batch.size) {
    const request = lookup(chainId, batch)
    batch.forEach((_, key) => inflight.set(key, request))
    waits.push(request)
  }

  await Promise.all(waits)
}

/** Test-only. */
export const resetTokenMetadata = () => {
  resolved = new Map()
  inflight.clear()
  retryAt.clear()
  listeners.clear()
}
