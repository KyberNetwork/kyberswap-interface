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

  useEffect(() => {
    if (pendingCount < previousCount.current) refetch()
    previousCount.current = pendingCount
  }, [pendingCount, refetch])
}

export default useRefreshOnVaultTx
