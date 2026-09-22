import { configureStore } from '@reduxjs/toolkit'
import discoveryApi from 'services/copyTrading/api/endpoints/discovery'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('chain discovery cache', () => {
  it('retains token metadata across subscribers, pending refetches and failed refetches', async () => {
    const token = { chainId: '8453', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', decimals: 6 }
    const response = { data: [{ chainId: '8453', isEnabled: true, quoteToken: token }] }
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(response)))
    vi.stubGlobal('fetch', fetch)
    const store = configureStore({
      reducer: { [discoveryApi.reducerPath]: discoveryApi.reducer },
      middleware: getDefaultMiddleware => getDefaultMiddleware().concat(discoveryApi.middleware),
    })
    const select = () => discoveryApi.endpoints.getChains.select()(store.getState())
    try {
      await store.dispatch(discoveryApi.endpoints.getChains.initiate(undefined, { forceRefetch: false })).unwrap()
      const cached = select().data
      expect(cached?.data[0].quoteToken).toMatchObject({ ...token, chainId: 8453 })

      await store.dispatch(discoveryApi.endpoints.getChains.initiate(undefined, { forceRefetch: false })).unwrap()
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(select().data).toBe(cached)

      let resolveFetch: (response: Response) => void = () => undefined
      fetch.mockImplementationOnce(
        () =>
          new Promise<Response>(resolve => {
            resolveFetch = resolve
          }),
      )
      const refresh = store.dispatch(discoveryApi.endpoints.getChains.initiate(undefined, { forceRefetch: true }))
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
      expect(select().status).toBe('pending')
      expect(select().data).toBe(cached)
      resolveFetch(new Response('{}', { status: 503 }))
      await refresh
      expect(select().status).toBe('rejected')
      expect(select().data).toBe(cached)

      fetch.mockResolvedValueOnce(new Response(JSON.stringify(response)))
      await store.dispatch(discoveryApi.endpoints.getChains.initiate(undefined, { forceRefetch: true })).unwrap()
      expect(select().data?.data[0].quoteToken).toBe(cached?.data[0].quoteToken)
    } finally {
      store.dispatch(discoveryApi.util.resetApiState())
    }
  })
})
