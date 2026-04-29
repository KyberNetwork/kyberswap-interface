import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface MerklRewardBreakdown {
  root: string
  distributionChainId: number
  reason: string
  amount: string
  claimed: string
  pending: string
  campaignId: string
}

interface MerklRewardToken {
  address: string
  chainId: number
  symbol: string
  decimals: number
  price: number
}

interface MerklRewardItem {
  distributionChainId: number
  root: string
  recipient: string
  amount: string
  claimed: string
  pending: string
  proofs: string[]
  token: MerklRewardToken
  breakdowns: MerklRewardBreakdown[]
}

interface MerklChainExplorer {
  chainId: number
  id: string
  type: string
  url: string
}

interface MerklChainInfo {
  Explorer: MerklChainExplorer[]
  endOfDisputePeriod: number
  icon: string
  id: number
  liveCampaigns: number
  name: string
}

export interface MerklRewardsResponse {
  chain: MerklChainInfo
  rewards: MerklRewardItem[]
}

interface MerklRewardsParams {
  address: string
  chainId: string
}

const MERKL_API_BASE = 'https://api.merkl.xyz/v4'

// Tracks whether Merkl's batched (multi-chain) endpoint is usable in this session.
// Only flipped to 'unsupported' when Merkl returns a permanent error (4xx other than 429),
// so a transient network blip or 5xx doesn't permanently downgrade the session to per-chain.
let batchedSupportState: 'unknown' | 'supported' | 'unsupported' = 'unknown'

// Map of chainId → timestamp at which `reloadMerklChain` last refreshed Merkl's backend cache
// for that chain. While a chain's mark is still within RELOAD_FRESHNESS_MS, every `merklRewards`
// fetch covering that chain is forced down the per-chain path — the only URL pattern we know
// was refreshed (Merkl may cache the batched URL separately). Mark is read without consuming so
// concurrent fetches in the window (poll, tab-resume, explicit refetch) all see fresh data.
const recentlyReloadedChainIds = new Map<string, number>()
const RELOAD_FRESHNESS_MS = 60_000

const isChainRecentlyReloaded = (chainId: string): boolean => {
  const ts = recentlyReloadedChainIds.get(chainId)
  if (ts === undefined) return false
  if (Date.now() - ts > RELOAD_FRESHNESS_MS) {
    recentlyReloadedChainIds.delete(chainId)
    return false
  }
  return true
}

type BatchedResult = { ok: true; data: MerklRewardsResponse[] } | { ok: false; permanent: boolean }

const fetchRewardsPerChain = async (
  address: string,
  chainIds: string[],
  // Append `reloadChainId=X` to force Merkl's backend to refresh ITS cache for that chain
  // before responding. Used in post-claim flows where we need to defeat any URL-keyed cache
  // that wasn't invalidated by an earlier reload call.
  withReload = false,
): Promise<MerklRewardsResponse[]> => {
  const results = await Promise.all(
    chainIds.map(async cId => {
      try {
        const url = withReload
          ? `${MERKL_API_BASE}/users/${address}/rewards?chainId=${cId}&reloadChainId=${cId}`
          : `${MERKL_API_BASE}/users/${address}/rewards?chainId=${cId}`
        const res = await fetch(url)
        if (!res.ok) return null
        const data: MerklRewardsResponse[] = await res.json()
        return data
      } catch {
        return null
      }
    }),
  )
  return results.filter(Boolean).flat() as MerklRewardsResponse[]
}

const fetchRewardsBatched = async (address: string, chainIds: string[]): Promise<BatchedResult> => {
  try {
    const params = chainIds.map(id => `chainId=${id}`).join('&')
    const res = await fetch(`${MERKL_API_BASE}/users/${address}/rewards?${params}`)
    if (res.ok) {
      return { ok: true, data: (await res.json()) as MerklRewardsResponse[] }
    }
    // 4xx (except 429 rate-limit) signals the request format/chainIds are unsupported — permanent.
    // 5xx and 429 are transient; don't lock the session out of batched mode for them.
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429
    return { ok: false, permanent }
  } catch {
    // Network errors / aborts — transient
    return { ok: false, permanent: false }
  }
}

