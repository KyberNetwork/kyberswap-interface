import { findCacheToken } from 'hooks/Tokens'
import { TRANSACTION_GROUP, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export const STALLED_MINS = 5

export const isTxsPendingTooLong = (txs: TransactionDetails) => {
  const { pending: pendingTxsStatus } = getTransactionStatus(txs)
  return pendingTxsStatus && Date.now() - txs.addedTime > STALLED_MINS * 60_000 && txs.group === TRANSACTION_GROUP.SWAP
}

export const getTokenLogo = (address: string | undefined) => findCacheToken(address ?? '')?.logoURI ?? ''
