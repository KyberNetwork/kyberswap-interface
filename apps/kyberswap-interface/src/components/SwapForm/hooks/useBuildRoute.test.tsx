// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import useBuildRoute, { getOutputChangePercent } from 'components/SwapForm/hooks/useBuildRoute'

type Args = Parameters<typeof useBuildRoute>[0]

const mocks = vi.hoisted(() => ({ swap: vi.fn() }))
vi.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 1, account: 'sender' }) }))
vi.mock('hooks/useENS', () => ({
  default: (value: string) => ({ address: value === 'recipient.eth' ? 'resolved-recipient' : null }),
}))
vi.mock('hooks/useKyberSwapConfig', () => ({ useKyberswapGlobalConfig: () => ({}) }))
vi.mock('components/SwapForm/hooks/useRouteRequest', () => ({
  useRouteApiDomain: () => 'https://example.test',
  isRouteFeeTampered: (extraFee: { feeReceiver?: string } | undefined, intended: { feeReceiver?: string }) =>
    !!extraFee?.feeReceiver && extraFee.feeReceiver !== intended.feeReceiver,
}))
vi.mock('services/route', () => ({
  default: { useSwapRouteMutation: () => [mocks.swap] },
  AGGREGATOR_API_PATHS: { SWAP: '/swap' },
}))
vi.mock('constants/networks', () => ({ NETWORKS_INFO: { 1: { aggregatorRoute: 'ethereum' } } }))
vi.mock('utils/cookie', () => ({ getCookieValue: () => '' }))
vi.mock('utils/nativeErc20', () => ({ amountFromRoute: vi.fn() }))
vi.mock('utils/safeApp', () => ({ isInSafeApp: false, SAFE_APP_CLIENT_ID: 'safe' }))

const routeParams = { tokenIn: 'in', tokenOut: 'out', amountIn: '100', feeAmount: '10', feeReceiver: 'fee' }
const swapData = {
  data: 'tx',
  amountIn: '100',
  amountOut: '990',
  routerAddress: '0xRouter',
  transactionValue: '0',
  routeSummary: { amountOut: '990', extraFee: { feeAmount: '10', feeReceiver: 'fee' } },
}
const respond = (data: object) =>
  mocks.swap.mockReturnValue({ unwrap: async () => ({ data: { ...swapData, ...data } }), abort: vi.fn() })

let root: ReturnType<typeof createRoot>
let build: ReturnType<typeof useBuildRoute>
const Harness = ({ recipient, routerAddress = '0xrouter' }: { recipient: string; routerAddress?: string }) => {
  build = useBuildRoute({
    recipient,
    routeParams,
    routeSummary: { amountOut: '1000' } as Args['routeSummary'],
    routerAddress,
    slippage: 50,
    transactionTimeout: 1200,
    currencyIn: undefined,
  })
  return null
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  mocks.swap.mockReset()
  respond({})
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
  expect(mocks.swap).not.toHaveBeenCalled()
})

it('builds with the resolved recipient and blocks after it is cleared', async () => {
  await act(async () => root.render(<Harness recipient="recipient.eth" />))
  await build(new AbortController().signal)
  expect(mocks.swap).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({ sender: 'sender', recipient: 'resolved-recipient' }),
    }),
  )
  mocks.swap.mockClear()
  await act(async () => root.render(<Harness recipient="" />))
  expect((await build(new AbortController().signal)).error).toBeTruthy()
  expect(mocks.swap).not.toHaveBeenCalled()
})

it('requests the quoted trade from the swap endpoint and reports the output change against the quote', async () => {
  await act(async () => root.render(<Harness recipient="recipient.eth" />))
  const result = await build(new AbortController().signal)

  expect(mocks.swap).toHaveBeenCalledWith(
    expect.objectContaining({
      url: 'https://example.test/ethereum/swap',
      params: expect.objectContaining({ ...routeParams, slippageTolerance: 50, enableSimulation: true }),
    }),
  )
  expect(result.data).toMatchObject({ data: 'tx', amountOut: '990', outputChange: { percent: -1 } })
})

it.each([
  ['a reverted simulation', { simulation: { status: 'reverted', reason: 'CallExecutorFailed' } }, 'CallExecutorFailed'],
  ['a router other than the quoted one', { routerAddress: '0xother' }, 'router'],
  ['a fee other than the requested one', { routeSummary: { extraFee: { feeReceiver: 'other' } } }, 'fee'],
])('returns no transaction for %s', async (_case, data, message) => {
  respond(data)
  await act(async () => root.render(<Harness recipient="recipient.eth" />))
  const result = await build(new AbortController().signal)

  expect(result.data).toBeUndefined()
  expect(result.error).toContain(message)
})

it.each([
  ['1000', '1000', 0],
  ['1000', '1005', 0.5],
  ['3000000', '2999999', -0.0000333],
  ['0', '5', 0],
])('computes the output change from %s to %s as %s percent', (quoted, built, percent) => {
  expect(getOutputChangePercent(quoted, built)).toBeCloseTo(percent, 7)
})
