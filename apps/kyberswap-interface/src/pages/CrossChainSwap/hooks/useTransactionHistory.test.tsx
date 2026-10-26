// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { NormalizedTxResponse, SwapStatus } from 'pages/CrossChainSwap/adapters/types'
import { useTransactionHistory } from 'pages/CrossChainSwap/hooks/useTransactionHistory'

const mocks = vi.hoisted(() => ({
  transactions: [] as NormalizedTxResponse[],
  setTransactions: vi.fn(),
  dispatch: vi.fn(),
  poll: vi.fn(),
  scan: vi.fn(),
  track: vi.fn(),
  mixpanel: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('state/crossChainSwap', () => ({
  useCrossChainTransactions: () => [mocks.transactions, mocks.setTransactions],
  updateTransactionStatus: (payload: unknown) => ({ type: 'enrich', payload }),
}))
vi.mock('state/hooks', () => ({ useAppDispatch: () => mocks.dispatch }))
vi.mock('state/application/hooks', () => ({ useNotify: () => mocks.notify }))
vi.mock('hooks/useTracking', () => ({
  default: () => ({ trackingHandler: mocks.track }),
  useCrossChainMixpanel: () => ({ crossChainMixpanelHandler: mocks.mixpanel }),
  CROSS_CHAIN_MIXPANEL_TYPE: { CROSS_CHAIN_SWAP_SUCCESS: 'success' },
  TRACKING_EVENT_TYPE: { CC_SWAP_COMPLETED: 'completed' },
}))
vi.mock('pages/CrossChainSwap/adapters/KyberCrossAdapter', () => ({
  KyberCrossAdapter: class {
    getTransactionStatus = mocks.poll
  },
}))
vi.mock('pages/CrossChainSwap/factory', async () => {
  const { KyberCrossAdapter } = await import('pages/CrossChainSwap/adapters/KyberCrossAdapter')
  const adapter = new KyberCrossAdapter()
  return {
    registry: {
      getAdapter: (name: string) => (name === 'KyberCross' ? adapter : { getTransactionStatus: mocks.poll }),
    },
  }
})
vi.mock('pages/CrossChainSwap/adapters/KyberCrossAdapter/api', () => ({ kyberCrossApi: { scanTxStatus: mocks.scan } }))
vi.mock('pages/CrossChainSwap/adapters/KyberCrossAdapter/utils', () => ({
  mapRouteStateToSwapStatus: (result: SwapStatus) => result,
}))
vi.mock('pages/CrossChainSwap/tracking', () => ({ getSwapTrackingData: () => ({}) }))
vi.mock('pages/CrossChainSwap/utils', () => ({ getChainName: () => 'Ethereum' }))

let root: ReturnType<typeof createRoot>
const Harness = () => {
  useTransactionHistory()
  return null
}
const render = () => act(async () => root.render(<Harness />))
const transaction = (
  id: string,
  status: NormalizedTxResponse['status'],
  adapter = 'KyberCross',
): NormalizedTxResponse =>
  ({
    id,
    status,
    adapter,
    timestamp: Date.now(),
    sourceTxHash: `0x${id}`,
    outputAmount: '100',
  } as NormalizedTxResponse)

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  vi.resetAllMocks()
  mocks.transactions = []
  mocks.poll.mockResolvedValue({ status: 'Processing' })
  mocks.scan.mockResolvedValue({ data: { route_execution: { status: 'Success', txHash: '0xfill' } } })
  mocks.setTransactions.mockImplementation(transactions => {
    mocks.transactions = transactions
  })
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('enriches terminal KyberCross transactions without rows, once per updater mount, including failed scans', async () => {
  mocks.transactions = [
    transaction('done', 'Success'),
    transaction('retry', 'Failed'),
    transaction('other', 'Success', 'Relay'),
  ]
  mocks.scan.mockRejectedValueOnce(new Error('offline'))
  await render()
  expect(mocks.scan).toHaveBeenCalledTimes(2)
  expect(mocks.poll).not.toHaveBeenCalled()
  expect(mocks.dispatch).toHaveBeenCalledWith({
    type: 'enrich',
    payload: { id: 'retry', result: { status: 'Success', txHash: '0xfill' } },
  })
  mocks.transactions = mocks.transactions.map(tx => ({ ...tx }))
  await render()
  await act(async () => vi.advanceTimersByTimeAsync(30_000))
  expect(mocks.scan).toHaveBeenCalledTimes(2)
  expect(mocks.track).not.toHaveBeenCalled()

  await act(async () => root.render(null))
  await render()
  expect(mocks.scan).toHaveBeenCalledTimes(4)
})

it('polls processing transactions independently, checks expired ones once, and clears its timer on unmount', async () => {
  const expired = { ...transaction('expired', 'Processing'), timestamp: Date.now() - 25 * 60 * 60 * 1000 }
  mocks.transactions = [transaction('active', 'Processing'), expired]
  await render()
  expect(mocks.poll).toHaveBeenCalledTimes(2)
  expect(mocks.scan).not.toHaveBeenCalled()
  await act(async () => vi.advanceTimersByTimeAsync(10_000))
  expect(mocks.poll).toHaveBeenCalledTimes(3)
  expect(mocks.poll.mock.calls[2][0].id).toBe('active')
  await act(async () => root.render(null))
  expect(vi.getTimerCount()).toBe(0)
})

it('enriches newly completed transactions while retaining processing completion tracking exactly once', async () => {
  mocks.transactions = [transaction('active', 'Processing')]
  mocks.poll.mockResolvedValue({ status: 'Success', txHash: '0xfill', amountOut: '90' })
  await render()
  expect(mocks.transactions[0]).toMatchObject({ status: 'Success', outputAmount: '90', estimatedAmountOut: '100' })
  expect(mocks.track).toHaveBeenCalledTimes(1)
  expect(mocks.mixpanel).toHaveBeenCalledTimes(1)
  await render()
  expect(mocks.scan).toHaveBeenCalledOnce()
  await act(async () => vi.advanceTimersByTimeAsync(10_000))
  expect(mocks.poll).toHaveBeenCalledOnce()
  expect(mocks.track).toHaveBeenCalledTimes(1)
})
