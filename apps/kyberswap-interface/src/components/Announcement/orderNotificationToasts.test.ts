import { isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import {
  OrderNotificationKind,
  buildOrderNotificationToasts,
  getLimitOrderNotice,
  groupOrderNotifications,
} from 'components/Announcement/orderNotificationToasts'
import { NotificationType, PrivateAnnouncement, PrivateAnnouncementType } from 'components/Announcement/type'
import { LimitOrderStatus } from 'components/LimitOrder/types'
import { getStopMarketExecutedTemplateIds } from 'constants/env'

const STOP_MARKET_TEMPLATE_ID = Number(getStopMarketExecutedTemplateIds())
const LIMIT_ORDER_TEMPLATE_ID = 1

type OrderFields = Record<string, string | number>

const limitOrder = (id: number, sentAt: number, order: OrderFields, isReorg: boolean | string = false) =>
  ({
    id,
    sentAt,
    isRead: false,
    templateId: LIMIT_ORDER_TEMPLATE_ID,
    templateType: PrivateAnnouncementType.LIMIT_ORDER,
    templateBody: {
      order: {
        chainId: '56',
        makerAssetSymbol: 'USDC',
        takerAssetSymbol: 'BNB',
        makingAmount: '100',
        takingAmount: '0.2',
        ...order,
      },
      isReorg,
    },
  } as unknown as PrivateAnnouncement)

const stopMarket = (id: number, sentAt: number) =>
  ({
    id,
    sentAt,
    isRead: false,
    templateId: STOP_MARKET_TEMPLATE_ID,
    templateType: PrivateAnnouncementType.LIMIT_ORDER,
    templateBody: {
      order: { chainId: '56', txHash: '0x7c45', tokenInSymbol: 'USDC', amountIn: '6.85', tokenOutSymbol: 'WBNB' },
    },
  } as unknown as PrivateAnnouncement)

const summarize = (notifications: PrivateAnnouncement[]) =>
  groupOrderNotifications(notifications).map(group => ({
    kind: group.kind,
    notificationIds: group.notificationIds,
    orderIds: 'orders' in group ? group.orders.map(order => order.orderId) : undefined,
  }))

describe('getLimitOrderNotice', () => {
  it('reads the order and leaves out unfilled fields', () => {
    const notice = getLimitOrderNotice(
      limitOrder(1, 100, {
        id: '42',
        status: LimitOrderStatus.EXPIRED,
        filledPercent: '35.5%',
        filledTakingAmount: 'unknown',
        createdAt: 1793076451000,
      }),
    )

    expect(notice).toMatchObject({
      notificationId: 1,
      kind: OrderNotificationKind.EXPIRED,
      orderId: '42',
      chainId: 56,
      makingAmount: '100',
      filledPercent: 35.5,
      filledTakingAmount: undefined,
      createdAt: 1793076451,
    })
  })

  it('classifies every limit order status', () => {
    const kindOf = (status: string, isReorg: boolean | string = false) =>
      getLimitOrderNotice(limitOrder(1, 100, { id: '1', status }, isReorg)).kind

    expect(kindOf(LimitOrderStatus.FILLED)).toBe(OrderNotificationKind.FILLED)
    expect(kindOf(LimitOrderStatus.PARTIALLY_FILLED)).toBe(OrderNotificationKind.PARTIALLY_FILLED)
    expect(kindOf(LimitOrderStatus.EXPIRED)).toBe(OrderNotificationKind.EXPIRED)
    expect(kindOf(LimitOrderStatus.CANCELLED)).toBe(OrderNotificationKind.CANCELLED)
    expect(kindOf(LimitOrderStatus.CLOSED)).toBe(OrderNotificationKind.CANCELLED)
    expect(kindOf(LimitOrderStatus.FILLED, true)).toBe(OrderNotificationKind.REVERTED)
    expect(kindOf(LimitOrderStatus.PARTIALLY_FILLED, 'true')).toBe(OrderNotificationKind.REVERTED)
    expect(kindOf(LimitOrderStatus.FILLED, 'unknown')).toBe(OrderNotificationKind.FILLED)
    expect(kindOf(LimitOrderStatus.ACTIVE)).toBeUndefined()
    expect(kindOf(LimitOrderStatus.INSUFFICIENT_FUNDS)).toBeUndefined()
  })
})

describe('groupOrderNotifications', () => {
  it('groups filled, expired, cancelled and reverted orders, and keeps partial fills apart', () => {
    const groups = summarize([
      limitOrder(1, 100, { id: '1', status: LimitOrderStatus.FILLED }),
      limitOrder(2, 110, { id: '2', status: LimitOrderStatus.PARTIALLY_FILLED }),
      limitOrder(3, 120, { id: '3', status: LimitOrderStatus.FILLED }),
      limitOrder(4, 130, { id: '4', status: LimitOrderStatus.PARTIALLY_FILLED }),
      limitOrder(5, 140, { id: '5', status: LimitOrderStatus.EXPIRED }),
      limitOrder(6, 150, { id: '6', status: LimitOrderStatus.CANCELLED }),
      limitOrder(7, 160, { id: '7', status: LimitOrderStatus.CLOSED }),
      limitOrder(8, 170, { id: '8', status: LimitOrderStatus.FILLED }, true),
    ])

    expect(groups).toEqual([
      { kind: OrderNotificationKind.FILLED, notificationIds: [1, 3], orderIds: ['1', '3'] },
      { kind: OrderNotificationKind.PARTIALLY_FILLED, notificationIds: [2], orderIds: ['2'] },
      { kind: OrderNotificationKind.PARTIALLY_FILLED, notificationIds: [4], orderIds: ['4'] },
      { kind: OrderNotificationKind.EXPIRED, notificationIds: [5], orderIds: ['5'] },
      { kind: OrderNotificationKind.CANCELLED, notificationIds: [6, 7], orderIds: ['6', '7'] },
      { kind: OrderNotificationKind.REVERTED, notificationIds: [8], orderIds: ['8'] },
    ])
  })

  it('reports each order by its newest notification only', () => {
    const groups = summarize([
      limitOrder(3, 300, { id: '1', status: LimitOrderStatus.FILLED }),
      limitOrder(1, 100, { id: '1', status: LimitOrderStatus.ACTIVE }),
      limitOrder(2, 200, { id: '1', status: LimitOrderStatus.PARTIALLY_FILLED }),
    ])

    expect(groups).toEqual([{ kind: OrderNotificationKind.FILLED, notificationIds: [3], orderIds: ['1'] }])
  })

  it('breaks a sentAt tie by the larger notification id', () => {
    const groups = summarize([
      limitOrder(5, 100, { id: '1', status: LimitOrderStatus.FILLED }),
      limitOrder(4, 100, { id: '1', status: LimitOrderStatus.PARTIALLY_FILLED }),
    ])

    expect(groups).toEqual([{ kind: OrderNotificationKind.FILLED, notificationIds: [5], orderIds: ['1'] }])
  })

  it('stays silent when an order is newest as created or short of funds', () => {
    const groups = summarize([
      limitOrder(1, 100, { id: '1', status: LimitOrderStatus.PARTIALLY_FILLED }),
      limitOrder(2, 200, { id: '1', status: LimitOrderStatus.INSUFFICIENT_FUNDS }),
      limitOrder(3, 300, { id: '2', status: LimitOrderStatus.ACTIVE }),
    ])

    expect(groups).toEqual([])
  })

  it('keeps notifications without an order id apart', () => {
    const groups = summarize([
      limitOrder(1, 100, { id: 'unknown', status: LimitOrderStatus.FILLED }),
      limitOrder(2, 200, { id: 'unknown', status: LimitOrderStatus.FILLED }),
    ])

    expect(groups).toEqual([
      { kind: OrderNotificationKind.FILLED, notificationIds: [1, 2], orderIds: [undefined, undefined] },
    ])
  })

  it('passes each stop market execution through on its own', () => {
    const groups = summarize([
      stopMarket(1, 100),
      limitOrder(2, 150, { id: '9', status: LimitOrderStatus.FILLED }),
      stopMarket(3, 200),
    ])

    expect(groups).toEqual([
      { kind: OrderNotificationKind.STOP_MARKET_EXECUTED, notificationIds: [1], orderIds: undefined },
      { kind: OrderNotificationKind.FILLED, notificationIds: [2], orderIds: ['9'] },
      { kind: OrderNotificationKind.STOP_MARKET_EXECUTED, notificationIds: [3], orderIds: undefined },
    ])
  })
})

describe('buildOrderNotificationToasts', () => {
  const toastsFor = (notifications: PrivateAnnouncement[]) =>
    buildOrderNotificationToasts(groupOrderNotifications(notifications))

  it('builds one toast per group with a stable key and a summary', () => {
    const toasts = toastsFor([
      limitOrder(1, 100, { id: '1', status: LimitOrderStatus.FILLED }),
      limitOrder(2, 200, { id: '2', status: LimitOrderStatus.FILLED }),
      limitOrder(3, 300, { id: '3', status: LimitOrderStatus.EXPIRED, filledPercent: '20' }),
      stopMarket(4, 400),
    ])

    expect(toasts.map(toast => toast.key)).toEqual([
      'order-notification-filled-1-2',
      'order-notification-expired-3',
      'order-notification-stop-market-executed-4',
    ])
    expect(toasts.map(toast => toast.content.type)).toEqual([
      NotificationType.SUCCESS,
      NotificationType.WARNING,
      NotificationType.SUCCESS,
    ])
    toasts.forEach(toast => expect(isValidElement(toast.content.summary)).toBe(true))
  })

  it('links limit orders to the tab that lists them now, on their chain', () => {
    const linkOf = (status: string, isReorg = false) =>
      toastsFor([limitOrder(1, 100, { id: '1', status }, isReorg)])[0].content.link

    expect(linkOf(LimitOrderStatus.FILLED)).toContain('orderTab=closed')
    expect(linkOf(LimitOrderStatus.EXPIRED)).toContain('orderTab=closed')
    expect(linkOf(LimitOrderStatus.CANCELLED)).toContain('orderTab=closed')
    expect(linkOf(LimitOrderStatus.PARTIALLY_FILLED)).toContain('orderTab=active')
    expect(linkOf(LimitOrderStatus.FILLED, true)).toContain('orderTab=active')
    expect(linkOf(LimitOrderStatus.FILLED)).toContain('/bnb')
  })

  it('leaves out the link without a known chain and for stop market executions', () => {
    const [limit, stop] = toastsFor([
      limitOrder(1, 100, { id: '1', status: LimitOrderStatus.FILLED, chainId: 'unknown' }),
      stopMarket(2, 200),
    ])

    expect(limit.content.link).toBeUndefined()
    expect(stop.content.link).toBeUndefined()
  })
})
