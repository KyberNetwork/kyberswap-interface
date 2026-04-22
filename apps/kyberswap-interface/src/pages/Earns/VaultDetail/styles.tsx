import { rgba } from 'polished'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'

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

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
`

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  flex: 1;
  animation: ${fadeIn} 0.25s ease-out both;
  ${reducedMotion}
`

export const BackArrow = styled(IconArrowLeftSvg)`
  width: 24px;
  height: 24px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  flex-shrink: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
    transform: translateX(-2px);
  }

  ${reducedMotion}
`

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.35s ease-out both;
  ${reducedMotion}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 10px;
  `}
`

export const TokenStack = styled.div`
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 28px;
    height: 28px;
  `}
`

export const HeaderTitle = styled.h1`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
  color: ${({ theme }) => theme.white2};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 20px;
    line-height: 24px;
  `}
`

export const HeaderTitleMuted = styled.span`
  color: ${({ theme }) => theme.subText};
  font-weight: 400;
`

export const HeaderApy = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-left: 4px;
`

export const HeaderApyValue = styled.span`
  font-size: 24px;
  font-weight: 500;
  line-height: 28px;
  color: ${({ theme }) => theme.primary};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 20px;
    line-height: 24px;
  `}
`

export const HeaderApyLabel = styled.span`
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.subText};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    line-height: 20px;
  `}
`

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 480px;
  gap: 16px;
  width: 100%;
  align-items: flex-start;

  & > * {
    opacity: 0;
    animation: ${fadeInUp} 0.4s ease-out forwards;
  }
  & > *:nth-child(1) {
    animation-delay: 0.08s;
  }
  & > *:nth-child(2) {
    animation-delay: 0.16s;
  }

  @media (prefers-reduced-motion: reduce) {
    & > * {
      opacity: 1;
      animation: none;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: minmax(0, 1fr);
  `}
`

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  width: 100%;
`

export const ChartsCard = styled(Card)`
  padding: 16px;
  gap: 24px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 14px;
    gap: 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    padding: 12px;
    gap: 18px;
    border-radius: 10px;
  `}
`

export const VaultMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.white, 0.04)};
  flex-wrap: wrap;
`

export const VaultMetaLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

export const TokenIconWrapperSm = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`

export const VaultName = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.white2};
`

export const VaultNameMuted = styled.span`
  color: ${({ theme }) => theme.gray};
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

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    font-size: 12px;
    line-height: 16px;
  `}
`

export const ChartsBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 24px;
  `}
`

export const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 12px;
  `}
`

export const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

export const ChartTitle = styled.span`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.white2};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
    line-height: 22px;
  `}
`

export const PeriodTabs = styled.div`
  display: flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
  height: 28px;
  border-radius: 20px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.08)};
`

export const PeriodTab = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 24px;
  padding: 0 12px;
  border: none;
  border-radius: 20px;
  background: ${({ $active, theme }) => ($active ? rgba(theme.white, 0.08) : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.text : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
  }

  ${reducedMotion}
`

export const ChartBox = styled.div`
  width: 100%;
  animation: ${fadeIn} 0.35s ease-out both;
  ${reducedMotion}
`

export const HowItWorks = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.subText};
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
    line-height: 20px;
  `}
`

export const HowItWorksLabel = styled.span`
  color: ${({ theme }) => theme.gray};
`

// --- Deposit / Withdraw placeholder card --- //

export const ActionCard = styled(Card)`
  overflow: hidden;
  min-height: 420px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-height: 320px;
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    min-height: 280px;
    border-radius: 10px;
  `}
`

export const ActionTabs = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.white, 0.04)};
`

export const ActionTab = styled.button<{ $active?: boolean }>`
  flex: 1;
  height: 48px;
  padding: 12px 20px;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.primary : 'transparent')};
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.primary : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => rgba(theme.white, 0.02)};
  }

  ${reducedMotion}
`

export const ActionTabDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
`

export const ActionPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 320px;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  font-style: italic;
  line-height: 20px;
  color: ${({ theme }) => theme.gray};
  animation: ${fadeIn} 0.25s ease-out both;
  ${reducedMotion}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    min-height: 220px;
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    min-height: 180px;
    padding: 20px 16px;
  `}
`
