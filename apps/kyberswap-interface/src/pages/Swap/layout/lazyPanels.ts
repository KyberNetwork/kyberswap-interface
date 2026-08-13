import { lazy } from 'react'

/**
 * One `lazy()` instance per panel, shared by every trade page.
 *
 * Declaring these per page makes the same module a *different component type* on each route, so
 * moving between Swap, Limit and Stop Loss unmounts the panel and suspends on it again. The only
 * Suspense boundary sits around the whole app body, so that suspension replaces the entire page with
 * the route skeleton — a visible flash on a switch the UI presents as a tab.
 */
export const OrderList = lazy(() => import('components/LimitOrder/OrderList'))
export const SwapSettingsPanel = lazy(() => import('pages/Swap/components/SwapSettingsPanel'))
export const TokenInfo = lazy(() => import('components/TokenInfo'))
export const LiquiditySourcesPanel = lazy(() => import('pages/Swap/components/LiquiditySourcesPanel'))
