import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import React from 'react'
import { useMedia } from 'react-use'

import FeeYieldProgress from 'pages/Earns/SmartExitOrders/components/FeeYieldProgress'
import PoolPriceChart from 'pages/Earns/SmartExitOrders/components/PoolPriceChart'
import { MAX_VALID_TIMESTAMP } from 'pages/Earns/SmartExitOrders/constants'
import type { ParsedSmartExitOrder } from 'pages/Earns/SmartExitOrders/useSmartExitOrdersData'
import { ConditionType, OrderStatus, SmartExitLogReason, SmartExitOrder } from 'pages/Earns/types'
import { MEDIA_WIDTHS } from 'theme'

/**
 * Get the cancellation reason message from order logs
 * Returns null if no reason should be displayed (e.g., user cancelled manually)
 */
const getCancelReasonMessage = (logs: SmartExitOrder['logs']): string | null => {
  if (!logs || logs.length === 0) return null

  // Find the most recent log entry that contains a reason
  for (let i = logs.length - 1; i >= 0; i--) {
    const reason = logs[i]?.detail?.reason
    if (reason) {
      switch (reason) {
        case SmartExitLogReason.UpdateStatusReasonLiquidityChanged:
          return t`Smart Exit canceled: position liquidity is different than the signed amount.`
        case SmartExitLogReason.UpdateStatusReasonUserAPIUpdate:
          // User cancelled manually - don't show message
          return null
        case SmartExitLogReason.UpdateStatusReasonExpiredOrder:
          return t`Smart Exit canceled: order has expired.`
        case SmartExitLogReason.UpdateStatusReasonConditionNeverMet:
          return t`Smart Exit canceled: condition can never be met.`
        case SmartExitLogReason.UpdateStatusReasonOwnerChanged:
          return t`Smart Exit canceled: position owner has changed.`
        case SmartExitLogReason.UpdateStatusReasonFailedSimulation:
          return t`Smart Exit canceled: transaction simulation failed.`
        case SmartExitLogReason.UpdateStatusReasonFinalizedTx:
          return t`Smart Exit canceled: transaction has been finalized.`
        default:
          return null
      }
    }
  }

  return null
}

type ConditionLogical = SmartExitOrder['condition']['logical']

type ConditionItemProps = {
  condition: ConditionLogical['conditions'][0]
  position?: ParsedSmartExitOrder['position']
}

const ConditionItem = ({ condition, position }: ConditionItemProps) => {
  const c = condition

  if (c.field.type === 'fee_yield') {
    return <FeeYieldProgress targetYield={c.field.value.gte} currentYield={position?.earningFeeYield} />
  }

  if (c.field.type === 'pool_price') {
    const isLte = !!c.field.value.lte
    const targetPrice = c.field.value.gte || c.field.value.lte
    if (!targetPrice || !isFinite(targetPrice)) {
      return null
    }
    return <PoolPriceChart targetPrice={targetPrice} currentPrice={position?.priceRange?.current} isLte={isLte} />
  }

  if (c.field.type === 'time') {
    return (
      <span className="text-xs text-subText">
        {c.field.value.lte > 0 && c.field.value.lte < MAX_VALID_TIMESTAMP ? (
          <>
            <Trans>Before</Trans>{' '}
            <span className="text-text">{dayjs(c.field.value.lte * 1000).format('MMMM DD, YYYY HH:mm')} UTC.</span>
          </>
        ) : null}

        {c.field.value.gte > 0 && c.field.value.gte < MAX_VALID_TIMESTAMP ? (
          <>
            <Trans>After</Trans>{' '}
            <span className="text-text">{dayjs(c.field.value.gte * 1000).format('MMMM DD, YYYY HH:mm')} UTC.</span>
          </>
        ) : null}
      </span>
    )
  }

  return null
}

type ConditionContentProps = {
  logical: ConditionLogical
  position?: ParsedSmartExitOrder['position']
  status?: OrderStatus
  logs?: SmartExitOrder['logs']
}

const ConditionContent = ({ logical, position, status, logs }: ConditionContentProps) => {
  const { conditions, op } = logical
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const cancelReasonMessage = status === OrderStatus.OrderStatusCancelled ? getCancelReasonMessage(logs || []) : null

  if (conditions.length > 1) {
    return (
      <div className="flex flex-col gap-2">
        <div className={`flex gap-3 text-sm ${upToLarge ? 'flex-col items-stretch' : 'flex-row items-center'}`}>
          {conditions.map((c, i) => (
            <React.Fragment key={`${c.field.type}-${i}`}>
              <div className="flex min-w-0 flex-1">
                <ConditionItem condition={c} position={position} />
              </div>
              {i !== conditions.length - 1 && (
                <div className={`rounded-lg bg-white/[0.04] px-2 py-1 ${upToLarge ? 'self-start' : 'self-center'}`}>
                  <span className="shrink-0 text-xs font-medium text-text">
                    {op === ConditionType.And ? 'AND' : 'OR'}
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {cancelReasonMessage && (
          <span className="mt-1 text-xs italic" style={{ color: '#D67300' }}>
            {cancelReasonMessage}
          </span>
        )}
      </div>
    )
  }

  const singleCondition = conditions[0]
  const isTimeCondition = singleCondition?.field.type === 'time'

  const conditionWidth = upToLarge || isTimeCondition ? 'auto' : 'calc(50% - 36px)'

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex" style={{ width: conditionWidth }}>
        {conditions.map((c, i) => (
          <ConditionItem key={`${c.field.type}-${i}`} condition={c} position={position} />
        ))}
      </div>
      {cancelReasonMessage && (
        <span className="text-xs italic" style={{ color: '#D67300' }}>
          {cancelReasonMessage}
        </span>
      )}
    </div>
  )
}

export default ConditionContent
