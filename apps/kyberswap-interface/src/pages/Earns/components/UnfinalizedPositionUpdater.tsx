import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppDispatch } from 'state'
import { modifyTransaction } from 'state/transactions/actions'
import { useAllTransactions } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionDetails, UnfinalizedPositionSnapshot } from 'state/transactions/type'

/** The zap extra-infos that can carry a snapshot; only that one field is read here. */
type ZapExtraInfo = { unfinalizedPosition?: UnfinalizedPositionSnapshot }

const ZAP_IN_TRANSACTION_TYPES = [
  TRANSACTION_TYPE.EARN_ADD_LIQUIDITY,
  TRANSACTION_TYPE.EARN_INCREASE_LIQUIDITY,
  TRANSACTION_TYPE.EARN_MIGRATE_LIQUIDITY,
  TRANSACTION_TYPE.EARN_REPOSITION,
]

/**
 * Caches the placeholder position for a zap once its transaction is mined. It works off the persisted
 * transaction store rather than off the zap widget, so the placeholder is written whether or not the widget
 * is still on screen — dismissing it mid-flight, navigating away, or reloading all keep working.
 *
 * The snapshot is cleared from the transaction afterwards, which doubles as the "already handled" marker
 * across reloads.
 */
export default function UnfinalizedPositionUpdater(): null {
  const { account } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  const allTransactions = useAllTransactions(true)
  const handledTxHashes = useRef(new Set<string>())

  useEffect(() => {
    if (!account || !allTransactions) return

    const minedZaps = (Object.values(allTransactions).flat() as Array<TransactionDetails | undefined>).filter(
      (tx): tx is TransactionDetails =>
        !!tx &&
        !!tx.receipt &&
        ZAP_IN_TRANSACTION_TYPES.includes(tx.type) &&
        !!(tx.extraInfo as ZapExtraInfo | undefined)?.unfinalizedPosition &&
        !handledTxHashes.current.has(tx.hash),
    )

    minedZaps.forEach(async tx => {
      handledTxHashes.current.add(tx.hash)

      const snapshot = (tx.extraInfo as ZapExtraInfo | undefined)?.unfinalizedPosition
      const clearSnapshot = () =>
        dispatch(
          modifyTransaction({
            chainId: tx.chainId,
            hash: tx.hash,
            // Only the snapshot is dropped; the rest of the transaction's extra info is carried through, so
            // the merged object keeps whichever Earn shape this transaction actually has.
            extraInfo: { ...tx.extraInfo, unfinalizedPosition: undefined } as TransactionDetails['extraInfo'],
          }),
        )

      try {
        const { UNFINALIZED_POSITION_TTL_MS } = await import('pages/Earns/utils/unfinalizedPosition')

        // A reverted zap creates no position, and a snapshot older than the cache lifetime would be pruned
        // on the next read anyway.
        const isWritable =
          !!snapshot && tx.receipt?.status === 1 && Date.now() - snapshot.createdAt <= UNFINALIZED_POSITION_TTL_MS
        if (isWritable) {
          const { writeUnfinalizedPositionFromSnapshot } = await import('pages/Earns/utils/unfinalizedPositionWriter')
          await writeUnfinalizedPositionFromSnapshot({ txHash: tx.hash, snapshot, owner: account })
        }
      } catch (error) {
        console.error('Failed to cache unfinalized position:', error)
      }
      clearSnapshot()
    })
  }, [account, allTransactions, dispatch])

  return null
}
