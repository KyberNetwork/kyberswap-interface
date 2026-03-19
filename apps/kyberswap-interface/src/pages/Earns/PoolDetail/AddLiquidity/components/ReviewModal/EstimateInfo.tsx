import { PartnerFeeAction, Pool, ProtocolFeeAction, RefundAction, ZapAction, ZapRouteDetail } from '@kyber/schema'
import { getZapImpact } from '@kyber/utils'
import { rgba } from 'polished'
import { useMemo } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { getOutputTokenItems } from 'pages/Earns/PoolDetail/AddLiquidity/utils'
import { formatDisplayNumber } from 'utils/numbers'

const Card = styled(Stack)`
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.buttonGray};
`

const SectionLabel = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const ValueText = styled(Text)`
  font-weight: 500;
`

const TotalText = styled(Text)`
  font-weight: 500;
`

const EstimateTokenBox = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 4px;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.border};
`

const MetricCard = styled(Stack)`
  flex: 1 1 0;
  min-width: 0;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.tabActive};
`

const MetricTitle = styled(Text)`
  width: fit-content;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  border-bottom: 1px dotted ${({ theme }) => rgba(theme.border, 0.24)};
`

type EstimateInfoProps = {
  pool: Pool
  route: ZapRouteDetail
  slippage?: number
}

type Estimate = {
  totalUsd: number
  slippage?: number
  items: ReturnType<typeof getOutputTokenItems>
  remainingUsd: number
  zapFeePercent: number
  zapImpact: {
    display: string
  } | null
}

const formatBpsLabel = (value?: number) => {
  if (value === undefined) return '--'

  return `${parseFloat((((value || 0) * 100) / 10_000).toFixed(2)).toString()}%`
}

const formatPercent = (value?: number) => (value !== undefined ? `${parseFloat(value.toFixed(2)).toString()}%` : '--')

const getRouteAction = <T,>(route: ZapRouteDetail, type: ZapAction) =>
  route.zapDetails.actions.find(action => action.type === type) as T | undefined

const getRemainingUsd = (refundAction?: RefundAction) =>
  refundAction?.refund.tokens.reduce((total, token) => total + Number(token.amountUsd || 0), 0) || 0

const buildEstimate = ({
  pool,
  route,
  slippage,
}: {
  pool: Pool
  route: ZapRouteDetail
  slippage?: number
}): Estimate => {
  const refundAction = getRouteAction<RefundAction>(route, ZapAction.REFUND)
  const protocolFeeAction = getRouteAction<ProtocolFeeAction>(route, ZapAction.PROTOCOL_FEE)
  const partnerFeeAction = getRouteAction<PartnerFeeAction>(route, ZapAction.PARTNET_FEE)
  const items = getOutputTokenItems(pool, route)
  const estimatedItemsUsd = items.reduce((total, item) => total + item.usdValue, 0)
  const zapImpact = getZapImpact(route.zapDetails.priceImpact, route.zapDetails.suggestedSlippage || 100)

  return {
    totalUsd: Number(route.positionDetails.addedAmountUsd || estimatedItemsUsd || 0),
    slippage,
    items,
    remainingUsd: getRemainingUsd(refundAction),
    zapFeePercent:
      (((protocolFeeAction?.protocolFee.pcm || 0) + (partnerFeeAction?.partnerFee.pcm || 0)) / 100_000) * 100,
    zapImpact: zapImpact
      ? {
          display: zapImpact.display,
        }
      : null,
  }
}

const EstimateInfo = ({ pool, route, slippage }: EstimateInfoProps) => {
  const theme = useTheme()
  const estimate = useMemo(() => buildEstimate({ pool, route, slippage }), [pool, route, slippage])

  return (
    <Card gap={16}>
      <HStack align="center" justify="space-between">
        <SectionLabel>Est. Liquidity Value</SectionLabel>
        <TotalText color={theme.text}>
          {formatDisplayNumber(estimate.totalUsd, { style: 'currency', significantDigits: 6 })}
        </TotalText>
      </HStack>

      <HStack align="flex-start" gap={12} wrap="wrap">
        {estimate.items.map(item => (
          <EstimateTokenBox key={item.token.address}>
            <HStack minWidth={0} align="center" gap={6}>
              <TokenLogo src={item.token.logo} size={16} />
              <ValueText color={theme.text}>
                {formatDisplayNumber(item.amount, { significantDigits: 8 })} {item.token.symbol}
              </ValueText>
            </HStack>
            <SectionLabel>
              ~{formatDisplayNumber(item.usdValue, { style: 'currency', significantDigits: 6 })}
            </SectionLabel>
          </EstimateTokenBox>
        ))}
      </HStack>

      <Divider />

      <HStack align="center" justify="space-between">
        <MetricTitle as="div">Max Slippage</MetricTitle>
        <ValueText color={theme.text}>{formatBpsLabel(estimate.slippage)}</ValueText>
      </HStack>

      <HStack align="stretch" gap={12} wrap="wrap">
        <MetricCard>
          <MetricTitle>Est. Remaining</MetricTitle>
          <ValueText color={theme.text}>
            {formatDisplayNumber(estimate.remainingUsd, { style: 'currency', significantDigits: 6 })}
          </ValueText>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Zap Impact</MetricTitle>
          <ValueText color={theme.text}>{estimate.zapImpact?.display || '--'}</ValueText>
        </MetricCard>

        <MetricCard>
          <MetricTitle>Zap Fee</MetricTitle>
          <ValueText color={theme.text}>{formatPercent(estimate.zapFeePercent)}</ValueText>
        </MetricCard>
      </HStack>
    </Card>
  )
}

export default EstimateInfo
