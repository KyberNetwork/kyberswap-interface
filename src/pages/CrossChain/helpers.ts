import { RouteData } from '@0xsquid/sdk'

import { CrossChainTransferStatus } from 'pages/CrossChain/useTransferHistory'

export const getRouInfo = (route: RouteData | undefined) => {
  const estimate = route?.estimate
  const priceImpact = estimate?.aggregatePriceImpact
  return {
    amountUsdOut: estimate?.toAmountUSD,
    amountUsdIn: estimate?.fromAmountUSD,
    outputAmount: estimate?.toAmount,
    inputAmount: estimate?.fromAmount,
    duration: estimate?.estimatedRouteDuration,
    minReceive: estimate?.toAmountMin,
    priceImpact: priceImpact ? Number(priceImpact) : undefined,
    exchangeRate: estimate?.exchangeRate,
    gasCosts: estimate?.gasCosts[0],
    feeCosts: estimate?.feeCosts[0],
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
