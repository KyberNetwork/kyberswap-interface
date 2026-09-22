import type { PropsWithChildren } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { RouterProvider, createMemoryRouter, useParams } from 'react-router-dom'
import type { Chain } from 'services/copyTrading/types/agents'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCopyTradingContext } from './context'
import { useCopyTradingRoutes } from './hooks/useCopyTradingRoutes'
import CopyTrading from './index'

const discovery = vi.hoisted(() => ({
  data: undefined as undefined | { data: Chain[] },
  isFetching: false,
  refetch: vi.fn(),
}))

vi.mock('services/copyTrading/api/endpoints/discovery', () => ({ default: { useGetChainsQuery: () => discovery } }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ account: undefined }) }))
vi.mock('components/LocalLoader', () => ({ default: () => <span>Loading chains</span> }))
vi.mock('pages/CopyTrading/components/common/layout', () => ({
  CopyTradingPage: ({ children }: PropsWithChildren) => <main>{children}</main>,
}))
vi.mock('pages/CopyTrading/components/common/status', () => ({ CopyTradingReadError: () => <span>Read error</span> }))
vi.mock('pages/CopyTrading/components/Sidebar', () => ({ default: () => null }))
vi.mock('pages/CopyTrading/modals/context', () => ({
  CopyTradingModalProvider: ({ children }: PropsWithChildren) => <>{children}</>,
}))
vi.mock('pages/CopyTrading/AgentList', () => ({ default: () => <Probe /> }))
vi.mock('pages/CopyTrading/AgentProfile', () => ({ default: () => <Probe /> }))
vi.mock('pages/CopyTrading/CopyDetail', () => ({ default: () => <Probe /> }))
vi.mock('pages/CopyTrading/CopyHistory', () => ({ default: () => <Probe /> }))
vi.mock('pages/CopyTrading/MyCopies', () => ({ default: () => <Probe /> }))

function Probe() {
  const { selectedChainId } = useCopyTradingContext()
  const path = useCopyTradingRoutes()
  const { agentCode, copyId } = useParams()
  return (
    <span>
      {selectedChainId}:{agentCode || copyId || 'list'}:{path('history')}:{path('my-copies/run-2', 1)}
    </span>
  )
}

const routerAt = (path: string) =>
  createMemoryRouter([{ path: '/copy-trading/*', element: <CopyTrading /> }], { initialEntries: [path] })
const render = (router: ReturnType<typeof routerAt>) => renderToStaticMarkup(<RouterProvider router={router} />)

afterEach(() => {
  vi.unstubAllGlobals()
})

beforeEach(() => {
  vi.stubGlobal('window', { location: { origin: 'https://example.test' } })
  discovery.data = {
    data: [
      {
        chainId: 1,
        slug: 'ethereum',
        name: 'Ethereum',
        iconUrl: '',
        isEnabled: true,
        quoteToken: { chainId: 1, address: '0x1111111111111111111111111111111111111111', decimals: 6 },
      },
      {
        chainId: 8453,
        slug: 'base',
        name: 'Base',
        iconUrl: '',
        isEnabled: true,
        quoteToken: { chainId: 8453, address: '0x2222222222222222222222222222222222222222', decimals: 6 },
      },
    ],
  }
  discovery.isFetching = false
})

describe('Copy Trading route boundary', () => {
  it.each([
    ['/copy-trading/base', 'list'],
    ['/copy-trading/base/my-copies', 'list'],
    ['/copy-trading/base/history', 'list'],
    ['/copy-trading/base/agent-1', 'agent-1'],
    ['/copy-trading/base/my-copies/run-1', 'run-1'],
    ['/copy-trading/base/history/run-1', 'run-1'],
  ])('mounts %s with the chain and nested params from the URL', (url, id) => {
    const router = routerAt(url)
    expect(render(router)).toContain(`8453:${id}:/copy-trading/base/history:/copy-trading/ethereum/my-copies/run-2`)
    router.dispose()
  })

  it('follows navigation and browser history without separate selected chain state', async () => {
    const router = routerAt('/copy-trading/base')
    expect(render(router)).toContain('8453:list')
    await router.navigate('/copy-trading/ethereum')
    expect(render(router)).toContain('1:list')
    await router.navigate(-1)
    expect(render(router)).toContain('8453:list')
    await router.navigate(1)
    expect(render(router)).toContain('1:list')
    router.dispose()
  })

  it('waits for the catalog before mounting any chain-scoped page', () => {
    discovery.data = undefined
    discovery.isFetching = true
    const router = routerAt('/copy-trading/base/agent-1')
    expect(render(router)).toContain('Loading chains')
    discovery.isFetching = false
    expect(render(router)).toContain('Read error')
    router.dispose()
  })

  it.each([1, 8453])('handles missing quote token for chain %s at the outer boundary', chainId => {
    const complete = discovery.data
    if (!complete) throw new Error('Missing catalog fixture')
    discovery.data = {
      data: complete.data.map(chain => (chain.chainId === chainId ? { ...chain, quoteToken: undefined } : chain)),
    }
    const router = routerAt('/copy-trading/base/my-copies')
    expect(render(router)).toContain('Read error')
    expect(render(router)).not.toContain('8453:list')
    discovery.data = complete
    expect(render(router)).toContain('8453:list')
    router.dispose()
  })

  it('retains the selected chain with cached data during pending and failed refetches', () => {
    const router = routerAt('/copy-trading/base')
    const original = render(router)
    discovery.isFetching = true
    expect(render(router)).toBe(original)
    discovery.isFetching = false
    expect(render(router)).toBe(original)
    router.dispose()
  })
})
