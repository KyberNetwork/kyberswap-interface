import { ChainId } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'

import { useNewTokens } from './useNewTokens'

const mocks = vi.hoisted(() => ({ query: vi.fn(() => ({})), fetch: vi.fn() }))
vi.mock('@tanstack/react-query', () => ({ useQuery: mocks.query }))
vi.mock('services/tokenCatalog', () => ({ fetchTokenCatalogTokens: mocks.fetch }))
it('requests a single aggregate page of 50 without chainIds, while single-chain New stays at 20', async () => {
  for (const chains of [undefined, [ChainId.MAINNET]]) {
    const Probe = () => {
      useNewTokens(chains)
      return null
    }
    renderToStaticMarkup(createElement(Probe))
    const options = (mocks.query.mock.lastCall as unknown as [{ queryFn: () => Promise<unknown> }])[0]
    await options.queryFn()
    expect(mocks.fetch).toHaveBeenLastCalledWith(
      chains
        ? { chainIds: '1', tag: 'new', page: 1, pageSize: 20, sort: undefined }
        : { tag: 'new', page: 1, pageSize: 50, sort: undefined },
    )
  }
})
