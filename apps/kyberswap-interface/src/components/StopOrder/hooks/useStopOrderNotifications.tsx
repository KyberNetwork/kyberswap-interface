import { t } from '@lingui/macro'
import { useEffect, useRef } from 'react'

import { NotificationType } from 'components/Announcement/type'
import { StopOrder, StopOrderDisplayStatus } from 'components/StopOrder/types'
import { getStopOrderDisplayStatus } from 'components/StopOrder/utils'
import { useNotify } from 'state/application/hooks'

const NOTIFIED_STATUSES = [
  StopOrderDisplayStatus.TRIGGERED,
  StopOrderDisplayStatus.EXECUTED,
  StopOrderDisplayStatus.EXPIRED,
]

const describe = (status: StopOrderDisplayStatus) => {
  switch (status) {
    case StopOrderDisplayStatus.TRIGGERED:
      return { type: NotificationType.WARNING, title: t`Stop order triggered`, summary: t`Executing the swap...` }
    case StopOrderDisplayStatus.EXECUTED:
      return { type: NotificationType.SUCCESS, title: t`Stop order executed`, summary: t`Your order has been filled.` }
    default:
      return {
        type: NotificationType.WARNING,
        title: t`Stop order expired`,
        summary: t`The order expired without triggering.`,
      }
  }
}

/**
 * Raises a toast when a polled order changes state. It only covers the period the order list is on
 * screen — order lifecycle events reaching the user elsewhere need the backend notification channel
 * the limit-order feature subscribes to, which stop orders do not have yet.
 */
export const useStopOrderNotifications = (orders: StopOrder[]) => {
  const notify = useNotify()
  const previousStatuses = useRef<Map<number, StopOrderDisplayStatus> | undefined>(undefined)

  useEffect(() => {
    const current = new Map(orders.map(order => [order.id, getStopOrderDisplayStatus(order)]))

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
