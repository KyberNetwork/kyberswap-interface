import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { Box, Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { calculateExpectedAmounts } from 'pages/Earns/components/SmartExit/Confirmation/calculateExpectedAmounts'
import { ConditionType, Metric, ParsedPosition, PriceCondition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function ExpectedAmount({
  selectedMetrics,
  position,
  conditionType,
}: {
  selectedMetrics: SelectedMetric[]
  position: ParsedPosition
  conditionType: ConditionType
}) {
  const theme = useTheme()

  const expectedAmounts = useMemo(() => {
    // Check if any metric is pool price
    const poolPriceMetrics = selectedMetrics.filter(m => m.metric === Metric.PoolPrice)
    const otherMetrics = selectedMetrics.filter(m => m.metric !== Metric.PoolPrice)
    if (poolPriceMetrics.length === 0 || otherMetrics.length > 0) return null

    // If there are multiple pool price conditions, merge them
    let mergedCondition: PriceCondition | null = null

    if (poolPriceMetrics.length === 1) {
      mergedCondition = poolPriceMetrics[0].condition as PriceCondition
    } else if (poolPriceMetrics.length === 2) {
      // When using AND: take the intersection (more restrictive range)
      // When using OR: take the union (wider range)
      const condition1 = poolPriceMetrics[0].condition as PriceCondition
      const condition2 = poolPriceMetrics[1].condition as PriceCondition

      if (conditionType === ConditionType.And) {
        // Intersection: higher min, lower max
        mergedCondition = {
          gte: Math.max(parseFloat(condition1.gte), parseFloat(condition2.gte)).toString(),
          lte: Math.min(parseFloat(condition1.lte), parseFloat(condition2.lte)).toString(),
        }
      } else {
        // Union: lower min, higher max
        mergedCondition = {
          gte: Math.min(parseFloat(condition1.gte), parseFloat(condition2.gte)).toString(),
          lte: Math.max(parseFloat(condition1.lte), parseFloat(condition2.lte)).toString(),
        }
      }
    }

    return mergedCondition ? calculateExpectedAmounts(position, mergedCondition) : null
  }, [position, selectedMetrics, conditionType])

  return (
    expectedAmounts && (
      <Box
        sx={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: theme.buttonBlack,
          marginTop: '1rem',
        }}
      >
        <Text fontSize={14} color={theme.subText} mb="12px">
          <Trans>Estimated balance when exit</Trans>
        </Text>

        <Flex justifyContent="space-between" mb="12px">
          <Flex flexDirection="column" flex={1}>
            <Text fontSize={12} color={theme.subText} mb="8px">
              Min
            </Text>
            <Flex alignItems="center" sx={{ gap: '8px' }} mb="8px">
              <TokenLogo src={position.token0.logo} size={16} />
              <Text fontSize={14}>
                {formatDisplayNumber(expectedAmounts.minAmount0, { significantDigits: 6 })} {position.token0.symbol}
              </Text>
            </Flex>
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <TokenLogo src={position.token1.logo} size={16} />
              <Text fontSize={14}>
                {formatDisplayNumber(expectedAmounts.minAmount1, { significantDigits: 6 })} {position.token1.symbol}
              </Text>
            </Flex>
          </Flex>

          <Flex flexDirection="column" flex={1}>
            <Text fontSize={12} color={theme.subText} mb="8px">
              Max
            </Text>
            <Flex alignItems="center" sx={{ gap: '8px' }} mb="8px">
              <TokenLogo src={position.token0.logo} size={16} />
              <Text fontSize={14}>
                {formatDisplayNumber(expectedAmounts.maxAmount0, { significantDigits: 6 })} {position.token0.symbol}
              </Text>
            </Flex>
            <Flex alignItems="center" sx={{ gap: '8px' }}>
              <TokenLogo src={position.token1.logo} size={16} />
              <Text fontSize={14}>
                {formatDisplayNumber(expectedAmounts.maxAmount1, { significantDigits: 6 })} {position.token1.symbol}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    )
  )
}
