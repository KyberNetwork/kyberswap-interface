// @vitest-environment happy-dom
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { type ReactNode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import RouteGraphView from 'components/TradeRouting/RouteGraphView'
import { buildV3RouteGraph } from 'components/TradeRouting/routeGraph'
import type { SwapRouteV3 } from 'utils/aggregationRouting'

vi.mock('components/CurrencyLogo', () => ({ default: () => <span data-logo /> }))
vi.mock('utils/explorer', () => ({
  getEtherscanLink: (chain: number, pool: string) => `https://explorer.test/${chain}/address/${pool}`,
}))
vi.mock('react-indiana-drag-scroll', () => ({
  default: ({ children, onScroll }: { children: ReactNode; onScroll: () => void }) => (
    <div data-scroll onScroll={onScroll}>
      {children}
    </div>
  ),
}))

const tokenIn = new Token(ChainId.BASE, '0x0000000000000000000000000000000000000001', 18, 'A')
const tokenOut = new Token(ChainId.BASE, '0x0000000000000000000000000000000000000002', 18, 'B')
const trade: SwapRouteV3[] = [
  {
    tokenIn,
    tokenOut,
    pool: '0x0000000000000000000000000000000000000003-fee',
    swapAmount: '100',
    amountOut: '100',
    exchange: 'dex',
  },
]
let root: ReturnType<typeof createRoot>
let container: HTMLDivElement
let scrollLeft: number
let nodeOffset: number
const observers: { callback: ResizeObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 16))
  vi.stubGlobal('cancelAnimationFrame', (id: ReturnType<typeof setTimeout>) => clearTimeout(id))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()
      constructor(callback: ResizeObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect })
      }
    },
  )
  scrollLeft = 0
  nodeOffset = 0
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.tagName.toLowerCase() === 'svg'
      ? new DOMRect(100 - scrollLeft, 200, 500, 200)
      : new DOMRect(148 - scrollLeft + nodeOffset, 200, 168, 113)
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  observers.length = 0
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const mount = async () => act(async () => root.render(<RouteGraphView graph={buildV3RouteGraph(trade, tokenIn)} />))
const flushFrame = async () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })

describe('shared route measurement lifecycle', () => {
  it('keeps connectors aligned during scrolling and updates resize geometry without losing focused links', async () => {
    await mount()
    const link = container.querySelector('a')
    if (!link) throw new Error('Missing pool link')
    expect(link.href).toContain(`/8453/address/${trade[0].pool.split('-')[0]}`)
    link.focus()
    const pathBefore = container.querySelector('path[marker-end]')?.getAttribute('d')
    scrollLeft = 40
    await act(async () => container.querySelector('[data-scroll]')?.dispatchEvent(new Event('scroll')))
    await flushFrame()
    expect(container.querySelector('a')).toBe(link)
    expect(document.activeElement).toBe(link)
    expect(container.querySelector('path[marker-end]')?.getAttribute('d')).toBe(pathBefore)
    nodeOffset = 24
    await act(async () => window.dispatchEvent(new Event('resize')))
    await flushFrame()
    expect(container.querySelector('a')).toBe(link)
    expect(document.activeElement).toBe(link)
    expect(container.querySelector('path[marker-end]')?.getAttribute('d')).not.toBe(pathBefore)
  })

  it('disconnects measurements and cancels a pending scroll frame on unmount', async () => {
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const cancelFrame = vi.spyOn(globalThis, 'cancelAnimationFrame')
    await mount()
    await act(async () => container.querySelector('[data-scroll]')?.dispatchEvent(new Event('scroll')))
    await act(async () => root.unmount())
    expect(observers[0].disconnect).toHaveBeenCalledOnce()
    expect(removeListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(cancelFrame).toHaveBeenCalledOnce()
    await flushFrame()
    expect(container.childElementCount).toBe(0)
  })
})
