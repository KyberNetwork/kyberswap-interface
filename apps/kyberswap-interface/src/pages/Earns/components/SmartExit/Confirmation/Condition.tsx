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
import { ConditionType, Metric, ParsedPosition, SelectedMetric } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

export default function Condition({
  position,
  selectedMetrics,
  conditionType,
}: {
  position: ParsedPosition
  selectedMetrics: SelectedMetric[]
  conditionType: ConditionType
}) {
  const theme = useTheme()

  const [metric1, metric2] = selectedMetrics

  const feeYieldCondition1 = getFeeYieldCondition(metric1)
  const priceCondition1 = getPriceCondition(metric1)
  const timeCondition1 = getTimeCondition(metric1)
  const feeYieldCondition2 = metric2 ? getFeeYieldCondition(metric2) : null
  const priceCondition2 = metric2 ? getPriceCondition(metric2) : null
  const timeCondition2 = metric2 ? getTimeCondition(metric2) : null

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
          <Badge>Fee {position?.pool.fee}%</Badge>
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
        {metric1.metric === Metric.PoolPrice && priceCondition1 && (
          <Text>
            <Trans>Pool price is</Trans> {priceCondition1.lte ? '≤' : '≥'}{' '}
            {formatDisplayNumber(priceCondition1.lte || priceCondition1.gte, { significantDigits: 6 })}{' '}
            {position.token0.symbol}/{position.token1.symbol}
          </Text>
        )}
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
              <Text mt="6px">
                <Trans>Pool price is</Trans> {priceCondition2.lte ? '≤' : '≥'}{' '}
                {formatDisplayNumber(priceCondition2.lte || priceCondition2.gte, { significantDigits: 6 })}{' '}
                {position.token0.symbol}/{position.token1.symbol}
              </Text>
            )}
          </>
        )}
      </Box>
    </>
  )
}
