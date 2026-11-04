import { useCallback, useEffect, useRef } from 'react'
import limitOrderApi from 'services/limitOrder'
import notificationApi, { useGetNotificationsQuery } from 'services/notification'
import stopMarketApi from 'services/stopMarket'

import { getStopMarketExecution } from 'components/Announcement/helpers'
import {
  OrderNotificationKind,
  buildOrderNotificationToasts,
  groupOrderNotifications,
} from 'components/Announcement/orderNotificationToasts'
import { PopupType, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { useLimitOrderTracking } from 'components/LimitOrder/hooks/useLimitOrderTracking'
import { useStopMarketTracking } from 'components/StopMarket/hooks/useStopMarketTracking'
import { NOTI_ENV, getAnnouncementsTemplateIds, isStopMarketExecutedTemplate } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAddPopup, usePrivateAnnouncementsVersion, useRefreshPrivateAnnouncements } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'

const POLL_INTERVAL = 10_000
const POLL_PAGE_SIZE = 10
const BACKLOG_PAGE_SIZE = 50
/** The most notifications read back when a wallet is first seen in a session. */
const MAX_BACKLOG = 500
/** Kept above MAX_BACKLOG so no id a backlog read returns is forgotten and announced twice. */
const MAX_ANNOUNCED_IDS = 1000
const TOAST_DURATION_MS = 10_000

const announcedIdsKey = (account: string) => `orderAnnouncedNotifications:${NOTI_ENV}:${account.toLowerCase()}`

export const loadAnnouncedIds = (account: string): Set<number> => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(announcedIdsKey(account)) || '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [])
  } catch (error) {
    console.error('Error reading announced order notifications:', error)
    return new Set()
  }
}

export const saveAnnouncedIds = (account: string, ids: Set<number>) => {
  try {
    // Notification ids grow over time, so the largest are the ones a later read can still return.
    const kept = [...ids].sort((a, b) => b - a).slice(0, MAX_ANNOUNCED_IDS)
    localStorage.setItem(announcedIdsKey(account), JSON.stringify(kept))
  } catch (error) {
    console.error('Error saving announced order notifications:', error)
  }
}

/**
 * Whether this device has announced for the wallet before. Unreadable storage counts as never, which keeps the
 * wallet's history silent instead of announcing it on every load.
 */
export const hasAnnouncedIds = (account: string) => {
  try {
    return localStorage.getItem(announcedIdsKey(account)) !== null
  } catch (error) {
    console.error('Error reading announced order notifications:', error)
    return false
  }
}

/** Takes every notification as announced without telling the user, read ones included. */
export const recordAsAnnounced = (account: string, notifications: PrivateAnnouncement[]) => {
  const announcedIds = loadAnnouncedIds(account)
  notifications.forEach(item => announcedIds.add(item.id))
  saveAnnouncedIds(account, announcedIds)
}

/** The unread notifications not announced yet, each once, oldest first. */
export const selectUnannounced = (notifications: PrivateAnnouncement[], announcedIds: Set<number>) => {
  const picked = new Map<number, PrivateAnnouncement>()
  notifications.forEach(item => {
    if (!item.isRead && !announcedIds.has(item.id)) picked.set(item.id, item)
  })
  return [...picked.values()].sort((a, b) => a.sentAt - b.sentAt)
}

/**
 * Tells the user, wherever they are in the app, about every limit order and stop market order outcome they have
 * not been told about, including those that happened while they were away. The order services have no push
 * channel, so the notification service is asked for the order templates every 10 seconds, as often as the order
 * lists refresh. Each unread notification is announced once per wallet on this device: the ids already announced
 * are kept in localStorage, so neither a reload nor another tab announces them again. Announcing an outcome also
 * refreshes the order lists and reserved amounts it affects and reports filled and cancelled limit orders to
 * analytics.
 */
