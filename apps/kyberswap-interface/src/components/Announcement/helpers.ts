import { t } from '@lingui/macro'
import dayjs from 'dayjs'

import {
  AnnouncementTemplateLimitOrder,
  AnnouncementTemplateSmartExit,
  PoolPositionAnnouncement,
  PrivateAnnouncement,
  SmartExitReason,
  SmartExitStatus,
} from 'components/Announcement/type'
import { LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { EnvKeys, NOTI_ENV } from 'constants/env'
import { Metric, SmartExitCondition } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

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
  const status = getSmartExitStatusFromTemplateId(announcement?.templateId)
  const note = getSmartExitStatusMessage(status)
  if (!pair && !note) return undefined
  return { pair, note }
}

export const getSmartExitStatusFromTemplateId = (templateId?: number): SmartExitStatus => {
  if (!templateId) return SmartExitStatus.UNKNOWN
  if (NOTI_ENV === EnvKeys.STG) {
    if (templateId === 12) return SmartExitStatus.CREATED
    if (templateId === 13) return SmartExitStatus.NOT_EXECUTED
    if (templateId === 14) return SmartExitStatus.EXECUTED
    if (templateId === 15) return SmartExitStatus.EXPIRED
    if (templateId === 16) return SmartExitStatus.CANCELLED
  }
  if (NOTI_ENV === EnvKeys.PROD) {
    if (templateId === 39) return SmartExitStatus.CREATED
    if (templateId === 40) return SmartExitStatus.NOT_EXECUTED
    if (templateId === 41) return SmartExitStatus.EXECUTED
    if (templateId === 42) return SmartExitStatus.EXPIRED
    if (templateId === 43) return SmartExitStatus.CANCELLED
  }
  return SmartExitStatus.UNKNOWN
}

export const getSmartExitStatusMessage = (status: SmartExitStatus) => {
  switch (status) {
    case SmartExitStatus.CREATED:
      return t`Smart Exit created`
    case SmartExitStatus.EXECUTED:
      return t`Smart Exit executed`
    case SmartExitStatus.NOT_EXECUTED:
      return t`Smart Exit not executed`
    case SmartExitStatus.EXPIRED:
      return t`Smart Exit expired`
    case SmartExitStatus.CANCELLED:
      return t`Smart Exit cancelled`
    default:
      return t`Smart Exit updated`
  }
}

export const getSmartExitConditionText = (condition?: SmartExitCondition, fallbackText?: string) => {
  const logical = condition?.logical
  if (!logical?.conditions?.length) return fallbackText

  const parts = logical.conditions
    .map((item, index) => {
      const field = item?.field
      if (!field) return null

      if (field.type === Metric.FeeYield) {
        const value = Number(field.value?.gte)
        if (!Number.isFinite(value)) return null
        return `Yield ≥ ${formatDisplayNumber(value, { significantDigits: 6 })}%`
      }

      if (field.type === Metric.PoolPrice) {
        const raw = field.value?.gte ?? field.value?.lte
        if (raw === undefined || raw === null) return null
        const operator = field.value?.lte ? '≤' : '≥'
        return `Price ${operator} ${formatDisplayNumber(raw, { significantDigits: 6 })}`
      }

      if (field.type === Metric.Time) {
        const raw = field.value?.lte ?? field.value?.gte
        if (!raw) return null
        const formattedTime = dayjs(raw * 1000).format('DD/MM/YYYY HH:mm:ss')
        const label = field.value?.lte ? 'Before' : 'After'
        const displayLabel = index === 0 ? label : label.toLowerCase()
        return `${displayLabel} ${formattedTime}`
      }

      return null
    })
    .filter((part): part is string => Boolean(part))

  if (!parts.length) return fallbackText
  const op = logical.op ? logical.op.toUpperCase() : 'AND'
  return parts.join(` ${op} `)
}

export const getSmartExitReasonText = (reason?: SmartExitReason | string, status?: SmartExitStatus) => {
  if (status === SmartExitStatus.EXPIRED) return t`Expiry reached`
  if (!reason) return undefined
  switch (reason) {
    case SmartExitReason.CancelledByYou:
      return t`Cancelled by you`
    case SmartExitReason.LiquidityChanged:
      return t`Liquidity changed`
    case SmartExitReason.ConditionNeverMet:
      return t`Condition never met`
    case SmartExitReason.OwnerChanged:
      return t`Owner changed`
    case SmartExitReason.MaxGasFeeExceeded:
      return t`Max gas fee exceeded (retrying)`
    case SmartExitReason.ExpiryReached:
      return t`Expiry reached`
    default:
      return reason
  }
}
