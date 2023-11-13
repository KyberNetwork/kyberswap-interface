import { CROSS_CHAIN_CONFIG } from 'constants/env'
import { CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'
import { RouteData } from 'state/crossChain/reducer'

const formatNumber = (number: string | undefined) => number?.replace(/,/g, '')

export const getRouInfo = (route: RouteData | undefined) => {
  const estimate = route?.estimate
  const priceImpact = estimate?.aggregatePriceImpact

  const gasCosts = estimate?.gasCosts[0]
  const feeCosts = estimate?.feeCosts[0]

  const gasFeeUsd = Number(gasCosts?.amountUsd || '0')
  const crossChainFeeUsd = Number(feeCosts?.amountUsd || '0')
  const totalFeeUsd = gasFeeUsd + crossChainFeeUsd

  const gasRefundUsd = (CROSS_CHAIN_CONFIG.GAS_REFUND * crossChainFeeUsd) / 100

  return {
    amountUsdOut: formatNumber(estimate?.toAmountUSD),
    amountUsdIn: formatNumber(estimate?.fromAmountUSD),
    outputAmount: estimate?.toAmount,
    inputAmount: estimate?.fromAmount,
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
