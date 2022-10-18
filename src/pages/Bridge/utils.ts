import { t } from '@lingui/macro'

import { BridgeTransfer, BridgeTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

import { GeneralStatus } from './type'

// this is copied from https://anyswap.net/explorer/tx?params=SOME_TX_HASH_HERE
export const getTokenSymbol = (transfer: BridgeTransfer): string => {
  const tokenStr = transfer.pairid || transfer.swapinfo?.routerSwapInfo?.tokenID
  return tokenStr.replace(/v\d+$/, '').replace(/any/g, '').toUpperCase()
}

export const getAmountReceive = (formatValue: string, formatSwapValue: string, swapValue: string): string => {
  if (!formatValue && !formatSwapValue) {
    return ''
  }

  if (formatSwapValue && formatSwapValue !== '0') {
    return Number(formatSwapValue).toFixed(2)
  }

  if (!swapValue || swapValue === '0') {
    return '0.00'
  }

  /**
   * value: "22108548644483390334653",
   * formatvalue: 22108.5,
   *
   * swapvalue: "22086440095838906944319",
   * => formatswapvalue: "2208644",
   */

  let indexOfDot = String(formatValue).indexOf('.')
  if (indexOfDot === -1) {
    indexOfDot = String(formatValue).length
  }

  const lengthBeforeDot = indexOfDot
  const value = swapValue.slice(0, lengthBeforeDot) + '.' + swapValue.slice(lengthBeforeDot)
  return Number(value).toFixed(2)
}

export const getGeneralStatus = (status: BridgeTransferStatus): GeneralStatus => {
  const mapping: Record<BridgeTransferStatus, GeneralStatus> = {
    [BridgeTransferStatus.Success]: 'success',
    [BridgeTransferStatus.Failure]: 'failed',
    [BridgeTransferStatus.TxNotStable]: 'failed',
    [BridgeTransferStatus.TxNotSwapped]: 'failed',
    [BridgeTransferStatus.ExceedLimit]: 'failed',
    [BridgeTransferStatus.Unknown]: 'failed',
    [BridgeTransferStatus.Confirming]: 'processing',
    [BridgeTransferStatus.Swapping]: 'processing',
    [BridgeTransferStatus.BigAmount]: 'processing',
  }

  return mapping[status]
}

export const getLabelByStatus = (status: BridgeTransferStatus): string => {
  const labelByGeneralStatus: Record<GeneralStatus, string> = {
    success: t`Success`,
    failed: t`Failed`,
    processing: t`Processing`,
  }

  const generalStatus = getGeneralStatus(status)
  return labelByGeneralStatus[generalStatus] || t`Unknown`
}
