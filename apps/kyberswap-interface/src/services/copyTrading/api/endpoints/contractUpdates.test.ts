import { configureStore } from '@reduxjs/toolkit'
import copyAccountApi from 'services/copyTrading/api/endpoints/copyAccounts'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
import preparedActionApi from 'services/copyTrading/api/endpoints/preparedActions'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ownerAddress = '0x1111111111111111111111111111111111111111'
const createStore = () =>
  configureStore({
    reducer: { [copyRunApi.reducerPath]: copyRunApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(copyRunApi.middleware),
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('copy-run request contract', () => {
  it('combines token and action filters and omits tokenAddress for All tokens and Alert Feed', async () => {
    const fetch = vi.fn(async (_request: Request) => new Response(JSON.stringify({ data: [] })))
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    const tokenAddress = '0x2222222222222222222222222222222222222222'
    try {
      for (const query of [
        { activitySurface: 'copy_run_log' as const, tokenAddress },
        { activitySurface: 'copy_run_log' as const },
        { activitySurface: 'alert_feed' as const, tokenAddress },
      ]) {
        await store
          .dispatch(
            copyRunApi.endpoints.getOwnerActivity.initiate({
              ownerAddress,
              copyRunId: 'run-1',
              category: 'fee_rebate',
              subtype: 'rebate_received',
              ...query,
            }),
          )
          .unwrap()
        const params = new URL(fetch.mock.calls[fetch.mock.calls.length - 1][0].url).searchParams
        expect(params.get('tokenAddress')).toBe(
          query.activitySurface === 'copy_run_log' ? query.tokenAddress || null : null,
        )
        expect(params.get('category')).toBe('ACTIVITY_CATEGORY_FEE_REBATE')
        expect(params.get('subtype')).toBe('ACTIVITY_SUBTYPE_REBATE_RECEIVED')
        expect(params.has('cursor')).toBe(false)
      }
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })

  it('loads up to 100 historical tokens and preserves identities with missing metadata', async () => {
    const tokens = [
      { chainId: '8453', address: '0x2222222222222222222222222222222222222222', symbol: 'OLD', decimals: 0 },
      { chainId: '8453', address: '0x3333333333333333333333333333333333333333' },
    ]
    const meta = {
      fieldQualities: [{ group: 'FIELD_GROUP_TOKEN_METADATA', completeness: 'DATA_COMPLETENESS_PARTIAL' }],
    }
    const fetch = vi.fn(
      async (_request: Request) =>
        new Response(JSON.stringify({ data: tokens, pagination: { hasMore: false, limit: 100 }, meta })),
    )
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    try {
      const result = await store
        .dispatch(
          copyRunApi.endpoints.getCopyRunActivityTokens.initiate({
            ownerAddress,
            copyRunId: 'run-1',
            limit: 100,
          }),
        )
        .unwrap()
      expect(fetch).toHaveBeenCalledTimes(1)
      const url = new URL(fetch.mock.calls[0][0].url)
      expect(url.pathname).toContain(`/users/${ownerAddress}/copy-runs/run-1/activity-tokens`)
      expect(Object.fromEntries(url.searchParams)).toEqual({ limit: '100' })
      expect(result.data).toMatchObject([
        { ...tokens[0], chainId: 8453 },
        { ...tokens[1], chainId: 8453 },
      ])
      expect(result.data[1].decimals).toBeUndefined()
      expect(result.pagination.hasMore).toBe(false)
      expect(result.meta).toEqual(meta)
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })

  it('sends run-volume sorting and lifecycle filters to the API', async () => {
    const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: [] })))
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    try {
      await store
        .dispatch(copyRunApi.endpoints.getCopyRuns.initiate({ ownerAddress, view: 'open', sortBy: 'volume' }))
        .unwrap()
      expect(new URL((fetch.mock.calls[0][0] as Request).url).searchParams.get('sortBy')).toBe(
        'OWNER_COPY_RUN_SORT_FIELD_VOLUME',
      )
      for (const subtype of ['copy_started', 'copy_stopped'] as const) {
        await store
          .dispatch(
            copyRunApi.endpoints.getOwnerActivity.initiate({
              ownerAddress,
              copyRunId: 'run-1',
              activitySurface: 'copy_run_log',
              category: 'copy_lifecycle',
              subtype,
            }),
          )
          .unwrap()
        const params = new URL((fetch.mock.calls[fetch.mock.calls.length - 1][0] as Request).url).searchParams
        expect(params.get('category')).toBe('ACTIVITY_CATEGORY_COPY_LIFECYCLE')
        expect(params.get('subtype')).toBe(`ACTIVITY_SUBTYPE_${subtype.toUpperCase()}`)
      }
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })
})

describe('canonical public identity contract', () => {
  const copyRunId = 'cr_' + 'Aa0_-'.repeat(8) + 'Aa0'
  const positionId = '0x' + 'ab'.repeat(32)

  it('sends canonical Stop selections, including an explicitly empty selection', async () => {
    const fetch = vi.fn(
      async (_request: Request) => new Response(JSON.stringify({ data: _request.method === 'GET' ? [] : {} })),
    )
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    try {
      for (const positionIds of [[positionId], []]) {
        await store
          .dispatch(
            preparedActionApi.endpoints.prepareStopCopy.initiate({
              ownerAddress,
              copyRunId,
              positionIds,
              slippageBps: 400,
            }),
          )
          .unwrap()
        const request = fetch.mock.calls[fetch.mock.calls.length - 1][0] as Request
        expect(new URL(request.url).pathname).toContain(`/copy-runs/${copyRunId}:prepareStopCopy`)
        expect(await request.json()).toEqual({ positionIds, slippageBps: 400 })
      }
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })

  it('uses the same follower position for sell, close, and account obligations', async () => {
    const fetch = vi.fn(
      async (_request: Request) => new Response(JSON.stringify({ data: _request.method === 'GET' ? [] : {} })),
    )
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    try {
      await store
        .dispatch(
          preparedActionApi.endpoints.prepareManualSell.initiate({
            ownerAddress,
            copyRunId,
            positionId,
            slippageBps: 125,
            expectedUnresolvedSkipCount: 2,
            expectedSellRatioRaw: '500000000000000000',
          }),
        )
        .unwrap()
      await store
        .dispatch(
          preparedActionApi.endpoints.prepareClosePosition.initiate({
            ownerAddress,
            copyRunId,
            positionId,
            slippageBps: 125,
          }),
        )
        .unwrap()
      await store
        .dispatch(
          copyAccountApi.endpoints.getPendingSellObligations.initiate({
            chainId: 8453,
            copyAccount: ownerAddress,
            positionId,
            cursor: 'signed_opaque+/=',
            limit: 10,
          }),
        )
        .unwrap()
      const requests = fetch.mock.calls.map(call => call[0] as Request)
      expect(new URL(requests[0].url).pathname).toContain(
        `/copy-runs/${copyRunId}/positions/${positionId}:prepareManualSell`,
      )
      expect(new URL(requests[1].url).pathname).toContain(
        `/copy-runs/${copyRunId}/positions/${positionId}:prepareClosePosition`,
      )
      expect(new URL(requests[2].url).pathname).toContain(
        `/copy-accounts/8453/${ownerAddress}/positions/${positionId}/pending-sell-obligations`,
      )
      expect(new URL(requests[2].url).searchParams.get('cursor')).toBe('signed_opaque+/=')
      expect(await requests[0].json()).toEqual({
        slippageBps: 125,
        expectedUnresolvedSkipCount: 2,
        expectedSellRatioRaw: '500000000000000000',
      })
      expect(await requests[1].json()).toEqual({ slippageBps: 125 })
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })

  it('preserves the complete submitted status context while exposing new result and guidance IDs', async () => {
    const statusContext = { expectedOwner: ownerAddress, operatorSelector: { legacyStoredIdentity: 'keep-verbatim' } }
    const transactionHash = '0x' + 'cd'.repeat(32)
    const data = {
      result: { copyRunId, positionId },
      display: { copyRunId, positionId, status: 'SUBMITTED_ACTION_DISPLAY_STATUS_READY' },
      guidance: { nextSteps: [{ kind: 'ACTION_GUIDANCE_STEP_KIND_VIEW_EXISTING_RESULT', copyRunId, positionId }] },
    }
    const fetch = vi.fn(async (_request: Request) => new Response(JSON.stringify({ data })))
    vi.stubGlobal('fetch', fetch)
    const store = createStore()
    try {
      const response = await store
        .dispatch(
          preparedActionApi.endpoints.getSubmittedActionStatus.initiate({
            ownerAddress,
            statusContext,
            transactionHash,
          }),
        )
        .unwrap()
      expect(await (fetch.mock.calls[0][0] as Request).json()).toEqual({ statusContext, transactionHash })
      expect(response.data).toEqual(data)
    } finally {
      store.dispatch(copyRunApi.util.resetApiState())
    }
  })
})
