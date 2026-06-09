import { AcrossDepositStatusResponse } from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'
import { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'

export const getAcrossFillTxHash = (statusResponse: AcrossDepositStatusResponse): string => {
  return statusResponse.fillTxnRef || statusResponse.fillTx || ''
}

export const mapAcrossDepositStatus = (statusResponse: AcrossDepositStatusResponse): SwapStatus['status'] => {
  if (statusResponse.error) {
    return 'Failed'
  }

  switch (statusResponse.status) {
    case 'filled':
      return 'Success'
    case 'refunded':
      return 'Refunded'
    case 'expired':
      return 'Failed'
    case 'pending':
    case 'slowFillRequested':
    default:
      return 'Processing'
  }
}
