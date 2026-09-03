import dayjs from 'dayjs'
import type { ActivityRow } from 'services/copyTrading/types/copyRuns'
import type { TradeSide } from 'services/copyTrading/types/primitives'
import { formatUnits } from 'viem'

import { formatTokenAmount, getActivityLabel } from 'pages/CopyTrading/helpers'

export type AlertFeedTone = 'buy' | 'sell' | 'warning' | 'neutral'

export type AlertFeedItemViewModel = {
  agentAction?: 'bought' | 'sold'
  agentFallback?: string
  agentName: string
  agentTokenSymbol?: string
  indicatorTone: AlertFeedTone
  key: string
  manualSellCopyRunId?: string
  occurredAt: string
  referenceId?: string
  userAction?: 'bought' | 'sold' | 'skipped' | 'pending' | 'completed'
  userAmount?: string
  userFallback?: string
  userPrice?: string
  userReason?: string
  userTokenSymbol?: string
  userTone: AlertFeedTone
  userQuoteTokenSymbol?: string
}

const actionFromSide = (side?: TradeSide) => {
  if (side === 'buy') return 'bought'
  if (side === 'sell') return 'sold'
  return undefined
}

const toneFromSide = (side?: TradeSide): AlertFeedTone => {
  if (side === 'buy') return 'buy'
  if (side === 'sell') return 'sell'
  return 'neutral'
}

const formatRawTokenAmount = (valueRaw?: string, decimals?: number) => {
  if (!valueRaw || decimals === undefined) return undefined

  try {
    return formatTokenAmount(formatUnits(BigInt(valueRaw), decimals))
  } catch {
    return undefined
  }
}

const getAgentName = (activity: ActivityRow) =>
  activity.agentDisplayName || activity.agentId.replace(/[-_]/g, ' ') || 'Unknown Agent'

export const getAlertFeedItemViewModel = (activity: ActivityRow): AlertFeedItemViewModel => {
  const alert = activity.alert
  const leader = alert?.leader
  const user = alert?.user
  const leaderAction = actionFromSide(leader?.side)
  const userSide = user?.side === 'unknown' ? leader?.side : user?.side
  const userAction = actionFromSide(userSide)
  const userAmount = formatRawTokenAmount(user?.baseAmountRaw, leader?.baseToken?.decimals)
  const userPrice = user?.quotePerBasePrice?.value ? formatTokenAmount(user.quotePerBasePrice.value) : undefined
  const canRenderSucceededOutcome =
    !!userAction && !!userAmount && !!leader?.baseToken?.symbol && !!userPrice && !!leader.quoteToken?.symbol

  let resolvedUserAction: AlertFeedItemViewModel['userAction']
  let userFallback: string | undefined

  switch (user?.status) {
    case 'succeeded':
      if (canRenderSucceededOutcome) resolvedUserAction = userAction
      else userFallback = alert?.fallbackUserSummaryEn
      break
    case 'skipped':
      resolvedUserAction = 'skipped'
      break
    case 'pending':
      resolvedUserAction = 'pending'
      break
    case 'effect_observed_incomplete':
      resolvedUserAction = 'completed'
      break
    default:
      userFallback = alert?.fallbackUserSummaryEn || activity.summary.trim() || undefined
  }

  const indicatorTone: AlertFeedTone =
    user?.status === 'skipped' || user?.status === 'effect_observed_incomplete'
      ? 'warning'
      : user?.status === 'succeeded'
      ? toneFromSide(userSide)
      : 'neutral'

  return {
    agentAction: leaderAction,
    agentFallback: leaderAction && leader?.baseToken?.symbol ? undefined : alert?.fallbackAgentSummaryEn,
    agentName: getAgentName(activity),
    agentTokenSymbol: leader?.baseToken?.symbol,
    indicatorTone,
    key: alert?.alertId || activity.activityId,
    manualSellCopyRunId: user?.status === 'skipped' && userSide === 'sell' ? activity.copyRunId : undefined,
    occurredAt: activity.occurredAt,
    referenceId: leader?.leaderPositionId || activity.tradeId,
    userAction: resolvedUserAction,
    userAmount,
    userFallback,
    userPrice,
    userReason: user?.status === 'skipped' ? user.publicErrorMessage : undefined,
    userTokenSymbol: leader?.baseToken?.symbol,
    userTone: user?.status === 'skipped' ? 'sell' : toneFromSide(userSide),
    userQuoteTokenSymbol: leader?.quoteToken?.symbol,
  }
}

export const getLegacyAlertFeedLabel = (activity: ActivityRow) =>
  `${getAgentName(activity)} ${getActivityLabel(activity)}`

export const formatAlertFeedTime = (value?: string, now: string | number | Date = Date.now()) => {
  const occurredAt = dayjs(value)
  const currentTime = dayjs(now)
  if (!value || !occurredAt.isValid() || !currentTime.isValid()) return '-'

  const seconds = Math.max(0, currentTime.diff(occurredAt, 'second'))
  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo ago`

  const years = Math.floor(days / 365)
  return `${years} yr${years === 1 ? '' : 's'} ago`
}
