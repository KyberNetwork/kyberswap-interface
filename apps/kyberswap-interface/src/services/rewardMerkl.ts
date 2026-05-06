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

type BatchedResult = { ok: true; data: MerklRewardsResponse[] } | { ok: false; permanent: boolean }

const fetchRewardsPerChain = async (address: string, chainIds: string[]): Promise<MerklRewardsResponse[]> => {
  const results = await Promise.all(
    chainIds.map(async cId => {
      try {
        const res = await fetch(`${MERKL_API_BASE}/users/${address}/rewards?chainId=${cId}`)
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

        if (chainIds.length === 1 || batchedSupportState === 'unsupported') {
          return { data: await fetchRewardsPerChain(address, chainIds) }
        }

        const batched = await fetchRewardsBatched(address, chainIds)
        if (batched.ok) {
          batchedSupportState = 'supported'
          return { data: batched.data }
        }

        // Only lock to per-chain when the failure is permanent (e.g., Merkl 4xx says the
        // batched format is unsupported). Transient failures fall back this once but leave
        // batchedSupportState alone so the next poll can try batched again.
        if (batched.permanent) batchedSupportState = 'unsupported'
        return { data: await fetchRewardsPerChain(address, chainIds) }
      },
    }),
    // One-off per-chain fetch. Two roles:
    //   1) Pre-claim freshness — call right before submitting a claim tx so the proofs/amounts
    //      baked into calldata are the freshest available.
    //   2) Post-claim sync — drive the retry loop after a claim tx confirms.
    // Bypasses the main RTK Query cache for the request itself, then patches the resulting chain
    // payload into every active `merklRewards` cache entry that includes this chainId (see
    // `onQueryStarted`). Patching directly avoids relying on `refetch` to propagate post-claim
    // data to all subscribers — refetch can be deduped, raced, or skipped under specific
    // arg/skip conditions and we observed UIs sticking on pre-claim numbers as a result.
    // The `withReload` flag adds `reloadChainId=X` to force Merkl to rebuild its backend cache
    // for the chain before responding (used post-claim, skipped pre-claim where we just want
    // current Merkl data without paying the rebuild cost).
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
      // After a successful single-chain fetch with `withReload: true`, patch the chain's payload
      // into every fulfilled `merklRewards` cache entry whose args include this chainId.
      // Without this, the fresh per-chain response would only be visible to the one caller that
      // awaited it, leaving `useMerklRewardsQuery` subscribers stuck on stale data.
      //
      // Gated on `withReload` so the pre-claim freshness fetch (which hits Merkl WITHOUT
      // `reloadChainId`) does NOT patch the cache — pre-claim responses come from Merkl's URL-
      // edge cache and can be older than what a concurrent post-claim sync just wrote in.
      // Only the post-claim path forces a backend rebuild, so only it should publish to cache.
      async onQueryStarted({ address, chainId, withReload }, { dispatch, queryFulfilled, getState }) {
        if (!withReload) return
        try {
          const { data } = await queryFulfilled
          const chainData = data.find(item => item.chain.id === chainId)
          if (!chainData) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiState = (getState() as any)[rewardMerklApi.reducerPath]
          const queries = apiState?.queries || {}
          const targetChainId = String(chainId)
          Object.values(queries).forEach((entry: unknown) => {
            const e = entry as { endpointName?: string; originalArgs?: MerklRewardsParams; status?: string } | undefined
            // Filter to fulfilled `merklRewards` entries only. Patching a `pending` entry races
            // its in-flight response; patching `uninitialized`/`rejected` writes into a draft
            // with no baseline data, which is at best a no-op and at worst confuses subscribers.
            if (!e || e.endpointName !== 'merklRewards' || e.status !== 'fulfilled') return
            const args = e.originalArgs
            if (!args || args.address !== address) return
            const argChainIds = String(args.chainId)
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
            if (!argChainIds.includes(targetChainId)) return
            dispatch(
              rewardMerklApi.util.updateQueryData('merklRewards', args, draft => {
                const idx = draft.findIndex(item => item.chain.id === chainId)
                if (idx >= 0) draft[idx] = chainData
                else draft.push(chainData)
              }),
            )
          })
        } catch {
          // fetch errored — nothing to patch
        }
      },
    }),
  }),
})

export const { useGetMerklChainsQuery, useMerklRewardsQuery, useFetchMerklChainRewardsMutation } = rewardMerklApi

export default rewardMerklApi
