import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { calculatePriceImpact } from 'services/route/utils'

import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { PAIR_CATEGORY } from 'constants/trade'
import { ERC8056TokenInfo, getERC8056DisplayAmount, getERC8056DisplayPrice } from 'hooks/useERC8056Token'
import { DetailedRouteSummary } from 'types/route'
import { minimumAmountAfterSlippage, toCurrencyAmount } from 'utils/currencyAmount'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

const SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD = -1
export const AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD = -5
export const SHOW_CONFIRM_MODAL_AFTER_CLICK_SWAP_THRESHOLD = -10

const suggestedSlippageCaps = {
  [PAIR_CATEGORY.STABLE]: 20,
  [PAIR_CATEGORY.CORRELATED]: 50,
  [PAIR_CATEGORY.EXOTIC]: 200,
  [PAIR_CATEGORY.HIGH_VOLATILITY]: 500,
}

export const isSlippageBuildError = (error: string | undefined) =>
  !!error && (error.includes('enough') || error.includes('min') || error.includes('smaller'))

export const getSuggestedSlippage = (buildResult: BuildRouteResult | undefined, category: PAIR_CATEGORY) => {
  const suggestion = buildResult && 'suggestedSlippage' in buildResult ? buildResult.suggestedSlippage : undefined
  return suggestion && Math.min(suggestion, suggestedSlippageCaps[category])
}

type ReviewDataParams = {
  buildResult: BuildRouteResult | undefined
  routeSummary: DetailedRouteSummary | undefined
  slippage: number
  isAdvancedMode: boolean
  inputERC8056Info: ERC8056TokenInfo
  outputERC8056Info: ERC8056TokenInfo
  category: PAIR_CATEGORY
}

export const getSwapReviewData = ({
  buildResult,
  routeSummary,
  slippage,
  isAdvancedMode,
  inputERC8056Info,
  outputERC8056Info,
  category,
}: ReviewDataParams) => {
  const priceImpactFromBuild = buildResult?.data
    ? calculatePriceImpact(Number(buildResult?.data?.amountInUsd || 0), Number(buildResult?.data?.amountOutUsd || 0))
    : undefined

  const priceImpactResult = checkPriceImpact(priceImpactFromBuild)

  const outputChangePercent = Number(buildResult?.data?.outputChange?.percent) || 0
  const formattedOutputChangePercent =
    -0.001 < outputChangePercent && outputChangePercent < 0
      ? '> -0.001'
      : 0 < outputChangePercent && outputChangePercent < 0.001
      ? '< 0.001'
      : outputChangePercent.toFixed(3)

  const getDetails = () => {
    if (!buildResult?.data || !routeSummary) {
      return {
        gasUsd: undefined,
        minimumAmountOut: undefined,
        executionPrice: undefined,
        priceImpact: undefined,

        buildData: undefined,
      }
    }

    const { amountIn, amountOut, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = getERC8056DisplayPrice(
      new Price(parsedAmountIn.currency, parsedAmountOut.currency, parsedAmountIn.quotient, parsedAmountOut.quotient),
      inputERC8056Info,
      outputERC8056Info,
    )
    // Min amount out is calculated from get route api amount out.
    const minimumAmountOut = getERC8056DisplayAmount(
      outputERC8056Info,
      minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage),
    )

    return {
      gasUsd,
      executionPrice,
      minimumAmountOut,
      priceImpact: priceImpactFromBuild,

      buildData: buildResult.data,
    }
  }

  let parsedAmountIn: CurrencyAmount<Currency> | undefined
  let parsedAmountOut: CurrencyAmount<Currency> | undefined
  let parsedAmountOutFromBuild: CurrencyAmount<Currency> | undefined
  let amountInUsd: string | undefined
  let amountOutUsdFromBuild: string | undefined
  if (routeSummary) {
    parsedAmountIn = routeSummary.parsedAmountIn
    // Output amounts below are display-only, so an ERC-8056 output token shows them in display units.
    parsedAmountOut = getERC8056DisplayAmount(outputERC8056Info, routeSummary.parsedAmountOut)
    amountInUsd = routeSummary.amountInUsd

    if (buildResult?.data) {
      const { amountOut } = buildResult.data
      parsedAmountOutFromBuild = getERC8056DisplayAmount(
        outputERC8056Info,
        toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut),
      )

      amountOutUsdFromBuild = buildResult.data.amountOutUsd
      amountInUsd = buildResult.data.amountInUsd
    }
  }

  let level: 'better' | 'worse' | 'worst' | undefined
  if (0 < outputChangePercent) {
    level = 'better'
  } else if (AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD < outputChangePercent && outputChangePercent < 0) {
    level = 'worse'
  } else if (outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD) {
    level = 'worst'
  }

  const showWarningStyle = priceImpactResult.isVeryHigh || priceImpactResult.isInvalid

  const shouldDisableByPriceImpact = checkShouldDisableByPriceImpact(isAdvancedMode, priceImpactFromBuild)

  const isShowAcceptNewAmount =
    outputChangePercent < SHOW_ACCEPT_NEW_AMOUNT_THRESHOLD ||
    (category === PAIR_CATEGORY.STABLE && outputChangePercent < 0)
  return {
    details: getDetails(),
    parsedAmountIn,
    parsedAmountOut,
    parsedAmountOutFromBuild,
    amountInUsd,
    amountOutUsdFromBuild,
    level,
    outputChangePercent,
    formattedOutputChangePercent,
    priceImpactFromBuild,
    priceImpactResult,
    showWarningStyle,
    shouldDisableByPriceImpact,
    isShowAcceptNewAmount,
    dynamicSuggestedSlippage: getSuggestedSlippage(buildResult, category),
  }
}

export type SwapReviewAmountsData = ReturnType<typeof getSwapReviewData>
