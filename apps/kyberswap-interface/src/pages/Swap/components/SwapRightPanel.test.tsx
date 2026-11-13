// @vitest-environment happy-dom
import { Token } from '@kyberswap/ks-sdk-core'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { CrossChainTradeRouteProps } from 'components/TradeRouting/CrossChainTradeRoute'
import { PRICE_CHART_QUOTES } from 'constants/tokens'

import SwapRightPanel from './SwapRightPanel'

const state = vi.hoisted(() => {
  let resolve: () => void = () => {}
  const ready = new Promise<void>(done => {
    resolve = done
  })
  return { ready, resolve, route: undefined as CrossChainTradeRouteProps | undefined }
})
vi.mock('components/TradeRouting/CrossChainTradeRoute', async () => {
  await state.ready
  return {
    CrossChainTradeRouteSlot: ({ slot }: any) => <span>{slot === 'heading' ? 'Live route' : 'Route graph'}</span>,
  }
})
vi.mock('pages/Swap/SwapPageRuntime', () => ({ useSwapRouteSnapshot: () => state.route }))
vi.mock('components/SwapForm/SingleChain/SingleChainSwapProvider', () => ({
  useSingleChainSwapContext: () => ({ chainId: 1 }),
}))
vi.mock('components/TradeRouting/SingleChainTradeRoute', () => ({ default: () => null }))
vi.mock('utils/aggregationRouting', () => ({ useTradeComposition: () => [] }))
vi.mock('hooks/useTracking', () => ({ default: () => ({ trackingHandler: vi.fn() }), TRACKING_EVENT_TYPE: {} }))
vi.mock('state/user/hooks', () => ({ useShowPricingChart: () => true, useShowTradeRoutes: () => true }))
vi.mock('hooks/useTheme', () => ({ default: () => ({}) }))
vi.mock('hooks/useTokens', () => ({ useStableCoins: () => ({ isStableCoin: () => false }) }))
vi.mock('react-use', () => ({ useMedia: () => false }))
vi.mock('components/CurrencyLogo', () => ({ default: () => null }))
vi.mock('components/Skeleton', () => ({ default: () => null }))
vi.mock('components/Tooltip', () => ({ MouseoverTooltip: ({ children }: any) => children }))
vi.mock('pages/Earns/PoolDetail/Information/utils', () => ({ formatRate: String, formatSignedPercent: String }))
vi.mock('pages/Earns/PoolDetail/components/PoolChartState', () => ({
  default: () => null,
  PoolChartSkeleton: () => null,
}))
vi.mock('components/TokenPriceChart/useTokenPriceChartData', () => ({
  useTokenPriceChartData: () => ({
    stableToken: PRICE_CHART_QUOTES[1],
    quoteToken: PRICE_CHART_QUOTES[1],
    chartData: [],
  }),
}))

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', () => 0)
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  state.route = undefined
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('preserves the real chart timeframe across mode changes and temporarily missing token metadata', async () => {
  const input = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'IN')
  const output = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'OUT')
  const crossOutput = new Token(8453, output.address, 18, 'OUT')
  const render = (isCrossChain: boolean, pending = false) =>
    act(async () =>
      root.render(
        <I18nProvider i18n={i18n}>
          <SwapRightPanel
            currencyIn={pending ? undefined : input}
            currencyOut={pending ? undefined : isCrossChain ? crossOutput : output}
            inputChain={1}
            isCrossChain={isCrossChain}
            isTokenLoading={pending}
          />
        </I18nProvider>,
      ),
    )
  const fourHours = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="tab"]')).find(
      button => button.textContent === '4h',
    )

  await render(false)
  await act(async () => fourHours()?.click())
  expect(fourHours()?.getAttribute('aria-selected')).toBe('true')
  await render(true)
  expect(fourHours()?.getAttribute('aria-selected')).toBe('true')
  await render(true, true)
  expect(fourHours()).toBeUndefined()
  await render(false)
  expect(fourHours()?.getAttribute('aria-selected')).toBe('true')
})

it('keeps route expansion while the provider and route chunks finish loading', async () => {
  const render = () =>
    act(async () =>
      root.render(
        <I18nProvider i18n={i18n}>
          <SwapRightPanel
            currencyIn={undefined}
            currencyOut={undefined}
            inputChain={1}
            isCrossChain
            isTokenLoading={false}
          />
        </I18nProvider>,
      ),
    )

  await render()
  const toggle = container.querySelector<HTMLButtonElement>('button[aria-expanded]')
  if (!toggle) throw new Error('Missing route toggle')
  await act(async () => toggle.click())
  const expanded = toggle.getAttribute('aria-expanded')
  state.route = { fromChainId: 1, selectedQuote: null, loading: false }
  await render()
  expect(container.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')).toBe(expanded)
  await act(async () => state.resolve())
  expect(container.textContent).toContain('Route graph')
  expect(container.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')).toBe(expanded)
})