export const useOrderNotifications = () => {
  const { account } = useActiveWeb3React()
  const addPopup = useAddPopup()
  const refreshPrivateAnnouncements = useRefreshPrivateAnnouncements()
  const dispatch = useAppDispatch()
  const limitOrderTracking = useLimitOrderTracking()
  const stopMarketTracking = useStopMarketTracking()
  // Covers the stop market executed template too.
  const templateIds = getAnnouncementsTemplateIds(PrivateAnnouncementType.LIMIT_ORDER)

  const { currentData, refetch } = useGetNotificationsQuery(
    { account: account ?? '', templateIds, page: 1, pageSize: POLL_PAGE_SIZE },
    {
      skip: !account || !templateIds,
      pollingInterval: POLL_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  // Asked again whenever the inbox is told to refresh, e.g. once an order leaves the Active list, so its
  // outcome is announced without waiting for the next poll.
  const privateAnnouncementsVersion = usePrivateAnnouncementsVersion()
  const isQuerying = !!account && !!templateIds
  useEffect(() => {
    if (privateAnnouncementsVersion && isQuerying) refetch()
  }, [privateAnnouncementsVersion, isQuerying, refetch])

  const announce = useCallback(
    (wallet: string, notifications: PrivateAnnouncement[]) => {
      const announcedIds = loadAnnouncedIds(wallet)
      const fresh = selectUnannounced(notifications, announcedIds)
      if (!fresh.length) return
      // Recorded before the toasts so a read landing meanwhile, here or in another tab, finds them taken.
      fresh.forEach(item => announcedIds.add(item.id))
      saveAnnouncedIds(wallet, announcedIds)

      // The order tables, reserved balances and the inbox would otherwise wait for their own next refresh.
      const stopMarketCount = fresh.filter(item => isStopMarketExecutedTemplate(item.templateId)).length
      if (stopMarketCount) dispatch(stopMarketApi.util.invalidateTags([RTK_QUERY_TAGS.GET_STOP_MARKET_LIST]))
      if (stopMarketCount < fresh.length) {
        dispatch(
          limitOrderApi.util.invalidateTags([
            RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
            RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
          ]),
        )
      }
      refreshPrivateAnnouncements()

      fresh.forEach(item => {
        if (isStopMarketExecutedTemplate(item.templateId)) {
          stopMarketTracking.trackOrderExecuted(getStopMarketExecution(item), item.id)
        }
      })
      const groups = groupOrderNotifications(fresh)
      groups.forEach(group => {
        if (group.kind === OrderNotificationKind.FILLED) {
          group.orders.forEach(order => limitOrderTracking.trackMyOrderFilled(order))
        }
        if (group.kind === OrderNotificationKind.CANCELLED) {
          group.orders.forEach(order => limitOrderTracking.trackMyOrderCancelled(order))
        }
      })
      // Toasts past the visible stack wait their turn; their timers start only once shown.
      buildOrderNotificationToasts(groups).forEach(({ key, content }) => {
        addPopup({ content, popupType: PopupType.SIMPLE, key, removeAfterMs: TOAST_DURATION_MS })
      })
    },
    [addPopup, dispatch, limitOrderTracking, refreshPrivateAnnouncements, stopMarketTracking],
  )

  /** Every notification up to MAX_BACKLOG; pages that fail to load are left out. */
  const readBacklog = useCallback(
    async (wallet: string, total: number) => {
      const pageCount = Math.ceil(Math.min(total, MAX_BACKLOG) / BACKLOG_PAGE_SIZE)
      const pages = await Promise.allSettled(
        Array.from({ length: pageCount }, (_, i) =>
          dispatch(
            notificationApi.endpoints.getNotifications.initiate(
              { account: wallet, templateIds, page: i + 1, pageSize: BACKLOG_PAGE_SIZE },
              { subscribe: false, forceRefetch: true },
            ),
          ).unwrap(),
        ),
      )
      return pages.flatMap(page => (page.status === 'fulfilled' ? page.value.notifications : []))
    },
    [dispatch, templateIds],
  )

  // A wallet holding more notifications than one poll returns has the rest read once per session, and again
  // whenever a poll's page holds nothing seen before, as a cancel-all or a run of expiries can outgrow one page.
  // Polls are announced only after such a read, so toasts arrive oldest first. The first read for a wallet this
  // device has never announced for is recorded silently: its history predates any visit that could have shown it.
  const backlogRef = useRef<{ account?: string; isDone: boolean }>({ isDone: false })
  useEffect(() => {
    if (!account || !currentData) return
    const notifications = currentData.notifications
    const total = currentData.pagination?.totalItems ?? 0
    const backlog = backlogRef.current
    if (backlog.account === account && !backlog.isDone) return

    const isFirstRead = backlog.account !== account
    const settle = isFirstRead && !hasAnnouncedIds(account) ? recordAsAnnounced : announce
    const announcedIds = loadAnnouncedIds(account)
    const mayHideMore = isFirstRead || notifications.every(item => !item.isRead && !announcedIds.has(item.id))
    if (total <= notifications.length || !mayHideMore) {
      backlogRef.current = { account, isDone: true }
      settle(account, notifications)
      return
    }

    backlogRef.current = { account, isDone: false }
    readBacklog(account, total).then(older => {
      if (backlogRef.current.account !== account) return
      backlogRef.current = { account, isDone: true }
      settle(account, [...notifications, ...older])
    })
  }, [account, currentData, announce, readBacklog])
}
