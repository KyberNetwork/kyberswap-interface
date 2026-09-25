import { useEffect, useMemo, useRef } from 'react'

import { useAllTransactions } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'

const VAULT_TX_TYPES = [
  TRANSACTION_TYPE.EARN_VAULT_DEPOSIT,
  TRANSACTION_TYPE.EARN_VAULT_WITHDRAW,
  TRANSACTION_TYPE.EARN_VAULT_WITHDRAW_REQUEST,
  TRANSACTION_TYPE.EARN_VAULT_WITHDRAW_CANCEL,
] as string[]

/**
 * A receipt is not the same thing as an indexed position: the API reads the chain on its own clock
 * and can still be a block behind when the wallet already has the receipt in hand. The refresh is
 * spread over a few seconds so an answer that arrives too early is asked again, and the surfaces'
 * own polling remains the backstop for an indexer further behind than this.
 */
const REFRESH_DELAYS_MS = [0, 3_000, 8_000]

/**
 * Vault balances and withdrawal requests only change once a transaction is mined, but the forms
 * hand control back as soon as it is submitted. Refetching when the last vault transaction leaves
 * the pending set is what makes the page show the position the user actually has.
 */
export const useRefreshOnVaultTx = (refetch: () => void) => {
  const allTransactions = useAllTransactions(true)

  const pendingCount = useMemo(
    () =>
      Object.values(allTransactions || {})
        .flat()
        .filter(tx => tx && VAULT_TX_TYPES.includes(tx.type) && !tx.receipt).length,
    [allTransactions],
  )

  const previousCount = useRef(pendingCount)
  // Read at each attempt rather than captured, so a refetch rebound between them still fires.
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearPending = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  useEffect(() => clearPending, [])

  useEffect(() => {
    if (pendingCount < previousCount.current) {
      // A second transaction landing mid-run restarts the attempts rather than adding to them.
      clearPending()
      timeoutsRef.current = REFRESH_DELAYS_MS.map(delay => setTimeout(() => refetchRef.current(), delay))
    }
    previousCount.current = pendingCount
  }, [pendingCount])
}

export default useRefreshOnVaultTx
