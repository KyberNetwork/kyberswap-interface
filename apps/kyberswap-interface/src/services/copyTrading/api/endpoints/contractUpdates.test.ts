import { configureStore } from '@reduxjs/toolkit'
import copyRunApi from 'services/copyTrading/api/endpoints/copyRuns'
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
