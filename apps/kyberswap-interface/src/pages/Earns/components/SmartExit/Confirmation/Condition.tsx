import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { Box, Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { Badge, ImageContainer } from 'pages/Earns/UserPositions/styles'
import {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
} from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { ConditionType, Metric, ParsedPosition, PriceCondition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function Condition({
  position,
  selectedMetrics,
  conditionType,
  revertPrice = false,
}: {
  position: ParsedPosition
  selectedMetrics: SelectedMetric[]
  conditionType: ConditionType
  revertPrice?: boolean
}) {
  const theme = useTheme()

  const [metric1, metric2] = selectedMetrics

  const feeYieldCondition1 = getFeeYieldCondition(metric1)
  const priceCondition1 = getPriceCondition(metric1)
  const timeCondition1 = getTimeCondition(metric1)
  const feeYieldCondition2 = metric2 ? getFeeYieldCondition(metric2) : null
  const priceCondition2 = metric2 ? getPriceCondition(metric2) : null
  const timeCondition2 = metric2 ? getTimeCondition(metric2) : null

  const baseSymbol = revertPrice ? position.token1.symbol : position.token0.symbol
  const quoteSymbol = revertPrice ? position.token0.symbol : position.token1.symbol

  // Stored `priceCondition` is always in forward (token0/token1) domain.
  // In revert mode we flip the comparator and invert the price value for display only.
  const renderPricePhrase = (priceCondition: PriceCondition) => {
    const storedIsLte = !!priceCondition.lte
    const storedValue = priceCondition.lte || priceCondition.gte || ''
    const displayIsLte = revertPrice ? !storedIsLte : storedIsLte
    const forwardNum = parseFloat(storedValue)
    const displayValue = revertPrice && isFinite(forwardNum) && forwardNum > 0 ? 1 / forwardNum : forwardNum
    return (
      <>
        <Trans>Pool price is</Trans> {displayIsLte ? '≤' : '≥'}{' '}
        {formatDisplayNumber(displayValue, { significantDigits: 6 })} {baseSymbol}/{quoteSymbol}
      </>
    )
  }

  return (
    <>
      <Flex mt="1rem" alignItems="center" flexWrap="wrap">
        <Trans>Remove</Trans>
        <Flex
          mx="8px"
          alignItems="center"
          sx={{ borderRadius: '16px', background: rgba(theme.white, 0.04), gap: '4px', padding: '8px 12px' }}
        >
          <ImageContainer>
            <TokenLogo src={position?.token0.logo} />
            <TokenLogo src={position?.token1.logo} translateLeft />
            <TokenLogo src={position.chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <Text>
            {position.token0.symbol}/{position.token1.symbol}
          </Text>
          <Badge>Fee {formatDisplayNumber(position?.pool.fee, { significantDigits: 4 })}%</Badge>
        </Flex>
        <Trans>When</Trans>
      </Flex>

      <Box
        sx={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: `${theme.primary}22`,
          marginTop: '1rem',
        }}
      >
        {metric1.metric === Metric.FeeYield && feeYieldCondition1 && (
          <Trans>The fee yield ≥ {feeYieldCondition1}%</Trans>
        )}
        {metric1.metric === Metric.Time && timeCondition1 && timeCondition1.time && (
          <>
            <Text>{timeCondition1.condition.charAt(0).toUpperCase() + timeCondition1.condition.slice(1)}</Text>
            <Text>{dayjs(timeCondition1.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
          </>
        )}
        {metric1.metric === Metric.PoolPrice && priceCondition1 && <Text>{renderPricePhrase(priceCondition1)}</Text>}
        {metric2 && (
          <>
            <Flex alignItems="center" sx={{ gap: '1rem' }} my="8px">
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
              {conditionType === ConditionType.And ? <Trans>And</Trans> : <Trans>Or</Trans>}
              <Box
                sx={{
                  height: '1px',
                  borderBottom: `1px dashed ${theme.border}`,
                  flex: 1,
                }}
              />
            </Flex>

            {metric2.metric === Metric.FeeYield && feeYieldCondition2 && (
              <Trans>The fee yield ≥ {feeYieldCondition2}%</Trans>
            )}
            {metric2.metric === Metric.Time && timeCondition2 && timeCondition2.time && (
              <>
                <Text>{timeCondition2.condition.charAt(0).toUpperCase() + timeCondition2.condition.slice(1)}</Text>
                <Text mt="6px">{dayjs(timeCondition2.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
              </>
            )}
            {metric2.metric === Metric.PoolPrice && priceCondition2 && (
              <Text mt="6px">{renderPricePhrase(priceCondition2)}</Text>
            )}
          </>
        )}
      </Box>
    </>
  )
}