const rewardMerklApi = createApi({
  reducerPath: 'rewardMerklApi',
  baseQuery: fetchBaseQuery({
    baseUrl: MERKL_API_BASE,
  }),
  keepUnusedDataFor: 60,
  endpoints: builder => ({
    merklRewards: builder.query<MerklRewardsResponse[], MerklRewardsParams>({
      async queryFn({ address, chainId }, api) {
        const chainIds = chainId
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        if (!chainIds.length) {
          return { data: [] }
        }

        // Per-chain for everything: single chain, or batched known broken
        if (chainIds.length === 1 || batchedSupportState === 'unsupported') {
          return { data: await fetchRewardsPerChain(address, chainIds) }
        }

        const reloadedChains = chainIds.filter(isChainRecentlyReloaded)

        // Post-claim path: only the reloaded chains have changed. Re-fetch JUST those with
        // `reloadChainId` for guaranteed-fresh data, then merge with the already-cached
        // entries for the unchanged chains. This avoids the wasteful batched call that
        // re-fetches data we already have for chains that didn't claim.
        if (reloadedChains.length > 0) {
          // Every requested chain is reloaded — nothing to reuse from cache.
          if (reloadedChains.length === chainIds.length) {
            return { data: await fetchRewardsPerChain(address, chainIds, true) }
          }

          const freshPerChain = await fetchRewardsPerChain(address, reloadedChains, true)
          // `as any` breaks the circular type inference — `rewardMerklApi` is being defined in
          // the same statement and can't be type-named yet, but the runtime reference is fine
          // because queryFn is only invoked after the api object has been constructed.
          const existing =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((rewardMerklApi as any).endpoints.merklRewards.select({ address, chainId })(api.getState())?.data ??
              []) as MerklRewardsResponse[]

          // Use the cache-reuse optimization only when both halves have data. If `freshPerChain`
          // is empty (per-chain fetch failed for every reloaded chain), returning unmodified
          // cache would silently serve pre-claim data — fall through to the batched fallback
          // so the user gets fresh data via a different URL path instead.
          if (existing.length > 0 && freshPerChain.length > 0) {
            const refreshedIds = new Set(freshPerChain.map(item => item.chain.id))
            const merged = existing.filter(item => !refreshedIds.has(item.chain.id)).concat(freshPerChain)
            return { data: merged }
          }

          // Cache empty OR `freshPerChain` empty — fall back to batched + reloaded-per-chain
          // merge so the full picture is populated and stale cache isn't served silently.
          const batchedResult = await fetchRewardsBatched(address, chainIds)
          if (batchedResult.ok) {
            batchedSupportState = 'supported'
            const refreshedIds = new Set(freshPerChain.map(item => item.chain.id))
            const merged = batchedResult.data.filter(item => !refreshedIds.has(item.chain.id)).concat(freshPerChain)
            return { data: merged }
          }
          if (batchedResult.permanent) batchedSupportState = 'unsupported'
          const reloadedSet = new Set(reloadedChains)
          const remainingChains = chainIds.filter(id => !reloadedSet.has(id))
          const remainingPerChain = remainingChains.length ? await fetchRewardsPerChain(address, remainingChains) : []
          return { data: remainingPerChain.concat(freshPerChain) }
        }

        // Normal poll: try the batched (multi-chain) endpoint to collapse N requests into 1.
        const batched = await fetchRewardsBatched(address, chainIds)
        if (batched.ok) {
          batchedSupportState = 'supported'
          return { data: batched.data }
        }

        // Only lock to per-chain when the failure is permanent (e.g., Merkl 4xx says the
        // batched format is unsupported). Transient failures fall back this once but leave
        // batchedSupportState alone so the next poll can try batched again.
        if (batched.permanent) {
          batchedSupportState = 'unsupported'
        }
        return { data: await fetchRewardsPerChain(address, chainIds) }
      },
    }),
    // Force Merkl's backend to refresh its cache for a specific chain (used after a successful
    // claim tx so the next `merklRewards` fetch returns up-to-date claimed amounts).
    reloadMerklChain: builder.mutation<MerklRewardsResponse[], { address: string; chainId: number }>({
      async queryFn({ address, chainId }) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15_000)
        try {
          const res = await fetch(
            `${MERKL_API_BASE}/users/${address}/rewards?chainId=${chainId}&reloadChainId=${chainId}`,
            { signal: controller.signal },
          )
          if (!res.ok) return { error: { status: res.status, data: 'reload failed' } }
          const data: MerklRewardsResponse[] = await res.json()
          // Mark this chain so any `merklRewards` fetch within RELOAD_FRESHNESS_MS uses
          // the per-chain URL pattern that we just told Merkl to refresh.
          recentlyReloadedChainIds.set(String(chainId), Date.now())
          return { data }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error)?.message || 'reload failed' } }
        } finally {
          clearTimeout(timeoutId)
        }
      },
    }),
  }),
})

export const { useMerklRewardsQuery, useLazyMerklRewardsQuery, useReloadMerklChainMutation } = rewardMerklApi

export default rewardMerklApi
