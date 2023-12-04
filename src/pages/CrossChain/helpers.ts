import { FeeCost, GasCost, RouteActionResponse } from '@0xsquid/sdk/dist/types'

import { CROSS_CHAIN_CONFIG } from 'constants/env'
import { CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'
import { RouteData } from 'state/crossChain/reducer'
import { uint256ToFraction } from 'utils/numbers'

const calcUsd = (usdPrice: number | undefined, amount: string | undefined, decimals: number | undefined) =>
  usdPrice && amount && decimals
    ? usdPrice * parseFloat(uint256ToFraction(amount, decimals).toFixed(decimals))
    : undefined

export type FormatRouteCrossChain = {
  amountUsdOut: number | undefined
  amountUsdIn: number | undefined
  outputAmount: string | undefined
  inputAmount: string | undefined
  duration: number | undefined
  minReceive: string | undefined
  priceImpact: number | undefined
  exchangeRate: string | undefined
  gasCosts: GasCost | undefined
  feeCosts: FeeCost | undefined

  totalFeeUsd: number | undefined
  gasFeeUsd: number | undefined
  crossChainFeeUsd: number | undefined
  gasRefundUsd: number | undefined

  routeData: RouteActionResponse[]
}
export const getRouInfo = ({
  route,
  tokenPriceIn,
  tokenPriceOut,
}: {
  route?: RouteData
  tokenPriceIn?: number
  tokenPriceOut?: number
} = {}): FormatRouteCrossChain => {
  const estimate = route?.estimate
  const priceImpact = estimate?.aggregatePriceImpact

  const gasCosts = estimate?.gasCosts[0]
  const feeCosts = estimate?.feeCosts[0]

  const gasFeeUsd = Number(gasCosts?.amountUsd || '0')
  const crossChainFeeUsd = Number(feeCosts?.amountUsd || '0')
  const totalFeeUsd = gasFeeUsd + crossChainFeeUsd

  const gasRefundUsd = (CROSS_CHAIN_CONFIG.GAS_REFUND * crossChainFeeUsd) / 100
  const inputAmount = estimate?.fromAmount
  const outputAmount = estimate?.toAmount

  const { toToken, fromToken } = estimate || {}
  return {
    amountUsdOut: calcUsd(tokenPriceOut, outputAmount, toToken?.decimals),
    amountUsdIn: calcUsd(tokenPriceIn, inputAmount, fromToken?.decimals),
    outputAmount,
    inputAmount,
    duration: estimate?.estimatedRouteDuration,
    minReceive: estimate?.toAmountMin,
    priceImpact: priceImpact ? Number(priceImpact) : undefined,
    exchangeRate: estimate?.exchangeRate,
    gasCosts,
    feeCosts,

    totalFeeUsd,
    gasFeeUsd,
    crossChainFeeUsd,
    gasRefundUsd,

    routeData: estimate?.actions || [],
  }
}

export const isCrossChainTxsPending = (status: CrossChainTransferStatus) => {
  return ![
    CrossChainTransferStatus.EXECUTED,
    CrossChainTransferStatus.EXPRESS_EXECUTED,
    CrossChainTransferStatus.EXECUTED_ERROR,
  ].includes(status)
}

export const isCrossChainTxsSuccess = (status: CrossChainTransferStatus) => {
  return [CrossChainTransferStatus.EXECUTED, CrossChainTransferStatus.EXPRESS_EXECUTED].includes(status)
}
