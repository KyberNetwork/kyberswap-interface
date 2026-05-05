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

// Subset of `/v4/chains` entry. Merkl returns more (explorers, dispute period, …) but the UI
// only needs id/name/icon plus the liveCampaigns count to gate which chains we even query.
export interface MerklChainSummary {
  id: number
  name: string
  icon: string
  liveCampaigns: number
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
// for that chain. While a chain's mark is still within RELOAD_FRESHNESS_MS, the next
// `merklRewards` fetch attaches `reloadChainId=X` to the batched URL so Merkl serves fresh
// data for the claimed chain (defeating any URL-keyed cache Merkl holds for the batched URL).
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

// Mark a chain so the next `merklRewards` queryFn appends `reloadChainId=X` to the request
// URL. The mark auto-expires after RELOAD_FRESHNESS_MS or is consumed by the next successful
// fetch. Used by the post-claim retry loop to fold reload + display update into a single
// batched request.
export const markChainAsReloaded = (chainId: number) => {
  recentlyReloadedChainIds.set(String(chainId), Date.now())
}

type BatchedResult = { ok: true; data: MerklRewardsResponse[] } | { ok: false; permanent: boolean }

const fetchRewardsPerChain = async (
  address: string,
  chainIds: string[],
  // chainIds in this set get `reloadChainId=X` appended so Merkl's backend refreshes its
  // cache for that chain before responding. Used in post-claim flows.
  reloadChainIds: Set<string> = new Set(),
): Promise<MerklRewardsResponse[]> => {
  const results = await Promise.all(
    chainIds.map(async cId => {
      try {
        const url = reloadChainIds.has(cId)
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

const fetchRewardsBatched = async (
  address: string,
  chainIds: string[],
  // chainIds whose data Merkl should rebuild before responding. Appended as `reloadChainId=X`
  // params so the response carries fresh data for those chains, even if Merkl was caching the
  // batched URL otherwise.
  reloadChainIds: string[] = [],
): Promise<BatchedResult> => {
  try {
    const params = chainIds
      .map(id => `chainId=${id}`)
      .concat(reloadChainIds.map(id => `reloadChainId=${id}`))
      .join('&')
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
  // Cache stays alive for 5 minutes after no subscribers — covers most navigation patterns
  // (Earns landing → UserPositions → PositionDetail → back) without re-hitting Merkl.
  keepUnusedDataFor: 300,
  // When a new subscriber mounts with identical args, only refetch if cached data is older
  // than 60s; otherwise reuse the cache. Eliminates the burst of refetches that would
  // otherwise fire each time a page mounts a new useMerklRewards consumer.
  refetchOnMountOrArgChange: 60,
  endpoints: builder => ({
    // Lookup of chains where Merkl currently has campaigns. Used to build the chainId list for
    // `merklRewards` so we don't ask Merkl about chains they don't run anything on. The list
    // changes very rarely (new chains added every few weeks), so cache for a full day. The
    // 60s `refetchOnMountOrArgChange` from createApi is overridden at the hook call site to
    // match the longer keepUnusedDataFor.
    //
    // Uses raw `fetch` (not `fetchBaseQuery`) so the request stays a CORS-simple GET — Merkl's
    // server doesn't accept the preflight that `fetchBaseQuery`'s default headers trigger.
    getMerklChains: builder.query<MerklChainSummary[], void>({
      async queryFn() {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        try {
          const res = await fetch(`${MERKL_API_BASE}/chains`, { signal: controller.signal })
          if (!res.ok) return { error: { status: res.status, data: 'fetch chains failed' } }
          const data: MerklChainSummary[] = await res.json()
          return { data }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error)?.message || 'fetch chains failed' } }
        } finally {
          clearTimeout(timeoutId)
        }
      },
      keepUnusedDataFor: 86_400,
    }),
    merklRewards: builder.query<MerklRewardsResponse[], MerklRewardsParams>({
      async queryFn({ address, chainId }) {
        const chainIds = chainId
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        if (!chainIds.length) {
          return { data: [] }
        }

        // Pull off any chains marked by a recent `reloadMerklChain` so we can request fresh
        // data for them in this fetch via `reloadChainId=X`. Marks are consumed only after a
        // successful response — a failed batched call leaves them so the next refetch retries.
        const reloadedChains = chainIds.filter(isChainRecentlyReloaded)

        if (chainIds.length === 1 || batchedSupportState === 'unsupported') {
          // Per-chain path: single chain or batched known broken. The `reloadedChains` set
          // tells us which chainIds need `reloadChainId=X` appended to their per-chain URL.
          const data = await fetchRewardsPerChain(address, chainIds, new Set(reloadedChains))
          const refreshedIds = new Set(data.map(item => String(item.chain.id)))
          reloadedChains.forEach(c => {
            if (refreshedIds.has(c)) recentlyReloadedChainIds.delete(c)
          })
          return { data }
        }

        // Batched path. Whenever any chain is freshly reloaded, append `reloadChainId=X` for
        // each so Merkl serves fresh data for them — every other chain returns its current
        // (possibly already-fresh) data in the same response. We deliberately do NOT merge with
        // the existing RTK cache: stale entries for non-claimed chains in the cache caused
        // post-claim UI to show wrong claimable amounts when Merkl had silently updated those
        // chains independently of the user's claim.
        const batched = await fetchRewardsBatched(address, chainIds, reloadedChains)
        if (batched.ok) {
          batchedSupportState = 'supported'
          reloadedChains.forEach(c => recentlyReloadedChainIds.delete(c))
          return { data: batched.data }
        }

        // Only lock to per-chain when the failure is permanent (e.g., Merkl 4xx says the
        // batched format is unsupported). Transient failures fall back this once but leave
        // batchedSupportState alone so the next poll can try batched again.
        if (batched.permanent) batchedSupportState = 'unsupported'
        const data = await fetchRewardsPerChain(address, chainIds, new Set(reloadedChains))
        const refreshedIds = new Set(data.map(item => String(item.chain.id)))
        reloadedChains.forEach(c => {
          if (refreshedIds.has(c)) recentlyReloadedChainIds.delete(c)
        })
        return { data }
      },
    }),
    // One-off per-chain fetch used right before submitting a claim tx so the proofs/amounts
    // baked into calldata are the freshest available. Bypasses the main RTK Query cache and
    // does NOT pass `reloadChainId` (no backend rebuild needed — we just want latest cached
    // data from Merkl). Falls back to the cached chain payload at the call site on failure.
    fetchMerklChainRewards: builder.mutation<MerklRewardsResponse[], { address: string; chainId: number }>({
      async queryFn({ address, chainId }) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        try {
          const res = await fetch(`${MERKL_API_BASE}/users/${address}/rewards?chainId=${chainId}`, {
            signal: controller.signal,
          })
          if (!res.ok) return { error: { status: res.status, data: 'fetch failed' } }
          const data: MerklRewardsResponse[] = await res.json()
          return { data }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error)?.message || 'fetch failed' } }
        } finally {
          clearTimeout(timeoutId)
        }
      },
    }),
  }),
})

export const { useGetMerklChainsQuery, useMerklRewardsQuery, useFetchMerklChainRewardsMutation } = rewardMerklApi

export default rewardMerklApi
