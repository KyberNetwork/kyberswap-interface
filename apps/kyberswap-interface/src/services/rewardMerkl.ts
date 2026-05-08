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

// Map of chainId → timestamp at which the chain was last marked for reload via
// `markChainAsReloaded`. While the mark is fresh, the next `merklRewards` queryFn will
// append `reloadChainId=X` to its outgoing URL so Merkl rebuilds its server-side cache for
// that chain before responding (defeating Merkl's URL-keyed cache). Mark is consumed only
// after a successful fetch, so a failed batched call leaves the mark for the next retry.
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

// Mark a chain so the next `merklRewards` queryFn appends `reloadChainId=X` to the request.
// Used by the post-claim retry loop so the batched URL also gets fresh server-rebuilt data
// instead of Merkl's URL-edge-cached pre-claim numbers.
export const markChainAsReloaded = (chainId: number) => {
  recentlyReloadedChainIds.set(String(chainId), Date.now())
}

type BatchedResult = { ok: true; data: MerklRewardsResponse[] } | { ok: false; permanent: boolean }

const fetchRewardsPerChain = async (
  address: string,
  chainIds: string[],
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

        // Pull off any chains that were recently `markChainAsReloaded`-ed so we can append
        // `reloadChainId=X` to this fetch's URL — Merkl will rebuild its server-side cache
        // for those chains before responding. Marks are consumed only on a successful
        // response so a failed call leaves them for the next retry.
        const reloadedChains = chainIds.filter(isChainRecentlyReloaded)

        if (chainIds.length === 1 || batchedSupportState === 'unsupported') {
          const data = await fetchRewardsPerChain(address, chainIds, new Set(reloadedChains))
          const refreshedIds = new Set(data.map(item => String(item.chain.id)))
          reloadedChains.forEach(c => {
            if (refreshedIds.has(c)) recentlyReloadedChainIds.delete(c)
          })
          return { data }
        }

        const batched = await fetchRewardsBatched(address, chainIds, reloadedChains)
        if (batched.ok) {
          batchedSupportState = 'supported'
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
    // One-off per-chain fetch. Two roles:
    //   1) Pre-claim freshness — call right before submitting a claim tx so the proofs/amounts
    //      baked into calldata are the freshest available. Bypasses the RTK cache; the result
    //      is consumed locally and not written back.
    //   2) Post-claim Merkl backend rebuild — call with `withReload: true` after a claim tx
    //      confirms so Merkl invalidates its server-side cache for the chain. The caller is
    //      then expected to refetch the batched `merklRewards` query, which will pick up the
    //      now-fresh data and update the RTK cache atomically for every subscriber.
    // The `withReload` flag adds `reloadChainId=X` so Merkl rebuilds its backend cache before
    // responding.
    fetchMerklChainRewards: builder.mutation<
      MerklRewardsResponse[],
      { address: string; chainId: number; withReload?: boolean }
    >({
      async queryFn({ address, chainId, withReload }) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10_000)
        try {
          const url = withReload
            ? `${MERKL_API_BASE}/users/${address}/rewards?chainId=${chainId}&reloadChainId=${chainId}`
            : `${MERKL_API_BASE}/users/${address}/rewards?chainId=${chainId}`
          const res = await fetch(url, { signal: controller.signal })
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
