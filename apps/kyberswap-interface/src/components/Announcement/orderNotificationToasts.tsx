import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'

import { StopMarketExecution, getFilledTemplateField, getStopMarketExecution } from 'components/Announcement/helpers'
import {
  AnnouncementTemplateLimitOrder,
  NotificationType,
  PopupContentSimple,
  PrivateAnnouncement,
} from 'components/Announcement/type'
import { getOrderListPath } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import { isStopMarketExecutedTemplate } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import { ExternalLink } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

export enum OrderNotificationKind {
  STOP_MARKET_EXECUTED = 'stop-market-executed',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially-filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REVERTED = 'reverted',
}

type LimitOrderNotificationKind = Exclude<OrderNotificationKind, OrderNotificationKind.STOP_MARKET_EXECUTED>

/** A limit order notification's order, with only the fields the service filled in. Amounts are in token units. */
export type LimitOrderNotice = {
  notificationId: number
  sentAt: number
  kind?: LimitOrderNotificationKind
  orderId?: string
  chainId?: ChainId
  makerAssetSymbol?: string
  takerAssetSymbol?: string
  makingAmount?: string
  takingAmount?: string
  filledTakingAmount?: string
  /** 0 to 100. */
  filledPercent?: number
  /** Unix seconds. */
  createdAt?: number
}

export type OrderNotificationGroup =
  | { kind: OrderNotificationKind.STOP_MARKET_EXECUTED; notificationIds: number[]; execution?: StopMarketExecution }
  | { kind: LimitOrderNotificationKind; notificationIds: number[]; orders: LimitOrderNotice[] }

type LimitOrderGroup = Extract<OrderNotificationGroup, { orders: LimitOrderNotice[] }>

export type OrderNotificationToast = { key: string; content: PopupContentSimple }

const MAX_LISTED_ORDERS = 4

const classifyLimitOrder = (status: string | undefined, isReorg: boolean): LimitOrderNotificationKind | undefined => {
  if (isReorg) return OrderNotificationKind.REVERTED
  switch (status) {
    case LimitOrderStatus.FILLED:
      return OrderNotificationKind.FILLED
    case LimitOrderStatus.PARTIALLY_FILLED:
      return OrderNotificationKind.PARTIALLY_FILLED
    case LimitOrderStatus.EXPIRED:
      return OrderNotificationKind.EXPIRED
    case LimitOrderStatus.CANCELLED:
    case LimitOrderStatus.CLOSED:
      return OrderNotificationKind.CANCELLED
    default:
      // Created and insufficient-funds notifications stay in the inbox only.
      return undefined
  }
}

/** Accepts the service's '42', '42%', '42.5 %' and '< 0.01' renderings. */
const parsePercent = (value?: string) => {
  const percent = Number(getFilledTemplateField(value)?.replace(/[^\d.]/g, ''))
  return Number.isFinite(percent) && percent > 0 ? percent : undefined
}

const parseUnixSeconds = (value?: number | string) => {
  const time = Number(typeof value === 'string' ? getFilledTemplateField(value) : value)
  if (!Number.isFinite(time) || time <= 0) return undefined
  return time > 1e12 ? Math.floor(time / 1000) : time
}

export const getLimitOrderNotice = (item: PrivateAnnouncement): LimitOrderNotice => {
  const body = item.templateBody as AnnouncementTemplateLimitOrder | undefined
  const order = body?.order
  const chainId = Number(getFilledTemplateField(order?.chainId))
  return {
    notificationId: item.id,
    sentAt: item.sentAt,
    // The template service may hand the flag back as a string.
    kind: classifyLimitOrder(order?.status, String(body?.isReorg) === 'true'),
    orderId: getFilledTemplateField(order?.id),
    chainId: chainId > 0 ? (chainId as ChainId) : undefined,
    makerAssetSymbol: getFilledTemplateField(order?.makerAssetSymbol),
    takerAssetSymbol: getFilledTemplateField(order?.takerAssetSymbol),
    makingAmount: getFilledTemplateField(order?.makingAmount),
    takingAmount: getFilledTemplateField(order?.takingAmount),
    filledTakingAmount: getFilledTemplateField(order?.filledTakingAmount),
    filledPercent: parsePercent(order?.filledPercent),
    createdAt: parseUnixSeconds(order?.createdAt),
  }
}

