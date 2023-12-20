import { ethers } from 'ethers'

import { TransactionDetails } from 'state/transactions/type'

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
  const bytes = ethers.utils.arrayify(rawSignature)
  const lastByte = bytes[64]
  if (lastByte === 0 || lastByte === 1) {
    // to support hardware wallet https://ethereum.stackexchange.com/a/113727
    bytes[64] += 27
  }
  return ethers.utils.hexlify(bytes)
}
