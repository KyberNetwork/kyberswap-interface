import { ChainId, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'

import { NativeCurrencies } from 'constants/tokens'

import { useSwapReviewData } from './useSwapReviewData'

const mocks = vi.hoisted(() => ({ limit: vi.fn(), stop: vi.fn(), form: vi.fn(), balance: vi.fn() }))
vi.mock('services/limitOrder', () => ({ useGetTotalActiveMakingAmountQuery: mocks.limit }))
vi.mock('services/stopMarket', () => ({ useGetStopMarketActiveMakingAmountQuery: mocks.stop }))
vi.mock('components/HoneypotWarning', () => ({ useHoneypotWarning: () => ({}) }))
vi.mock('components/SwapForm/SwapFormContext', () => ({ useSwapFormContext: mocks.form }))
vi.mock('components/SwapForm/SwapModal/reviewData', () => ({ getSwapReviewData: () => ({}) }))
vi.mock('hooks', () => ({ useActiveWeb3React: () => ({ chainId: 8453, account: '0xwallet' }) }))
vi.mock('state/swap/hooks', () => ({ usePairCategory: () => 'stablePair' }))
vi.mock('state/wallet/hooks', () => ({ useTokenBalance: mocks.balance }))
vi.mock('utils/redirect', () => ({ useNavigateToUrl: vi.fn() }))

const token = new Token(ChainId.BASE, '0x0000000000000000000000000000000000000001', 18, 'A')
const out = new Token(ChainId.BASE, '0x0000000000000000000000000000000000000002', 18, 'B')
const readReview = () => {
  let result!: ReturnType<typeof useSwapReviewData>
  const Probe = () => {
    result = useSwapReviewData(undefined)
    return null
  }
  renderToStaticMarkup(createElement(Probe))
  return result
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.form.mockReturnValue({
    routeSummary: {
      parsedAmountIn: CurrencyAmount.fromRawAmount(token, 1),
      parsedAmountOut: CurrencyAmount.fromRawAmount(out, 1),
    },
  })
  mocks.balance.mockReturnValue({ quotient: 50n })
  mocks.limit.mockReturnValue({ data: '30' })
  mocks.stop.mockReturnValue({ data: '30' })
})

it('warns for the combined reservation and links both order types using the quote pair', () => {
  const review = readReview()
  expect(review.showReservedOrderWarning).toBe(true)
  expect(review.reservedOrderLink).toContain('/limit/base/')
  expect(review.reservedStopMarketLink).toContain('/stop-market/base/')
  expect(review.reservedStopMarketLink).toContain(token.address)
  expect(mocks.stop).toHaveBeenCalledWith(
    { chainId: ChainId.BASE, userWallet: '0xwallet', tokenIn: token.address },
    { skip: false },
  )
})

it('keeps a zero reservation absent and warns when Stop Market alone exceeds the balance', () => {
  mocks.limit.mockReturnValue({ data: '0' })
  mocks.stop.mockReturnValue({ data: '51' })
  const review = readReview()
  expect(review.showReservedOrderWarning).toBe(true)
  expect(review.reservedOrderLink).toBeUndefined()
  expect(review.reservedStopMarketLink).toContain('/stop-market/base/')
  mocks.stop.mockReturnValue({ data: '50' })
  expect(readReview().showReservedOrderWarning).toBe(false)
})

it('skips reservations and their warning when selling native currency', () => {
  const native = NativeCurrencies[ChainId.BASE]
  mocks.form.mockReturnValue({
    routeSummary: {
      parsedAmountIn: CurrencyAmount.fromRawAmount(native, 1),
      parsedAmountOut: CurrencyAmount.fromRawAmount(out, 1),
    },
  })
  expect(readReview().showReservedOrderWarning).toBe(false)
  expect(mocks.stop).toHaveBeenLastCalledWith(expect.anything(), { skip: true })
})
