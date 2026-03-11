import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import React from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
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
  const theme = useTheme()
  const c = condition

  if (c.field.type === 'fee_yield') {
    return <FeeYieldProgress targetYield={c.field.value.gte} currentYield={position?.earningFeeYield} />
  }

  if (c.field.type === 'pool_price') {
    const isLte = !!c.field.value.lte
    const targetPrice = c.field.value.gte || c.field.value.lte
    // Guard against invalid target price (undefined, 0, or NaN)
    if (!targetPrice || !isFinite(targetPrice)) {
      return null
    }
    return <PoolPriceChart targetPrice={targetPrice} currentPrice={position?.priceRange?.current} isLte={isLte} />
  }

  if (c.field.type === 'time') {
    return (
      <Text color={theme.subText} fontSize="12px">
        {c.field.value.lte > 0 && c.field.value.lte < MAX_VALID_TIMESTAMP ? (
          <>
            <Trans>Before</Trans>{' '}
            <Text as="span" color={theme.text}>
              {dayjs(c.field.value.lte * 1000).format('MMMM DD, YYYY HH:mm')} UTC.
            </Text>
          </>
        ) : null}

        {c.field.value.gte > 0 && c.field.value.gte < MAX_VALID_TIMESTAMP ? (
          <>
            <Trans>After</Trans>{' '}
            <Text as="span" color={theme.text}>
              {dayjs(c.field.value.gte * 1000).format('MMMM DD, YYYY HH:mm')} UTC.
            </Text>
          </>
        ) : null}
      </Text>
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
  const theme = useTheme()
  const { conditions, op } = logical
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)

  const cancelReasonMessage = status === OrderStatus.OrderStatusCancelled ? getCancelReasonMessage(logs || []) : null

  // If there are multiple conditions, display them horizontally (desktop) or vertically (mobile)
  if (conditions.length > 1) {
    return (
      <Flex flexDirection="column" sx={{ gap: '8px' }}>
        <Flex
          flexDirection={upToLarge ? 'column' : 'row'}
          alignItems={upToLarge ? 'stretch' : 'center'}
          sx={{ gap: '12px', fontSize: '14px' }}
        >
          {conditions.map((c, i) => (
            <React.Fragment key={`${c.field.type}-${i}`}>
              <Flex flex="1" minWidth="0">
                <ConditionItem condition={c} position={position} />
              </Flex>
              {i !== conditions.length - 1 && (
                <Box
                  sx={{
                    background: rgba(theme.white, 0.04),
                    padding: '4px 8px',
                    borderRadius: '8px',
                    alignSelf: upToLarge ? 'flex-start' : 'center',
                  }}
                >
                  <Text fontWeight={500} color={theme.text} fontSize={12} flexShrink={0}>
                    {op === ConditionType.And ? 'AND' : 'OR'}
                  </Text>
                </Box>
              )}
            </React.Fragment>
          ))}
        </Flex>
        {cancelReasonMessage && (
          <Text color="#D67300" fontSize="12px" fontStyle="italic" mt="4px">
            {cancelReasonMessage}
          </Text>
        )}
      </Flex>
    )
  }

  // Single condition
  const singleCondition = conditions[0]
  const isTimeCondition = singleCondition?.field.type === 'time'

  // For fee_yield and pool_price: display with same width as each condition in multi-condition layout
  // When there are 2 conditions: each takes (100% - gap - operator - gap) / 2
  // Operator box ~48px + 2*12px gaps = ~72px total, so each condition ≈ calc(50% - 36px)
  // For time condition: no width limit needed
  // On mobile: full width
  const conditionWidth = upToLarge || isTimeCondition ? 'auto' : 'calc(50% - 36px)'

  return (
    <Flex flexDirection="column" sx={{ gap: '8px', fontSize: '14px' }}>
      <Flex sx={{ width: conditionWidth }}>
        {conditions.map((c, i) => (
          <ConditionItem key={`${c.field.type}-${i}`} condition={c} position={position} />
        ))}
      </Flex>
      {cancelReasonMessage && (
        <Text color="#D67300" fontSize="12px" fontStyle="italic">
          {cancelReasonMessage}
        </Text>
      )}
    </Flex>
  )
}

export default ConditionContent
