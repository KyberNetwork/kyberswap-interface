import { AcrossDepositStatusResponse } from 'pages/CrossChainSwap/adapters/AcrossAdapter/types'
import { SwapStatus } from 'pages/CrossChainSwap/adapters/BaseSwapAdapter'

const ACROSS_STATUS_ERROR_GRACE_PERIOD = 2 * 60 * 60 * 1_000

interface AcrossDepositStatusOptions {
  txTimestamp?: number
  now?: number
}

export const getAcrossFillTxHash = (statusResponse: AcrossDepositStatusResponse): string => {
  return statusResponse.fillTxnRef || statusResponse.fillTx || ''
}

export const mapAcrossDepositStatus = (
  statusResponse: AcrossDepositStatusResponse,
  options: AcrossDepositStatusOptions = {},
): SwapStatus['status'] => {
  if (statusResponse.error) {
    const { txTimestamp, now = Date.now() } = options
    const isWithinIndexingGracePeriod = txTimestamp ? now - txTimestamp < ACROSS_STATUS_ERROR_GRACE_PERIOD : false

    if (isWithinIndexingGracePeriod) {
      return 'Processing'
    }

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