const isNewer = (a: { sentAt: number; notificationId: number }, b: { sentAt: number; notificationId: number }) =>
  a.sentAt !== b.sentAt ? a.sentAt > b.sentAt : a.notificationId > b.notificationId

/**
 * Sorts fresh notifications into toasts: one per stop market execution, one per partially filled limit order, and
 * one per remaining limit order outcome. A limit order announced several times is reported by its newest
 * notification only; a notification that names no order stands alone.
 */
export const groupOrderNotifications = (notifications: PrivateAnnouncement[]): OrderNotificationGroup[] => {
  const sorted = [...notifications].sort((a, b) => a.sentAt - b.sentAt || a.id - b.id)
  const notices = new Map<number, LimitOrderNotice>()
  const newestByOrder = new Map<string, LimitOrderNotice>()
  sorted.forEach(item => {
    if (isStopMarketExecutedTemplate(item.templateId)) return
    const notice = getLimitOrderNotice(item)
    notices.set(item.id, notice)
    if (!notice.orderId) return
    const newest = newestByOrder.get(notice.orderId)
    if (!newest || isNewer(notice, newest)) newestByOrder.set(notice.orderId, notice)
  })

  const groups: OrderNotificationGroup[] = []
  const groupByKind = new Map<LimitOrderNotificationKind, LimitOrderGroup>()
  sorted.forEach(item => {
    if (isStopMarketExecutedTemplate(item.templateId)) {
      groups.push({
        kind: OrderNotificationKind.STOP_MARKET_EXECUTED,
        notificationIds: [item.id],
        execution: getStopMarketExecution(item),
      })
      return
    }
    const notice = notices.get(item.id)
    if (!notice?.kind) return
    if (notice.orderId && newestByOrder.get(notice.orderId) !== notice) return
    if (notice.kind === OrderNotificationKind.PARTIALLY_FILLED) {
      groups.push({ kind: notice.kind, notificationIds: [item.id], orders: [notice] })
      return
    }
    const group = groupByKind.get(notice.kind)
    if (group) {
      group.notificationIds.push(item.id)
      group.orders.push(notice)
      return
    }
    const created: LimitOrderGroup = { kind: notice.kind, notificationIds: [item.id], orders: [notice] }
    groupByKind.set(notice.kind, created)
    groups.push(created)
  })
  return groups
}

const formatAmount = (amount?: string) => formatDisplayNumber(amount, { significantDigits: 6 })

const formatPercent = (percent: number) => `${formatDisplayNumber(percent, { significantDigits: 4 })}%`

const OrderPair = ({ order }: { order: LimitOrderNotice }) => {
  const { orderId, makingAmount, makerAssetSymbol, takingAmount, takerAssetSymbol } = order
  if (!makingAmount || !makerAssetSymbol || !takingAmount || !takerAssetSymbol) {
    return orderId ? <span className="font-medium">#{orderId}</span> : null
  }
  const making = `${formatAmount(makingAmount)} ${makerAssetSymbol}`
  const taking = `${formatAmount(takingAmount)} ${takerAssetSymbol}`
  return (
    <span className="font-medium">
      {making} → {taking}
    </span>
  )
}

const OrderList = ({ orders, showFilledPercent }: { orders: LimitOrderNotice[]; showFilledPercent?: boolean }) => {
  const rest = orders.length - MAX_LISTED_ORDERS
  return (
    <ul className="m-0 pb-0 pl-[15px] pr-0 pt-[5px]">
      {orders.slice(0, MAX_LISTED_ORDERS).map(order => (
        <li key={order.notificationId}>
          <OrderPair order={order} />
          {showFilledPercent && order.filledPercent ? <> ({formatPercent(order.filledPercent)})</> : null}
        </li>
      ))}
      {rest > 0 && (
        <li>
          <Trans>and {rest} more</Trans>
        </li>
      )}
    </ul>
  )
}

