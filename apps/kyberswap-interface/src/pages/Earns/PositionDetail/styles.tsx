import { rgba } from 'polished'
import { Link } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

import { ReactComponent as IconArrowLeftSvg } from 'assets/svg/ic_left_arrow.svg'

// Shared animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`


export const IconArrowLeft = styled(IconArrowLeftSvg)`
  cursor: pointer;
  color: rgba(250, 250, 250, 1);

  :hover {
    filter: brightness(1.5);
  }
`

// New two-column layout
export const PositionDetailWrapper = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  position: relative;
  align-items: flex-start;
  animation: ${fadeIn} 0.3s ease-out;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
  `}
`

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 2 1 0%;
  min-width: 320px;
  max-width: 480px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 100%;
    min-width: 0;
    width: 100%;
  `}
`

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 3 1 0%;
  min-width: 0;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 12px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

export const DarkCard = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const CardDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
`

// Tab navigation
export const TabMenu = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 12px 12px 0 0;
  overflow: hidden;
`

export const TabItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  color: ${({ active, theme }) => (active ? theme.primary : theme.subText)};
  background: ${({ active, theme }) => (active ? rgba(theme.primary, 0.1) : 'transparent')};
  border-bottom: 2px solid ${({ active, theme }) => (active ? theme.primary : 'transparent')};
  transition: color 0.2s, background 0.2s, border-color 0.2s;

  &:hover {
    color: ${({ active, theme }) => (active ? theme.primary : theme.text)};
  }
`

export const TabDivider = styled.div`
  width: 1px;
  height: 20px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
`

export const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 12px;
  `}
`

export const TabContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  animation: ${fadeIn} 0.25s ease-out;
`

// Dex info badge in header
export const DexInfoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 12px;
  padding: 4px 12px;
  height: 36px;
`

// Claim button (small, outlined green)
export const ClaimButton = styled.button<{ disabled?: boolean }>`
  border: 1px solid ${({ theme }) => theme.primary};
  background: transparent;
  color: ${({ theme }) => theme.primary};
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    filter: brightness(1.2);
  }

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.3;
      cursor: not-allowed;
    `}
`

// Earnings tab chart styles
export const EarningChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

export const TimeSelector = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.08)};
  border-radius: 20px;
  padding: 2px;
`

export const TimeSelectorItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  height: 24px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: ${({ active, theme }) => (active ? theme.text : theme.subText)};
  background: ${({ active, theme }) => (active ? rgba(theme.white, 0.08) : 'transparent')};
  transition: all 0.2s;
`

export const BarChartContainer = styled.div`
  position: relative;
  width: 100%;
  height: 240px;
`

export const DonutChartContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  width: 100%;
  padding: 16px 0;
`

export const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const LegendDot = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ color }) => color};
`

export const AprChartContainer = styled.div`
  width: 100%;
  height: 320px;
  position: relative;
`

// History tab styles
export const HistorySectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => rgba(theme.white, 0.04)};
  width: 100%;
`

export const HistoryCard = styled.div`
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

export const InfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const InfoLeftColumn = styled(InfoColumn)<{ halfWidth?: boolean }>`
  flex: ${({ halfWidth }) => (!halfWidth ? '1 1 35%' : '1 1 50%')};
`

export const InfoRightColumn = styled(InfoColumn)<{ halfWidth?: boolean }>`
  flex: ${({ halfWidth }) => (!halfWidth ? '1 1 65%' : '1 1 50%')};
`

export const InfoSection = styled.div`
  border-radius: 16px;
  padding: 16px 24px;
  border: 1px solid ${({ theme }) => theme.tabActive};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

export const RewardsSection = styled(InfoSection)`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const NextDistribution = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  padding: 8px 12px;
  flex-wrap: wrap;
  gap: 8px;
`

export const RewardDetailInfo = styled.div`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  border-radius: 16px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
`

export const TotalLiquiditySection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1 1 280px;
  border-radius: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.background};
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px;
    gap: 12px;
  `}
`

export const PriceSection = styled.div`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.08)};
`

export const AprSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  flex: 1 1 280px;
  min-width: 0;
  border-radius: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px;
  `}
`

const PriceRangeSection = styled(InfoSection)`
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
`

export const MinPriceSection = styled(PriceRangeSection)`
  border-color: rgba(49, 203, 158, 0.4);
`

export const MaxPriceSection = styled(PriceRangeSection)`
  border-color: rgba(143, 146, 255, 0.6);
`

export const VerticalDivider = styled.div<{ height?: string }>`
  width: 1px;
  height: ${({ height }) => height || '32px'};
  background: ${({ theme }) => theme.tabActive};
