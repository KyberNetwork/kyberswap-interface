import { Token } from '@kyber/schema'
import { Fragment } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as KyberLogo } from 'assets/svg/kyber/kyber_logo.svg'
import { HStack, Stack } from 'components/Stack'
import TokenLogo from 'components/TokenLogo'
import { AddLiquidityReviewData } from 'pages/Earns/PoolDetail/AddLiquidity/hooks/useAddLiquidityReviewData'
import { formatDisplayNumber } from 'utils/numbers'

const FlowRow = styled(HStack)`
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: stretch;
  `}
`

const AssetCard = styled(Stack)`
  position: relative;
  z-index: 1;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: #171717;
`

const AmountText = styled(Text)`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const ValueText = styled(Text)`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  text-align: center;
`

const AssetMain = styled(HStack)`
  align-items: center;
  padding: 8px 16px;
`

const AssetFooter = styled(Stack)`
  justify-content: center;
  padding: 8px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`

const AssetRow = styled(HStack)`
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  width: 100%;
`

const AssetToken = styled(HStack)`
  align-items: center;
  gap: 4px;
  min-width: 0;
`

const Divider = styled(Text)`
  margin: 0;
  color: ${({ theme }) => theme.subText};
`

const MoreBadge = styled(HStack)`
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
`

const StepTrack = styled(Stack)`
  position: relative;
  flex: 1;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 100%;
    min-height: 80px;
  `}
`

const TrackLine = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  top: 50%;
  height: 1px;
  background: ${({ theme }) => theme.border};
  opacity: 0.6;

  &::after {
    content: '';
    position: absolute;
    right: 0px;
    top: 50%;
    transform: translateY(-50%);
    border-left: 6px solid ${({ theme }) => theme.border};
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 50%;
    right: auto;
    top: -8px;
    bottom: -8px;
    width: 1px;
    height: auto;
    transform: translateX(-50%);

    &::after {
      left: 50%;
      right: auto;
      top: auto;
      bottom: 8px;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 6px solid ${({ theme }) => theme.border};
      border-bottom: 0;
    }
  `}
`

const TrackStartDot = styled.div`
  position: absolute;
  left: -4px;
  top: 50%;
  z-index: 1;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.border};
  opacity: 0.85;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    left: 50%;
    top: -4px;
    transform: translateX(-50%);
  `}
`

const StepPill = styled(HStack)`
  position: relative;
  z-index: 1;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(21, 21, 24, 0.92);
`

const StepText = styled(Text)`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

type RouteTokenItem = {
  token: Token
  amount?: number
}

export interface AddLiquidityRoutePreviewProps {
  pool?: {
    token0: Token
    token1: Token
  } | null
  reviewData?: AddLiquidityReviewData | null
  inputTokens?: Token[]
}

const formatUsd = (value?: number | null, fallbackZero = false) => {
  if (value !== null && value !== undefined && value > 0) {
    return `~ ${formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })}`
  }

  if (fallbackZero) {
    return `~ ${formatDisplayNumber(0, { style: 'currency', significantDigits: 6 })}`
  }

  return '~ --'
}

const getTokenLogo = (token?: Token | null) => {
  if (!token) return ''

  const tokenWithLogoUri = token as Token & { logoURI?: string }
  return tokenWithLogoUri.logo || tokenWithLogoUri.logoURI || ''
}

const renderAssetItems = (items: RouteTokenItem[], emptyText?: string) => {
  if (!items.length) return <AmountText>{emptyText}</AmountText>

  const visibleItems = items.slice(0, 2)
  const remainingCount = items.length - visibleItems.length

  return (
    <AssetRow>
      {visibleItems.map((item, index) => (
        <Fragment key={`${item.token.address}-${index}`}>
          {index > 0 ? <Divider>|</Divider> : null}
          <AssetToken>
            <TokenLogo src={getTokenLogo(item.token)} size={16} />
            <AmountText>
              {item.amount && item.amount > 0 ? `${formatDisplayNumber(item.amount, { significantDigits: 6 })} ` : ''}
              {item.token.symbol}
            </AmountText>
          </AssetToken>
        </Fragment>
      ))}
      {remainingCount > 0 ? <MoreBadge>+{remainingCount} more</MoreBadge> : null}
    </AssetRow>
  )
}

export default function AddLiquidityRoutePreview({
  pool,
  reviewData,
  inputTokens = [],
}: AddLiquidityRoutePreviewProps) {
  const inputItems: RouteTokenItem[] = reviewData?.zapInItems?.length
    ? reviewData.zapInItems.map(item => ({ token: item.token, amount: item.amount }))
    : inputTokens.map(token => ({
        token,
      }))
  const outputItems = (reviewData?.estimate?.items || []).filter(item => item.amount > 0)
  const fallbackOutputItems: RouteTokenItem[] =
    outputItems.length > 0 ? outputItems : pool ? [{ token: pool.token0 }, { token: pool.token1 }] : []
  const showZeroInputUsd = Boolean(inputItems.length)
  const showZeroOutputUsd = Boolean(fallbackOutputItems.length)

  return (
    <FlowRow>
      <AssetCard>
        <AssetMain>{renderAssetItems(inputItems.map(item => ({ token: item.token, amount: item.amount })))}</AssetMain>
        <AssetFooter>
          <ValueText>{formatUsd(reviewData?.totalInputUsd, showZeroInputUsd)}</ValueText>
        </AssetFooter>
      </AssetCard>

      <StepTrack>
        <TrackLine />
        <TrackStartDot />
        <StepPill>
          <KyberLogo width={18} height={18} />
          <StepText>Kyber Zap</StepText>
        </StepPill>
      </StepTrack>

      <AssetCard>
        <AssetMain>{renderAssetItems(fallbackOutputItems)}</AssetMain>
        <AssetFooter>
          <ValueText>{formatUsd(reviewData?.estimate?.totalUsd, showZeroOutputUsd)}</ValueText>
        </AssetFooter>
      </AssetCard>
    </FlowRow>
  )
}
