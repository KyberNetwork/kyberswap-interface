import { rgba } from 'polished'
import styled, { css, keyframes } from 'styled-components'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const VaultPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  flex: 1;
`

export const VaultPageTitle = styled.h1`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin: 0;
`

export const FilterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: stretch;
  `}
`

export const VaultCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  row-gap: 32px;

  & > * {
    opacity: 0;
    animation: ${fadeInUp} 0.4s ease-out forwards;
  }

  ${Array.from({ length: 12 }, (_, i) => `& > *:nth-child(${i + 1}) { animation-delay: ${i * 0.06}s; }`).join('\n  ')}

  @media (prefers-reduced-motion: reduce) {
    & > * {
      opacity: 1;
      animation: none;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    gap: 16px;
  `}
`

export const VaultCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: ${({ theme }) => rgba(theme.background, 0.85)};
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
`

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.white, 0.04)};
  flex-wrap: wrap;
  gap: 8px;
`

export const TokenIconWrapper = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

export const ProtocolTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.subText};
`

// Explore Vaults card body
export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 4px 4px;
`

export const MetricRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
`

export const MetricLabel = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.subText};
`

export const ApyValue = styled.span`
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  color: ${({ theme }) => theme.primary};
`

export const TvlValue = styled.span`
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  color: ${({ theme }) => theme.white2};
`

export const ChartWrapper = styled.div<{ $height?: number }>`
  width: 100%;
  height: ${({ $height }) => $height || 28}px;
`

const buttonBase = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`

export const DepositButton = styled.div<{ $disabled?: boolean }>`
  ${buttonBase}
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  background: transparent;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 0.3 : 0.8)};
    background: ${({ $disabled, theme }) => ($disabled ? 'transparent' : rgba(theme.primary, 0.06))};
  }
`

export const ViewPositionButton = styled.div`
  ${buttonBase}
  border: 1px solid ${({ theme }) => theme.blue3};
  color: ${({ theme }) => theme.blue3};
  background: transparent;

  &:hover {
    background: ${({ theme }) => rgba(theme.blue3, 0.06)};
  }
`

export const WithdrawButton = styled.div<{ $disabled?: boolean }>`
  ${buttonBase}
  border: 1px solid ${({ theme }) => theme.subText};
  color: ${({ theme }) => theme.subText};
  background: transparent;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.3 : 1)};

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 0.3 : 0.8)};
    background: ${({ $disabled, theme }) => ($disabled ? 'transparent' : rgba(theme.subText, 0.06))};
  }
`

export const CardFooter = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: auto;
`

// My Vaults specific
export const InfoRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 16px;
`

export const InfoLabel = styled.span`
  color: ${({ theme }) => theme.gray};
`

export const InfoValue = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`

export const InfoValuePrimary = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.white2};
  font-size: 16px;
`

export const InfoValueSecondary = styled.span`
  font-size: 16px;
  color: ${({ theme }) => theme.gray};
`

export const Disclaimer = styled.div`
  font-size: 14px;
  font-style: italic;
  color: ${({ theme }) => theme.gray};
  text-align: center;
  margin-top: auto;
  padding-top: 24px;
  line-height: 24px;
`

export const MyVaultCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  flex: 1;
`

export const MyVaultFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
`

export const ApyTvlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const FooterMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`

export const FooterMetricLabel = styled.span`
  color: ${({ theme }) => theme.gray};
  font-size: 16px;
`

export const CardFooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const StatusBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => rgba($color, 0.12)};
  white-space: nowrap;
`

export const TxLink = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.blue3};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`