`

export const RevertIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  aspect-ratio: 1/1;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  cursor: pointer;

  :hover {
    filter: brightness(0.9);
  }
`

export const PositionActionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 8px 0;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 8px;
    flex-direction: column-reverse;
  `}
`

export const PositionAction = styled.button<{
  outline?: boolean
  outlineDefault?: boolean
  small?: boolean
  disabled?: boolean
  load?: boolean
  mobileAutoWidth?: boolean
}>`
  border-radius: 12px;
  padding: 10px 18px;
  background-color: ${({ theme }) => theme.primary};
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.black};
  display: flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;

  ${({ small }) => small && 'padding: 6px 16px;'}
  ${({ outline, outlineDefault }) => (outlineDefault || outline) && 'background-color: transparent;'}
  ${({ outline, theme }) => outline && `color: ${theme.primary};`}
  ${({ outlineDefault, theme }) =>
    outlineDefault && `color: ${rgba(theme.white, 0.7)}; border-color: ${rgba(theme.white, 0.7)};`}

  ${({ theme, mobileAutoWidth }) =>
    !mobileAutoWidth &&
    theme.mediaWidth.upToSmall`
      width: 100%;
      justify-content: center;
    `}

  :hover {
    filter: brightness(1.2);
  }

  ${({ disabled, theme }) =>
    disabled &&
    `cursor: not-allowed; color: ${rgba(
      theme.white,
      0.4,
    )}; border-color: transparent; filter: brightness(0.6) !important; background-color: ${rgba(theme.white, 0.12)};`}
  ${({ load }) => load && `cursor: not-allowed; filter: brightness(0.6) !important;`}
`

export const ChartWrapper = styled.div`
  display: flex;
  width: 100%;
  padding: 0 32px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `}
`

export const ChartFadeIn = styled.div<{ $visible?: boolean }>`
  ${({ $visible }) =>
    !$visible
      ? css`
          visibility: hidden;
          height: 0;
          overflow: hidden;
        `
      : css`
          animation: ${fadeIn} 0.4s ease-out;
        `}
`

export const ChartPlaceholder = styled.div`
  position: relative;
`

export const ChartSkeletonWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: -1;
`

export const PositionHeader = styled.div`
  display: flex;
  gap: 8px;
  animation: ${fadeIn} 0.3s ease-out;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `}
`

export const MigrationLiquidityRecommend = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 10px 20px;
  align-items: center;
  font-size: 14px;
  gap: 8px;
  row-gap: 4px;
  border-radius: 16px;
  background: rgba(15, 170, 162, 0.2);
  animation: ${slideDown} 0.3s ease-out;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    row-gap: 2px;
  `}
`

export const ShareButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  padding: 6px 8px 6px 6px;
  transition: all 0.1s ease-in-out;
  cursor: pointer;

  :hover {
    filter: brightness(1.2);
  }

  :active {
    filter: brightness(1.05);
  }
`

export const RewardLink = styled(Link)`
  display: flex;
  gap: 4px;
  border-bottom: 1px dashed ${({ theme }) => theme.text};
`

export const RemoveLiquidityDropdownWrapper = styled.div`
  position: relative;
  display: inline-block;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `}
`

export const DropdownButton = styled(PositionAction)<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
`

export const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  border-radius: 12px;
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  flex-direction: column;
  gap: 4px;
  width: max-content;
  z-index: 1000;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
  animation: ${({ isOpen }) => (isOpen ? slideDown : 'none')} 0.2s ease-out;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    right: 50%;
    transform: translateX(50%);
  `}
`

// Compact MIN/MAX price box matching the Figma design
// Two-part box: label (darker bg, left rounded) + value (lighter bg, right rounded)
export const CompactPriceBox = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
`

export const CompactPriceLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  flex-shrink: 0;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  border-radius: 12px 0 0 12px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
`

export const CompactPriceValue = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  border-radius: 0 12px 12px 0;
  padding: 4px 8px;
`

export const PricePercentage = styled.span`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: ${({ theme }) => theme.subText};
`

export const DropdownMenuItem = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.1)};
  color: ${({ theme }) => rgba(theme.white, 0.7)};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;

  &:hover:not(:disabled) {
    background: ${({ theme }) => rgba(theme.background, 0.9)};
    border-color: ${({ theme }) => rgba(theme.white, 0.2)};
    color: ${({ theme }) => theme.white};
  }

  ${({ disabled }) =>
    disabled &&
    `
      cursor: not-allowed;
      opacity: 0.5;
      filter: brightness(0.6);
    `}
`
