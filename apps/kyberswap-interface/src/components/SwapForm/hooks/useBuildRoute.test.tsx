// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import useBuildRoute from './useBuildRoute'

const mocks = vi.hoisted(() => ({ build: vi.fn() }))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1, account: 'sender' }) }))
vi.mock('hooks/useENS', () => ({
  default: (value: string) => ({ address: value === 'recipient.eth' ? 'resolved-recipient' : null }),
}))
vi.mock('hooks/useKyberSwapConfig', () => ({ useKyberswapGlobalConfig: () => ({}) }))
vi.mock('components/SwapForm/hooks/useRouteRequest', () => ({ useRouteApiDomain: () => 'https://example.test' }))
vi.mock('services/route', () => ({
  default: { useBuildRouteMutation: () => [mocks.build] },
  AGGREGATOR_API_PATHS: { BUILD_ROUTE: '/build' },
}))
vi.mock('constants/networks', () => ({ NETWORKS_INFO: { 1: { aggregatorRoute: 'ethereum' } } }))
vi.mock('utils/cookie', () => ({ getCookieValue: () => '' }))
vi.mock('utils/nativeErc20', () => ({ amountFromRoute: vi.fn(), routeTokenDecimals: vi.fn() }))
vi.mock('utils/safeApp', () => ({ isInSafeApp: false, SAFE_APP_CLIENT_ID: 'safe' }))

let root: ReturnType<typeof createRoot>
let build: ReturnType<typeof useBuildRoute>
const Harness = ({ recipient }: { recipient: string }) => {
  build = useBuildRoute({
    recipient,
    routeSummary: { rawAmountInUsd: '1', rawAmountOutUsd: '1' } as Parameters<typeof useBuildRoute>[0]['routeSummary'],
    slippage: 50,
    transactionTimeout: 1200,
    currencyIn: undefined,
    currencyOut: undefined,
  })
  return null
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.build.mockReset().mockReturnValue({ unwrap: async () => ({ data: { data: 'tx' } }), abort: vi.fn() })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it.each(['', 'invalid'])('rejects recipient %j without falling back to the sender', async recipient => {
  await act(async () => root.render(<Harness recipient={recipient} />))
  const result = await build(new AbortController().signal)
  expect(result.error).toBeTruthy()
  expect(mocks.build).not.toHaveBeenCalled()
})

it('builds with the resolved recipient and blocks after it is cleared', async () => {
  await act(async () => root.render(<Harness recipient="recipient.eth" />))
  await build(new AbortController().signal)
  expect(mocks.build).toHaveBeenCalledWith(
    expect.objectContaining({
      payload: expect.objectContaining({ sender: 'sender', recipient: 'resolved-recipient' }),
    }),
  )
  mocks.build.mockClear()
  await act(async () => root.render(<Harness recipient="" />))
  expect((await build(new AbortController().signal)).error).toBeTruthy()
  expect(mocks.build).not.toHaveBeenCalled()
})