const LimitOrderSummary = ({ kind, orders }: { kind: LimitOrderNotificationKind; orders: LimitOrderNotice[] }) => {
  const order = orders[0]
  const count = orders.length
  const pair = <OrderPair order={order} />
  const filledPercent = order.filledPercent ? formatPercent(order.filledPercent) : undefined

  const message = (() => {
    switch (kind) {
      case OrderNotificationKind.FILLED:
        return count > 1 ? <Trans>{count} orders were filled:</Trans> : <Trans>Your order {pair} was filled.</Trans>
      case OrderNotificationKind.PARTIALLY_FILLED:
        return filledPercent ? (
          <Trans>
            Your order {pair} is {filledPercent} filled.
          </Trans>
        ) : (
          <Trans>Your order {pair} was partially filled.</Trans>
        )
      case OrderNotificationKind.EXPIRED:
        if (count > 1) return <Trans>{count} orders have expired:</Trans>
        return filledPercent ? (
          <Trans>
            Your order {pair} has expired, {filledPercent} filled.
          </Trans>
        ) : (
          <Trans>Your order {pair} has expired.</Trans>
        )
      case OrderNotificationKind.CANCELLED:
        return count > 1 ? (
          <Trans>{count} orders were cancelled:</Trans>
        ) : (
          <Trans>Your order {pair} was cancelled.</Trans>
        )
      case OrderNotificationKind.REVERTED:
        return count > 1 ? (
          <Trans>Fills of {count} orders were reverted by a chain reorganization:</Trans>
        ) : (
          <Trans>A fill of your order {pair} was reverted by a chain reorganization.</Trans>
        )
    }
  })()

  return (
    <span className="leading-[18px]">
      {message}
      {count > 1 && <OrderList orders={orders} showFilledPercent={kind === OrderNotificationKind.EXPIRED} />}
    </span>
  )
}

const ExecutedSummary = ({ execution }: { execution?: StopMarketExecution }) => {
  const { chainId, txHash, amountIn, tokenInSymbol, amountOut, tokenOutSymbol } = execution ?? {}
  const sold = `${formatAmount(amountIn)} ${tokenInSymbol}`
  const received = `${formatAmount(amountOut)} ${tokenOutSymbol}`
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

const LIMIT_ORDER_TOAST: Record<
  LimitOrderNotificationKind,
  { title: () => string; type: NotificationType; tab: LimitOrderStatus.ACTIVE | LimitOrderStatus.CLOSED }
> = {
  [OrderNotificationKind.FILLED]: {
    title: () => t`Order Filled`,
    type: NotificationType.SUCCESS,
    tab: LimitOrderStatus.CLOSED,
  },
  [OrderNotificationKind.PARTIALLY_FILLED]: {
    title: () => t`Order Partially Filled`,
    type: NotificationType.SUCCESS,
    tab: LimitOrderStatus.ACTIVE,
  },
  [OrderNotificationKind.EXPIRED]: {
    title: () => t`Order Expired`,
    type: NotificationType.WARNING,
    tab: LimitOrderStatus.CLOSED,
  },
  [OrderNotificationKind.CANCELLED]: {
    title: () => t`Limit Order`,
    type: NotificationType.SUCCESS,
    tab: LimitOrderStatus.CLOSED,
  },
  [OrderNotificationKind.REVERTED]: {
    title: () => t`Order Fill Reverted`,
    type: NotificationType.WARNING,
    tab: LimitOrderStatus.ACTIVE,
  },
}

export const buildOrderNotificationToasts = (groups: OrderNotificationGroup[]): OrderNotificationToast[] =>
  groups.map(group => {
    const key = `order-notification-${group.kind}-${group.notificationIds.join('-')}`
    if (group.kind === OrderNotificationKind.STOP_MARKET_EXECUTED) {
      return {
        key,
        content: {
          type: NotificationType.SUCCESS,
          title: t`Stop Market order executed`,
          summary: <ExecutedSummary execution={group.execution} />,
        },
      }
    }
    const { title, type, tab } = LIMIT_ORDER_TOAST[group.kind]
    // A grouped toast opens the first order's chain; one without a known chain has no link.
    const chainId = group.orders[0]?.chainId
    return {
      key,
      content: {
        type,
        title: title(),
        summary: <LimitOrderSummary kind={group.kind} orders={group.orders} />,
        link:
          chainId && NETWORKS_INFO[chainId]
            ? getOrderListPath({ kind: OrderKind.LIMIT, chainId, status: tab })
            : undefined,
      },
    }
  })
