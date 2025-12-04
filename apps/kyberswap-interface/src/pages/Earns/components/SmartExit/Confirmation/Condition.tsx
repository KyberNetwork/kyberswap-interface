import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { Box, Flex, Text } from 'rebass'

import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { Badge, ImageContainer } from 'pages/Earns/UserPositions/styles'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  ParsedPosition,
  PriceCondition,
  SelectedMetric,
  TimeCondition,
} from 'pages/Earns/types'

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

  const feeYieldCondition1 = metric1.condition as FeeYieldCondition
  const priceCondition1 = metric1.condition as PriceCondition
  const timeCondition1 = metric1.condition as TimeCondition
  const feeYieldCondition2 = metric2?.condition as FeeYieldCondition
  const priceCondition2 = metric2?.condition as PriceCondition
  const timeCondition2 = metric2?.condition as TimeCondition

  return (
    <>
      <Flex mt="1rem" alignItems="center" flexWrap="wrap">
        <Trans>Exit</Trans>
        <Flex mx="12px" alignItems="center">
          <ImageContainer>
            <TokenLogo src={position?.token0.logo} />
            <TokenLogo src={position?.token1.logo} translateLeft />
            <TokenLogo src={position.chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <Text mr="8px">
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
        {metric1.metric === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition1}%</Trans>}
        {metric1.metric === Metric.Time && (
          <>
            <Text>{timeCondition1.condition.charAt(0).toUpperCase() + timeCondition1.condition.slice(1)}</Text>
            <Text>{dayjs(timeCondition1.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
          </>
        )}
        {metric1.metric === Metric.PoolPrice && (
          <>
            <Text>
              <Trans>Pool price is between</Trans>
            </Text>
            <Text>
              {priceCondition1.gte} and {priceCondition1.lte} {position.token0.symbol}/{position.token1.symbol}
            </Text>
          </>
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

            {metric2.metric === Metric.FeeYield && <Trans>The fee yield ≥ {feeYieldCondition2}%</Trans>}
            {metric2.metric === Metric.Time && (
              <>
                <Text>{timeCondition2.condition.charAt(0).toUpperCase() + timeCondition2.condition.slice(1)}</Text>
                <Text mt="6px">{dayjs(timeCondition2.time).format('DD/MM/YYYY HH:mm:ss')}</Text>
              </>
            )}
            {metric2.metric === Metric.PoolPrice && (
              <>
                <Text>
                  <Trans>Pool price is between</Trans>
                </Text>
                <Text mt="6px">
                  {priceCondition2.gte} and {priceCondition2.lte} {position.token0.symbol}/{position.token1.symbol}
                </Text>
              </>
            )}
          </>
        )}
      </Box>
    </>
  )
}
