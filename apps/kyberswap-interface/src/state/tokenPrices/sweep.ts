import { TokenPricesBody } from 'services/tokenCatalog'

import { TokenPricesState, UpdatePricesPayload } from 'state/tokenPrices'
import { RegistryCounts, RegistryMeta, metaKey } from 'state/tokenPrices/registry'

/** Matches the swap form's route refresh, so the two can never drift by more than one interval. */
export const TTL_MS = 10_000
/** Server-enforced, per chain per request. Not a tunable. */
export const CHUNK_SIZE = 100

export type DueSet = { [chainId: number]: string[] }

/**
 * Which subscribed addresses the next request should cover. A cold or explicitly expired address is
 * due regardless of tab visibility — consumers only subscribe, so there is no other path to a first
 * price. TTL refreshes and failure retries are visibility-gated.
 */
export const selectDue = (
  registry: Map<number, Map<string, RegistryCounts>>,
  readMeta: (key: string) => RegistryMeta | undefined,
  now: number,
  visible: boolean,
): DueSet => {
  const due: DueSet = {}

  registry.forEach((chainEntries, chainId) => {
    chainEntries.forEach((counts, address) => {
      const entry = readMeta(metaKey(chainId, address))
      const markDue = () => (due[chainId] ||= []).push(address)

      if (!entry || entry.forced) {
        markDue()
        return
      }
      if (!visible) return

      // Retries back off but never stop: giving up would pin the address at $0 for the rest of the
      // session with no path back, since only a successful fetch clears the failure count.
      if (entry.failures > 0) {
        if (now >= entry.nextRetryAt) markDue()
      } else if (counts.live > 0 && now - entry.fetchedAt >= TTL_MS) {
        markDue()
      }
    })
  })

  return due
}

/**
 * Split the due set into request bodies. The endpoint caps addresses per chain and accepts several
 * chains at once, so they pack for free; chunking a flat cross-chain union would split one chain
 * across bodies and mis-associate addresses.
 */
export const packBodies = (due: DueSet, chunkSize = CHUNK_SIZE): TokenPricesBody[] => {
  const chainIds = Object.keys(due)
    .map(Number)
    .filter(chainId => due[chainId].length)
  if (!chainIds.length) return []

  const rounds = Math.max(...chainIds.map(chainId => Math.ceil(due[chainId].length / chunkSize)))
  const bodies: TokenPricesBody[] = []

  for (let round = 0; round < rounds; round++) {
    const body: TokenPricesBody = {}
    chainIds.forEach(chainId => {
      const slice = due[chainId].slice(round * chunkSize, (round + 1) * chunkSize)
      if (slice.length) body[chainId] = slice
    })
    if (Object.keys(body).length) bodies.push(body)
  }

  return bodies
}

/** Drop no-op writes so a sweep that merely confirms unchanged prices notifies nobody. */
export const diffPayload = (current: TokenPricesState, payload: UpdatePricesPayload): UpdatePricesPayload => {
  const changed: UpdatePricesPayload = {}

  Object.entries(payload).forEach(([chainKey, prices]) => {
    const chainId = Number(chainKey)
    Object.entries(prices).forEach(([address, price]) => {
      if (current[chainId]?.[address] !== price) (changed[chainId] ||= {})[address] = price
    })
  })

  return changed
}
