import {
  AnnouncementTemplateLimitOrder,
  AnnouncementTemplateSmartExit,
  PoolPositionAnnouncement,
  PrivateAnnouncement,
} from 'components/Announcement/type'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'

export const getEarnPosition = (announcement?: PrivateAnnouncement): PoolPositionAnnouncement | undefined => {
  const body = announcement?.templateBody as unknown
  if (body && typeof body === 'object' && 'position' in (body as { position?: PoolPositionAnnouncement })) {
    return (body as { position?: PoolPositionAnnouncement }).position
  }
  return undefined
}

export const getLimitOrderPreview = (
  announcement?: PrivateAnnouncement,
): { pair?: string; status?: string } | undefined => {
  const body = announcement?.templateBody as AnnouncementTemplateLimitOrder | undefined
  const order = body?.order
  if (!order) return undefined
  const pair =
    order.makerAssetSymbol && order.takerAssetSymbol ? `${order.makerAssetSymbol}/${order.takerAssetSymbol}` : undefined
  const status = (() => {
    if (body?.isReorg) {
      return `Reverted ${order.increasedFilledPercent || ''}`.trim()
    }
    switch (order.status) {
      case LimitOrderStatus.FILLED:
        return '100% Filled'
      case LimitOrderStatus.PARTIALLY_FILLED:
        return `${order.filledPercent || '0%'} Filled${
          order.increasedFilledPercent ? ` ${order.increasedFilledPercent}` : ''
        }`
      case LimitOrderStatus.EXPIRED:
        return order.filledPercent ? `${order.filledPercent}% Filled | Expired` : 'Expired'
      case LimitOrderStatus.CANCELLED:
      case LimitOrderStatus.CLOSED:
        return 'Order Cancelled'
      case LimitOrderStatus.INSUFFICIENT_FUNDS:
        return 'Insufficient Funds'
      default:
        return 'Order Created'
    }
  })()

  return { pair, status }
}

export const getSmartExitPreview = (
  announcement?: PrivateAnnouncement,
): { pair?: string; note?: string } | undefined => {
  const body = announcement?.templateBody as AnnouncementTemplateSmartExit | undefined
  const token0 = body?.position.pool.token0.symbol
  const token1 = body?.position.pool.token1.symbol
  const pair = token0 && token1 ? `${token0}/${token1}` : undefined
  const note = body?.reason || body?.order.conditionText
  if (!pair && !note) return undefined
  return { pair, note }
}
