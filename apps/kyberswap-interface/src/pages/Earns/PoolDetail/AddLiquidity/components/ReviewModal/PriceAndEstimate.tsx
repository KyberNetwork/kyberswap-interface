import { rgba } from 'polished'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import useTheme from 'hooks/useTheme'
import { type ResolvedAddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useReviewData'
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

const LabelText = styled(Text)`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const ValueText = styled(Text)`
  font-weight: 500;
`

const TotalText = styled(Text)`
  font-weight: 500;
`

const RangeBox = styled(HStack)`
  flex: 1 1 0;
  min-width: 0;
  align-items: stretch;
  gap: 0;
  overflow: hidden;
  border-radius: 16px;
  background: ${({ theme }) => theme.tabActive};
`

const RangeLabelBox = styled(Stack)`
  justify-content: center;
  min-width: 72px;
  padding: 8px 12px;
  background: ${({ theme }) => theme.background};
`

const RangeValue = styled(Text)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1 1 0;
  min-width: 0;
  padding: 8px 12px;
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

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  color: ${({ theme }) => theme.subText};
  cursor: pointer;

  :hover {
    filter: brightness(1.12);
  }
`

const formatBpsLabel = (value?: number) => {
  if (value === undefined) return '--'

  return `${parseFloat((((value || 0) * 100) / 10_000).toFixed(2)).toString()}%`
}

const formatPercent = (value?: number) => (value !== undefined ? `${parseFloat(value.toFixed(2)).toString()}%` : '--')

type PriceInfoSectionProps = {
  priceInfo: ResolvedAddLiquidityReviewData['priceInfo']
  onRevertPriceToggle?: () => void
}

type EstimateSectionProps = {
  estimate: ResolvedAddLiquidityReviewData['estimate']
}

export const PriceInfoSection = ({ priceInfo, onRevertPriceToggle }: PriceInfoSectionProps) => {
  const theme = useTheme()

  return (
    <Card gap={16}>
      <HStack align="center" justify="space-between" gap={12}>
        <HStack align="center" gap={6} wrap="wrap">
          <SectionLabel>Current Price</SectionLabel>
          <Text color={theme.text}>
            1 {priceInfo.baseToken?.symbol || '--'} ={' '}
            {formatDisplayNumber(priceInfo.currentPrice, { significantDigits: 8 })}{' '}
            {priceInfo.quoteToken?.symbol || '--'}
          </Text>
        </HStack>

        <IconButton type="button" onClick={onRevertPriceToggle}>
          <RevertPriceIcon width={14} height={14} />
        </IconButton>
      </HStack>

      {priceInfo.isUniV3 ? (
        <HStack gap={12}>
          <RangeBox>
            <RangeLabelBox>
              <LabelText>MIN</LabelText>
            </RangeLabelBox>
            <RangeValue color={theme.text}>{priceInfo.minPrice || '--'}</RangeValue>
          </RangeBox>

          <RangeBox>
            <RangeLabelBox>
              <LabelText>MAX</LabelText>
            </RangeLabelBox>
            <RangeValue color={theme.text}>{priceInfo.maxPrice || '--'}</RangeValue>
          </RangeBox>
        </HStack>
      ) : null}
    </Card>
  )
}

export const EstimateSection = ({ estimate }: EstimateSectionProps) => {
  const theme = useTheme()

  return (
    <Card gap={16}>
      <HStack align="center" justify="space-between">
        <SectionLabel>Est. Liquidity Value</SectionLabel>
        <TotalText color={theme.text}>
          {formatDisplayNumber(estimate.totalUsd || 0, { style: 'currency', significantDigits: 6 })}
        </TotalText>
      </HStack>

      <HStack align="flex-start" gap={12} wrap="wrap">
        {estimate.items?.map(item => (
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
            {formatDisplayNumber(estimate.remainingUsd || 0, { style: 'currency', significantDigits: 6 })}
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
