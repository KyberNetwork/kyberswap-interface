import { Token } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'viem'

import { ETHER_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import type { HistoryTransaction } from 'pages/Swap/transactions/history'
import { TRANSACTION_TYPE, type TransactionDetails } from 'state/transactions/type'

// Older persisted swaps only have decimal/display amounts. Never interpret a
// formatted '<0.00001' amount as an exact value; those rows can still arrive via KD.
const legacyUnits = (value: unknown, decimals: number) => {
  const decimal = typeof value === 'string' ? value.replace(/,/g, '') : ''
  if (!/^\d+(\.\d+)?$/.test(decimal)) throw new Error('Unavailable legacy swap amount')
  return parseUnits(decimal, decimals).toString()
}

export const sameChainTransactionToHistory = (tx: TransactionDetails): HistoryTransaction | undefined => {
  const info = tx.extraInfo
  if (tx.type !== TRANSACTION_TYPE.SWAP || !info || !('tokenAmountIn' in info)) return undefined
  const snapshot = info.swap
  const inputDecimals = snapshot?.inputDecimals ?? info.arbitrary?.inputDecimals
  const outputDecimals = snapshot?.outputDecimals ?? info.arbitrary?.outputDecimals
  if (!Number.isInteger(inputDecimals) || !Number.isInteger(outputDecimals)) return undefined
  try {
    const token = (address: string, decimals: number, symbol: string) =>
      address.toLowerCase() === ETHER_ADDRESS.toLowerCase()
        ? NativeCurrencies[tx.chainId]
        : new Token(tx.chainId, address, decimals, symbol)
    const sourceToken = token(info.tokenAddressIn, inputDecimals, info.tokenSymbolIn)
    const targetToken = token(info.tokenAddressOut, outputDecimals, info.tokenSymbolOut)
    if (!sourceToken || !targetToken) return undefined
    return {
      id: tx.hash,
      sourceTxHash: tx.hash,
      targetTxHash: tx.receipt ? tx.hash : undefined,
      sender: tx.from,
      // `to` is the router. Legacy rows only store a shortened recipient label.
      recipient: snapshot?.recipient || '',
      adapter: 'kyberswap',
      sourceChain: tx.chainId,
      targetChain: tx.chainId,
      sourceToken,
      targetToken,
      inputAmount:
        snapshot?.inputAmount ?? legacyUnits(info.arbitrary?.inputAmount ?? info.tokenAmountIn, inputDecimals),
      outputAmount: snapshot?.outputAmount ?? legacyUnits(info.tokenAmountOut, outputDecimals),
      timestamp: tx.addedTime,
      status: !tx.receipt ? 'Processing' : tx.receipt.status === 0 ? 'Failed' : 'Success',
      amountInUsd: Number(info.arbitrary?.amountInUsd) || 0,
      amountOutUsd: Number(info.arbitrary?.amountOutUsd) || 0,
      platformFeePercent: 0,
    }
  } catch {
    return undefined
  }
}
