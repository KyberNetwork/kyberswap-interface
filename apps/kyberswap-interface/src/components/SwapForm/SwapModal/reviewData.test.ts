// @vitest-environment happy-dom
import { CurrencyAmount, Price, Token } from '@kyberswap/ks-sdk-core'
import { expect, it } from 'vitest'

import { getSuggestedSlippage, getSwapReviewData } from 'components/SwapForm/SwapModal/reviewData'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { PAIR_CATEGORY } from 'constants/trade'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'

const input = new Token(1, '0x0000000000000000000000000000000000000001', 0, 'IN')
const output = new Token(1, '0x0000000000000000000000000000000000000002', 0, 'OUT')
const tokenInfo = { enabled: false, isLoading: false, isScaled: false, multiplier: undefined }
const routeSummary: DetailedRouteSummary = {
  tokenIn: input.address,
  tokenOut: output.address,
  amountIn: '100',
  amountOut: '100',
  parsedAmountIn: CurrencyAmount.fromRawAmount(input, '100'),
  parsedAmountOut: CurrencyAmount.fromRawAmount(output, '100'),
  amountInUsd: '100',
  amountOutUsd: '100',
  priceImpact: 0,
  executionPrice: new Price(input, output, '100', '100'),
  gas: '1',
  gasUsd: '1',
  gasPrice: '1',
  extraFee: { feeAmount: '0', feeAmountUsd: '0', chargeFeeBy: ChargeFeeBy.NONE, isInBps: true, feeReceiver: '' },
  route: [],
  isSmartSettlement: false,
  routerAddress: '0xrouter',
}
const build = (percent: number, amountOutUsd = '100'): BuildRouteResult => ({
  data: {
    data: '0x',
    amountIn: '100',
    amountOut: '80',
    amountInUsd: '100',
    amountOutUsd,
    feeUsd: '0',
    gas: '1',
    gasUsd: '1',
    routerAddress: '0xrouter',
    outputChange: { percent },
  },
})
const defaults = {
  routeSummary,
  slippage: 100,
  isAdvancedMode: false,
  inputERC8056Info: tokenInfo,
  outputERC8056Info: tokenInfo,
  category: PAIR_CATEGORY.EXOTIC,
}

it.each([
  [PAIR_CATEGORY.STABLE, -0.001, true],
  [PAIR_CATEGORY.STABLE, 0, false],
  [PAIR_CATEGORY.EXOTIC, -1, false],
  [PAIR_CATEGORY.EXOTIC, -1.001, true],
])('preserves acceptance boundary for %s at %s percent', (category, percent, expected) => {
  const review = getSwapReviewData({ ...defaults, category, buildResult: build(percent) })
  expect(review.isShowAcceptNewAmount).toBe(expected)
})

it('uses the quote for minimum receiving and the build for output and USD risk', () => {
  const review = getSwapReviewData({
    ...defaults,
    buildResult: build(-20, '80'),
    outputERC8056Info: { ...tokenInfo, enabled: true, isScaled: true, multiplier: 2n * 10n ** 18n },
  })
  expect(review.details.minimumAmountOut?.toExact()).toBe('198')
  expect(review.parsedAmountOutFromBuild?.toExact()).toBe('160')
  expect(review.priceImpactFromBuild).toBe(20)
  expect(review.shouldDisableByPriceImpact).toBe(true)
  expect(
    getSwapReviewData({ ...defaults, buildResult: build(-20, '80'), isAdvancedMode: true }).shouldDisableByPriceImpact,
  ).toBe(false)
})

it('caps suggested retry slippage by pair category without raising smaller suggestions', () => {
  const error = { error: 'minimum output', suggestedSlippage: 1000 }
  expect(getSuggestedSlippage(error, PAIR_CATEGORY.STABLE)).toBe(20)
  expect(getSuggestedSlippage(error, PAIR_CATEGORY.CORRELATED)).toBe(50)
  expect(getSuggestedSlippage(error, PAIR_CATEGORY.EXOTIC)).toBe(200)
  expect(getSuggestedSlippage(error, PAIR_CATEGORY.HIGH_VOLATILITY)).toBe(500)
  expect(getSuggestedSlippage({ ...error, suggestedSlippage: 10 }, PAIR_CATEGORY.STABLE)).toBe(10)
})
