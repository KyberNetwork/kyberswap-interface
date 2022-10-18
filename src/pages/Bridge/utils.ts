import { BridgeTransfer } from 'hooks/bridge/useGetBridgeTransfers'

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
