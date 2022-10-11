import { BridgeTransfer } from 'hooks/bridge/useGetBridgeTransfers'

// this is copied from https://anyswap.net/explorer/tx?params=SOME_TX_HASH_HERE
export const getTokenSymbol = (pairId: string): string => {
  return pairId.replace(/v\d+$/, '').replace(/any/g, '').toUpperCase()
}

export const getAmountReceive = (transfer: BridgeTransfer): string => {
  if (transfer.formatswapvalue) {
    return Number(transfer.formatswapvalue).toFixed(2)
  }

  if (!transfer.swapvalue || transfer.swapvalue === '0') {
    return '0.00'
  }

  /**
   * value: "22108548644483390334653",
   * formatvalue: 22108.5,
   *
   * swapvalue: "22086440095838906944319",
   * => formatswapvalue: "2208644",
   */

  let indexOfDot = String(transfer.formatvalue).indexOf('.')
  if (indexOfDot === -1) {
    indexOfDot = String(transfer.formatvalue).length
  }

  const lengthBeforeDot = indexOfDot
  const value = transfer.swapvalue.slice(0, lengthBeforeDot) + '.' + transfer.swapvalue.slice(lengthBeforeDot)
  return Number(value).toFixed(2)
}
