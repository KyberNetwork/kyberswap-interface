import { ChainId } from '@kyberswap/ks-sdk-core'

/**
 * Chains kd-api indexes wallet balances for. Treated as optimistic rather than authoritative: the
 * service answers 400 for a chain it does not index, which sticky-disables that chain for the session
 * (see the store), so this list drifting ahead of the backend degrades to the multicall path instead
 * of breaking. Chains missing here keep the legacy path and are never probed.
 */
export const KD_INVENTORY_CHAINS: ChainId[] = [ChainId.MAINNET, ChainId.BASE, ChainId.BSCMAINNET]

/** How stale an inventory may get before a mounted consumer refetches it. */
export const INVENTORY_TTL_MS = 30_000

/**
 * While an inventory is behind a transaction the user just made, it is refetched on this cadence
 * instead of the normal TTL, so a swap's new balance appears as soon as the indexer catches up.
 */
export const INVENTORY_CATCHUP_INTERVAL_MS = 5_000

/**
 * How long to keep chasing the indexer for a transaction's block before giving up and returning to
 * the normal TTL. Comfortably past the observed 15–70s indexing lag.
 */
export const INVENTORY_CATCHUP_TIMEOUT_MS = 150_000

/** Backoff after consecutive failures. The last entry is the ceiling; retries never stop. */
export const INVENTORY_RETRY_BACKOFF_MS = [5_000, 15_000, 45_000, 120_000]

/**
 * Random share added to each retry delay. Every tab runs its own scheduler, so without jitter a
 * service coming back from an outage would be hit by the whole fleet on the same tick.
 */
export const INVENTORY_RETRY_JITTER = 0.4
