import type { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'
import {
  type SocketQuoteResult,
  SocketStatusCode,
  type SocketStatusResult,
  type SocketTxRoute,
} from 'pages/CrossChainSwap/adapters/BungeeAdapter/types'

export const getSocketTxRoute = (rawQuote?: SocketQuoteResult | null): SocketTxRoute | undefined => {
  const routes = [rawQuote?.route, ...(rawQuote?.routes || [])].filter((route): route is SocketTxRoute => !!route)

  return (
    routes.find(item => item.userOp === 'tx' && item.routeTags?.includes('SUGGESTED') && item.txData?.object) ||
    routes.find(item => (!item.userOp || item.userOp === 'tx') && item.txData?.object)
  )
}

export const normalizeSocketStatus = (statusResult: SocketStatusResult): SwapStatus => {
  const statusCode = String(statusResult.statusCode || statusResult.status || '').toUpperCase() as SocketStatusCode
  const actualAmountOut = statusResult.destination?.output?.[0]?.amount

  return {
    txHash: statusResult.destination?.txHash || statusResult.origin?.txHash || '',
    status:
      statusCode === SocketStatusCode.REFUNDED
        ? 'Refunded'
        : [SocketStatusCode.EXPIRED, SocketStatusCode.CANCELLED, SocketStatusCode.FAILED].includes(statusCode)
        ? 'Failed'
        : [
            SocketStatusCode.COMPLETED,
            SocketStatusCode.SUCCESS,
            SocketStatusCode.FULFILLED,
            SocketStatusCode.SETTLED,
          ].includes(statusCode)
        ? 'Success'
        : 'Processing',
    amountOut: actualAmountOut ? String(actualAmountOut) : undefined,
  }
}
