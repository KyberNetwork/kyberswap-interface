import { RouteData } from '@0xsquid/sdk'

import { CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'

const formatNumber = (number: string | undefined) => number?.replace(',', '')

export const getRouInfo = (route: RouteData | undefined) => {
  const estimate = route?.estimate
  const priceImpact = estimate?.aggregatePriceImpact

  const gasCosts = estimate?.gasCosts[0]
  const feeCosts = estimate?.feeCosts[0]

  const gasFeeUsd = Number(gasCosts?.amountUSD || '0')
  const crossChainFeeUsd = Number(feeCosts?.amountUSD || '0')
  const totalFeeUsd = gasFeeUsd + crossChainFeeUsd

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
    routeData: estimate?.route,
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
