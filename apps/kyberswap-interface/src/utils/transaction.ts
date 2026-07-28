import { ChainId } from '@kyberswap/ks-sdk-core'

import {
  GROUP_TRANSACTION_BY_TYPE,
  GroupedTxsByHash,
  TRANSACTION_GROUP,
  TRANSACTION_TYPE,
  TransactionDetails,
} from 'state/transactions/type'
import { toBytes, toHex } from 'utils/viem'

const DEFAULT_GAS_LIMIT_MARGIN = 20000

/**
 * Add a margin amount equal to max of 20000 or the configured percentage of estimatedGas.
 * The default percentage is 20% (50% on Polygon and Optimism).
 */
export function calculateGasMarginBigInt(value: bigint, chainId?: ChainId, minimumMarginBps = 2000): bigint {
  const defaultGasLimitMargin = BigInt(DEFAULT_GAS_LIMIT_MARGIN)
  const needHigherGas = [ChainId.MATIC, ChainId.OPTIMISM].includes(chainId as ChainId)
  const chainMarginBps = needHigherGas ? 5000 : 2000
  const gasMargin = (value * BigInt(Math.max(chainMarginBps, minimumMarginBps))) / 10000n
  return gasMargin >= defaultGasLimitMargin ? value + gasMargin : value + defaultGasLimitMargin
}

export const findTx = (txs: GroupedTxsByHash | undefined, hash: string): TransactionDetails | undefined => {
  return txs
    ? txs?.[hash]?.[0] ||
        Object.values(txs)
          .flat()
          .find(tx => tx?.hash === hash)
    : undefined
}

export const getTransactionGroupByType = (type: TRANSACTION_TYPE) => {
  if (GROUP_TRANSACTION_BY_TYPE.SWAP.includes(type)) return TRANSACTION_GROUP.SWAP
  if (GROUP_TRANSACTION_BY_TYPE.LIQUIDITY.includes(type)) return TRANSACTION_GROUP.LIQUIDITY
  if (GROUP_TRANSACTION_BY_TYPE.KYBERDAO.includes(type)) return TRANSACTION_GROUP.KYBERDAO
  return TRANSACTION_GROUP.OTHER
}

export const getTransactionStatus = (transaction: TransactionDetails) => {
  const pending = !transaction?.receipt
  const success =
    !pending && transaction && (transaction.receipt?.status === 1 || typeof transaction.receipt?.status === 'undefined')
  return {
    pending,
    success,
    error: !pending && transaction?.receipt?.status !== 1,
  }
}

export const formatSignature = (rawSignature: string) => {
  if (rawSignature.length !== 65) return rawSignature
  const bytes = toBytes(rawSignature as `0x${string}`)
  const lastByte = bytes[64]
  if (lastByte === 0 || lastByte === 1) {
    // to support hardware wallet https://ethereum.stackexchange.com/a/113727
    bytes[64] += 27
  }
  return toHex(bytes)
}
