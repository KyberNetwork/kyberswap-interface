import { t } from '@lingui/macro'
import { useEffect, useRef } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { StopLossDisplayStatus, StopLossOrder } from 'components/StopLoss/types'
import { getStopLossDisplayStatus } from 'components/StopLoss/utils'
import { useNotify } from 'state/application/hooks'

const NOTIFIED_STATUSES = [
  StopLossDisplayStatus.TRIGGERED,
  StopLossDisplayStatus.EXECUTED,
  StopLossDisplayStatus.FAILED,
  StopLossDisplayStatus.EXPIRED,
]

const describe = (status: StopLossDisplayStatus) => {
  switch (status) {
    case StopLossDisplayStatus.TRIGGERED:
      return { type: NotificationType.WARNING, title: t`Stop-loss triggered`, summary: t`Executing the swap...` }
    case StopLossDisplayStatus.EXECUTED:
      return { type: NotificationType.SUCCESS, title: t`Stop-loss executed`, summary: t`Your order has been filled.` }
    case StopLossDisplayStatus.FAILED:
      return {
        type: NotificationType.ERROR,
        title: t`Stop-loss failed`,
        summary: t`The swap could not complete. Your tokens are still in your wallet.`,
      }
    default:
      return {
        type: NotificationType.WARNING,
        title: t`Stop-loss expired`,
        summary: t`The order expired without triggering.`,
      }
  }
}

/**
 * Raises a toast when a polled order changes state. It only covers the period the order list is on
 * screen — order lifecycle events reaching the user elsewhere need the backend notification channel
 * the limit-order feature subscribes to, which stop-loss does not have yet.
 */
export const useStopLossOrderNotifications = (orders: StopLossOrder[]) => {
  const notify = useNotify()
  const previousStatuses = useRef<Map<number, StopLossDisplayStatus> | undefined>(undefined)

  useEffect(() => {
    const current = new Map(orders.map(order => [order.id, getStopLossDisplayStatus(order)]))

    // The first poll establishes the baseline; without it every open order would announce itself.
    if (!previousStatuses.current) {
      previousStatuses.current = current
      return
    }

    current.forEach((status, id) => {
      const previous = previousStatuses.current?.get(id)
      if (previous === undefined || previous === status || !NOTIFIED_STATUSES.includes(status)) return
      notify(describe(status), 10000)
    })

    previousStatuses.current = current
  }, [orders, notify])
}
