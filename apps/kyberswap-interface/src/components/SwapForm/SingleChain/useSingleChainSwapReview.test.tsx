// @vitest-environment happy-dom
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useSingleChainSwapReview } from 'components/SwapForm/SingleChain/useSingleChainSwapReview'
import type { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { useSwapReviewSession } from 'components/SwapForm/hooks/useSwapReviewSession'
import type { DetailedRouteSummary } from 'types/route'

const mocks = vi.hoisted(() => ({ build: vi.fn(), execute: vi.fn(), track: vi.fn(), dispatch: vi.fn() }))
vi.mock('react-redux', () => ({ useDispatch: () => mocks.dispatch }))
vi.mock('hooks', () => ({
  useActiveWeb3React: () => ({
    account: 'sender',
    chainId: 1,
    networkInfo: { name: 'Ethereum', nativeToken: { symbol: 'ETH' } },
  }),
}))
vi.mock('hooks/useTracking', () => ({
  default: () => ({ trackingHandler: mocks.track }),
  TRACKING_EVENT_TYPE: {
    SWAP_REVIEW_OPENED: 'review',
    SWAP_INITIATED: 'init',
    SWAP_CONFIRMED: 'confirm',
    SWAP_FAILED: 'failed',
  },
}))
vi.mock('state/user/hooks', () => ({ useUserSlippageTolerance: () => [50], useUserTransactionTTL: () => [1200] }))
vi.mock('components/SwapForm/SwapFormContext', () => ({ useSwapFormContext: () => ({ displayTypedValue: '1' }) }))
vi.mock('components/SwapForm/SingleChain/useSingleChainSwapExecution', () => ({ default: () => mocks.execute }))

const token = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'IN')
const route = {
  parsedAmountIn: CurrencyAmount.fromRawAmount(token, '100'),
  parsedAmountOut: CurrencyAmount.fromRawAmount(token, '200'),
} as DetailedRouteSummary
const builtRoute: BuildRouteResult = {
  data: {
    data: '0x1234',
    routerAddress: '0xrouter',
    amountIn: '100',
    amountOut: '200',
    amountInUsd: '1',
    amountOutUsd: '2',
    feeUsd: '0',
    gas: '21000',
    gasUsd: '0.01',
  },
}

let root: ReturnType<typeof createRoot>
let session: ReturnType<typeof useSwapReviewSession>
let controller: ReturnType<typeof useSingleChainSwapReview>

const Harness = () => {
  session = useSwapReviewSession('wallet:pair:amount')
  controller = useSingleChainSwapReview({
    currencyIn: token,
    currencyOut: undefined,
    routeSummary: route,
    review: session.review,
    buildRoute: mocks.build,
    openReviewSession: session.openReview,
    confirmReviewSession: session.confirmReview,
    dismissReviewSession: session.dismissReview,
  })
  return null
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.resetAllMocks()
  mocks.build.mockResolvedValue(builtRoute)
  root = createRoot(document.createElement('div'))
  await act(async () => root.render(<Harness />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  vi.unstubAllGlobals()
})

it('submits the built payload once and forwards signature and completion to the review session', async () => {
  let finish!: (hash: string) => void
  mocks.execute.mockImplementation((_router, _data, onSignature) => {
    onSignature()
    return new Promise<string>(resolve => {
      finish = resolve
    })
  })

  await act(async () => {
    controller.openReview()
    controller.openReview()
  })
  expect(mocks.build).toHaveBeenCalledOnce()

  await act(async () => {
    controller.confirmSwap()
    controller.confirmSwap()
  })
  expect(mocks.execute).toHaveBeenCalledOnce()
  expect(mocks.execute).toHaveBeenCalledWith('0xrouter', '0x1234', expect.any(Function))
  expect(session.review.phase).toBe('signing')

  await act(async () => finish('0xhash'))
  expect(session.review).toMatchObject({ phase: 'submitted', txHash: '0xhash' })
  expect(mocks.track.mock.calls.filter(([event]) => event === 'confirm')).toHaveLength(1)
})

it('keeps failed builds un-submittable and resets permit before dismissing their error', async () => {
  mocks.build.mockResolvedValue({ error: 'Invalid permit' })
  await act(async () => controller.openReview())
  await act(async () => controller.confirmSwap())
  expect(mocks.execute).not.toHaveBeenCalled()

  mocks.dispatch.mockImplementation(() => expect(session.review.phase).toBe('review'))
  await act(async () => controller.dismissReviewError())
  expect(mocks.dispatch).toHaveBeenCalledOnce()
  expect(mocks.dispatch.mock.calls[0][0].payload).toEqual({ chainId: 1, address: token.address, account: 'sender' })
  expect(session.review.phase).toBe('closed')
})

it('reports execution rejection once without resetting permit on ordinary dismissal', async () => {
  mocks.execute.mockRejectedValue(new Error('User rejected'))
  await act(async () => controller.openReview())
  await act(async () => controller.confirmSwap())

  expect(session.review).toMatchObject({ phase: 'error', error: 'User rejected' })
  expect(mocks.track.mock.calls.filter(([event]) => event === 'failed')).toEqual([
    ['failed', expect.objectContaining({ error_type: 'user_rejected', error_message: 'User rejected' })],
  ])

  await act(async () => controller.dismissReview())
  expect(mocks.dispatch).not.toHaveBeenCalled()
  expect(session.review.phase).toBe('closed')
})
