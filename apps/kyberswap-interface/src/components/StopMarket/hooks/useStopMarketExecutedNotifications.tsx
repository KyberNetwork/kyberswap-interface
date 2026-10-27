import { Trans, t } from '@lingui/macro'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useGetNotificationsQuery } from 'services/notification'
import stopMarketApi from 'services/stopMarket'

import { StopMarketExecution, getStopMarketExecution } from 'components/Announcement/helpers'
import { NotificationType } from 'components/Announcement/type'
import { getStopMarketExecutedTemplateIds } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useNotify, useRefreshPrivateAnnouncements } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const POLL_INTERVAL = 30_000
/** An execution sent longer ago than this is not news; the order history already shows it. */
const RECENT_EXECUTION_SECS = 5 * 60

const ExecutedSummary = ({ execution }: { execution: StopMarketExecution }) => {
  const { chainId, txHash, amountIn, tokenInSymbol, amountOut, tokenOutSymbol } = execution
  const sold = `${formatDisplayNumber(amountIn, { significantDigits: 6 })} ${tokenInSymbol}`
  const received = `${formatDisplayNumber(amountOut, { significantDigits: 6 })} ${tokenOutSymbol}`
  return (
    <span>
      {amountIn && tokenInSymbol && amountOut && tokenOutSymbol ? (
        <Trans>
          Sold {sold} → received {received}.
        </Trans>
      ) : (
        <Trans>Your stop market order was executed.</Trans>
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
 * Tells the user, wherever they are in the app, when one of their stop market orders executes. The order
 * service has no push channel, so the notification service is asked every 30 seconds for the executed
 * template. What the first answer for a wallet already holds is only recorded, never shown, so opening the
 * app does not replay past executions.
 */
export const useStopMarketExecutedNotifications = () => {
  const { account } = useActiveWeb3React()
  const notify = useNotify()
  const refreshPrivateAnnouncements = useRefreshPrivateAnnouncements()
  const dispatch = useDispatch()
  const templateIds = getStopMarketExecutedTemplateIds()

  const { currentData } = useGetNotificationsQuery(
    { account: account ?? '', templateIds, page: 1, pageSize: 10 },
    {
      skip: !account || !templateIds,
      pollingInterval: POLL_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  const seenRef = useRef<{ account?: string; ids: Set<number> }>({ ids: new Set() })
  useEffect(() => {
    if (!account || !currentData) return
    const notifications = currentData.notifications
    if (seenRef.current.account !== account) {
      seenRef.current = { account, ids: new Set(notifications.map(item => item.id)) }
      return
    }

    const now = Date.now() / 1000
    const fresh = notifications.filter(
      item => !seenRef.current.ids.has(item.id) && !item.isRead && now - item.sentAt <= RECENT_EXECUTION_SECS,
    )
    notifications.forEach(item => seenRef.current.ids.add(item.id))
    if (!fresh.length) return

    // The orders table and the inbox would otherwise wait for their own next refresh to show the execution.
    dispatch(stopMarketApi.util.invalidateTags([RTK_QUERY_TAGS.GET_STOP_MARKET_LIST]))
    refreshPrivateAnnouncements()
    fresh.forEach(item => {
      const execution = getStopMarketExecution(item)
      if (!execution) return
      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Stop Market order executed`,
          summary: <ExecutedSummary execution={execution} />,
        },
        10_000,
      )
    })
  }, [account, currentData, dispatch, notify, refreshPrivateAnnouncements])
}
