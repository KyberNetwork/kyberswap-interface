// The served-chain list is `WALLET_INVENTORY_CHAINS` in `@kyber/hooks`, shared with the widget
// selectors so the two can never drift; the store gates on it through `isWalletInventoryChain`.

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
