import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef } from 'react'
import notificationApi, { useGetNotificationsQuery } from 'services/notification'
import stopMarketApi from 'services/stopMarket'

import { StopMarketExecution, getStopMarketExecution } from 'components/Announcement/helpers'
import { NotificationType, PopupType, PrivateAnnouncement } from 'components/Announcement/type'
import { NOTI_ENV, getStopMarketExecutedTemplateIds } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAddPopup, usePrivateAnnouncementsVersion, useRefreshPrivateAnnouncements } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const POLL_INTERVAL = 10_000
const POLL_PAGE_SIZE = 10
const BACKLOG_PAGE_SIZE = 50
/** The most executions read back when a wallet is first seen in a session. */
const MAX_BACKLOG = 500
/** Kept above MAX_BACKLOG so no id a backlog read returns is forgotten and announced twice. */
const MAX_ANNOUNCED_IDS = 1000
const TOAST_DURATION_MS = 10_000

const announcedIdsKey = (account: string) => `stopMarketAnnouncedExecutions:${NOTI_ENV}:${account.toLowerCase()}`

export const loadAnnouncedIds = (account: string): Set<number> => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(announcedIdsKey(account)) || '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [])
  } catch (error) {
    console.error('Error reading announced stop market executions:', error)
    return new Set()
  }
}

export const saveAnnouncedIds = (account: string, ids: Set<number>) => {
  try {
    // Notification ids grow over time, so the largest are the ones a later read can still return.
    const kept = [...ids].sort((a, b) => b - a).slice(0, MAX_ANNOUNCED_IDS)
    localStorage.setItem(announcedIdsKey(account), JSON.stringify(kept))
  } catch (error) {
    console.error('Error saving announced stop market executions:', error)
  }
}

/** The unread executions not announced yet, each once, oldest first. */
export const selectUnannounced = (notifications: PrivateAnnouncement[], announcedIds: Set<number>) => {
  const picked = new Map<number, PrivateAnnouncement>()
  notifications.forEach(item => {
    if (!item.isRead && !announcedIds.has(item.id)) picked.set(item.id, item)
  })
  return [...picked.values()].sort((a, b) => a.sentAt - b.sentAt)
}

const ExecutedSummary = ({ execution }: { execution?: StopMarketExecution }) => {
  const { chainId, txHash, amountIn, tokenInSymbol, amountOut, tokenOutSymbol } = execution ?? {}
  const sold = `${formatDisplayNumber(amountIn, { significantDigits: 6 })} ${tokenInSymbol}`
  const received = `${formatDisplayNumber(amountOut, { significantDigits: 6 })} ${tokenOutSymbol}`
  return (
    <span>
      {amountIn && tokenInSymbol && amountOut && tokenOutSymbol ? (
        <Trans>
          Sold {sold} → received {received}.
        </Trans>
      ) : (
        <Trans>Your Stop Market order was executed.</Trans>
      )}
      {chainId && txHash && (
        <>
          {' '}
          <ExternalLink href={getEtherscanLink(chainId, txHash, 'transaction')}>
            <Trans>View tx</Trans>
          </ExternalLink>
        </>
      )}
    </span>
  )
}

/**
 * Tells the user, wherever they are in the app, about every stop market order execution they have not been
 * told about, including those that happened while they were away. The order service has no push channel, so
 * the notification service is asked for the executed template every 10 seconds, as often as the orders list
 * refreshes. Each unread execution is toasted once per wallet on this device: the ids already toasted are kept
 * in localStorage, so neither a reload nor another tab announces them again.
 */
export const useStopMarketExecutedNotifications = () => {
  const { account } = useActiveWeb3React()
  const addPopup = useAddPopup()
  const refreshPrivateAnnouncements = useRefreshPrivateAnnouncements()
  const dispatch = useAppDispatch()
  const templateIds = getStopMarketExecutedTemplateIds()

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
  // execution is announced without waiting for the next poll.
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

      // The orders table and the inbox would otherwise wait for their own next refresh to show the execution.
      dispatch(stopMarketApi.util.invalidateTags([RTK_QUERY_TAGS.GET_STOP_MARKET_LIST]))
      refreshPrivateAnnouncements()
      // Announced even when the body cannot be read: the execution happened, only its details are missing.
      // Toasts past the visible stack wait their turn; their timers start only once shown.
      fresh.forEach(item => {
        addPopup({
          content: {
            type: NotificationType.SUCCESS,
            title: t`Stop Market order executed`,
            summary: <ExecutedSummary execution={getStopMarketExecution(item)} />,
          },
          popupType: PopupType.SIMPLE,
          key: `stop-market-executed-${item.id}`,
          removeAfterMs: TOAST_DURATION_MS,
        })
      })
    },
    [addPopup, dispatch, refreshPrivateAnnouncements],
  )

  /** Every execution up to MAX_BACKLOG; pages that fail to load are left out. */
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

  // A wallet holding more executions than one poll returns has the rest read once per session. Polls are
  // announced only after that read, so a returning user's toasts arrive oldest first.
  const backlogRef = useRef<{ account?: string; isDone: boolean }>({ isDone: false })
  useEffect(() => {
    if (!account || !currentData) return
    const notifications = currentData.notifications
    const backlog = backlogRef.current
    if (backlog.account === account) {
      if (backlog.isDone) announce(account, notifications)
      return
    }

    const total = currentData.pagination?.totalItems ?? 0
    if (total <= notifications.length) {
      backlogRef.current = { account, isDone: true }
      announce(account, notifications)
      return
    }

    backlogRef.current = { account, isDone: false }
    readBacklog(account, total).then(older => {
      if (backlogRef.current.account !== account) return
      backlogRef.current = { account, isDone: true }
      announce(account, [...notifications, ...older])
    })
  }, [account, currentData, announce, readBacklog])
}
