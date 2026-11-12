import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useState } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { submitTransaction } from 'pages/Earns/utils'
import { useNotify } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionHistory } from 'state/transactions/type'
import { friendlyError } from 'utils/errorMessage'

/**
 * Sends one of the vault's own withdrawal calls — a redemption or a queue request — and records it.
 *
 * `send` returns the transaction hash so a step sequence can wait for its receipt. A failure is
 * reported here and then rethrown, so the sequence can tell a refusal from any other failure.
 */
export const useVaultTransaction = ({ chainId, errorTitle }: { chainId: number; errorTitle: string }) => {
  const { account } = useActiveWeb3React()
  const { isSmartConnector } = useWeb3React()
  const notify = useNotify()
  const addTransactionWithType = useTransactionAdder()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const send = useCallback(
    async ({
      to,
      data,
      record,
    }: {
      to: string
      data: string
      /** How the transaction is listed once it is out; the hash is filled in here. */
      record: Omit<TransactionHistory, 'hash'>
    }): Promise<string | undefined> => {
      if (!account) return undefined

      setSubmitError(null)
      setIsSubmitting(true)

      try {
        const { txHash: hash, error } = await submitTransaction({
          account,
          chainId: chainId as ChainId,
          txData: { to, data, value: '0' },
          isSmartConnector,
        })

        if (error || !hash) throw error || new Error('Transaction was not submitted')

        addTransactionWithType({ hash, ...record })
        return hash
      } catch (error) {
        const message = friendlyError(error as Error)
        setSubmitError(message)
        notify({ title: errorTitle, summary: message, type: NotificationType.ERROR }, 8000)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [account, chainId, isSmartConnector, addTransactionWithType, notify, errorTitle],
  )

  return { account, send, isSubmitting, submitError }
}
