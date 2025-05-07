import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

import positionsBg from 'assets/banners/positions_background.png'
import { ReactComponent as IconCurrentPrice } from 'assets/svg/earn/ic_position_current_price.svg'
import { PoolPageWrapper, TableBody, TableHeader, TableWrapper } from 'pages/Earns/PoolExplorer/styles'

export const PositionPageWrapper = styled(PoolPageWrapper)`
  padding: 24px 6rem 62px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 24px 6rem 60px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const PositionRow = styled(Link)`
  display: grid;
  grid-template-columns:
    minmax(260px, 2fr) /* Position */
    minmax(80px, 1fr) /* Value */
    minmax(90px, 1fr) /* est. APR */
    minmax(100px, 1fr) /* Unclaimed fees */
    minmax(120px, 1fr) /* Unclaimed rewards */
    24px /* Spacer column for better visual separation */
    minmax(150px, 1.5fr) /* Balance */
    minmax(160px, 1.5fr) /* Price range */
    minmax(75px, auto); /* Actions */
  grid-template-rows: 1fr;
  padding: 16px 28px;
  row-gap: 8px;
  text-decoration: none;
  color: inherit !important;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-content: flex-start;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 1fr 1fr;
    border-radius: 20px;
    background: ${rgba(theme.background, 0.8)};
    margin-bottom: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    flex-direction: column;
    row-gap: 16px;
    padding: 16px;
    background: ${rgba(theme.background, 0.8)} !important;
    position: relative;
  `}

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    cursor: pointer;
    background: #31cb9e1a;
  }
`

export const PositionOverview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-column: span 2;
  `}
`

export const ImageContainer = styled.div`
  position: relative;
  top: 2px;
`

export const ChainImage = styled.img`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
  left: -8px;
  top: 4px;
`

export const DexImage = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
`

export enum BadgeType {
  PRIMARY = 'primary',
  WARNING = 'warning',
  SECONDARY = 'secondary',
  ROUNDED = 'rounded',
}

export const Badge = styled.div<{ type?: BadgeType }>`
  border-radius: 30px;
  padding: 4px 12px;
  background-color: ${({ theme }) => rgba(theme.white, 0.04)};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  display: flex;
  align-items: center;

  ${({ type, theme }) => {
    switch (type) {
      case BadgeType.PRIMARY:
        return `
            background-color: ${rgba(theme.primary, 0.2)};
            color: ${theme.primary};
            `
      case BadgeType.WARNING:
        return `
            background-color: ${rgba(theme.warning, 0.2)};
            color: ${theme.warning};
            `
      case BadgeType.SECONDARY:
        return `
            color: ${theme.blue2};
            `
      case BadgeType.ROUNDED:
        return `
            padding: 8px;
            `
      default:
        return ''
    }
  }}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    padding: 4px 9px;
  `}
`

export const PositionValueWrapper = styled.div<{ align?: string }>`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  padding-top: 8px;

  ${({ align }) => (align ? `justify-content: ${align};` : '')}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
    padding-top: 0;
  `}
`

export const PositionActionWrapper = styled(PositionValueWrapper)`
  justify-content: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    position: absolute !important;
    right: 16px;
    top: 10px;
  `}
`

export const PositionValueLabel = styled.p`
  font-size: 14px;
  margin: 0;
  color: ${({ theme }) => theme.subText};
  position: relative;
  top: 1px;
  display: none;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: block;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 16px;
    top: 0;
  `}
`

export const PositionAction = styled.div<{ primary?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 12px;
  background-color: ${({ theme, primary }) => (primary ? rgba(theme.primary, 0.2) : theme.tabActive)};
  color: ${({ theme, primary }) => (primary ? theme.primary : theme.subText)};

  &:hover {
    cursor: pointer;
    filter: brightness(1.2);
  }

  &:active {
    filter: brightness(1.05);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 36px;
    height: 36px;
  `}

  ${({ disabled }) =>
    disabled &&
    `
      filter: brightness(0.6) !important;
    `}

  :hover {
    ${({ disabled }) => disabled && 'cursor: not-allowed;'}
  }
`

export const Divider = styled.div`
  height: 16px;
  width: 1px;
  background: ${({ theme }) => theme.tabActive};
  margin: 0 14px;
  position: relative;
  top: 1px;
`

export const EmptyPositionText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  color: ${({ theme }) => theme.subText};
  border-radius: 20px;
  height: 400px;
  margin: 20px 0;
`

const borderRotate = keyframes`
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
`

export const BannerContainer = styled.div`
  padding: 1px;
  position: relative;
  background-clip: padding-box;
  overflow: hidden;
  border-radius: 12px;

  --border-angle: 0deg;
  animation: ${borderRotate} 2s infinite linear;
  border: 1px solid transparent;
  background: linear-gradient(rgba(148, 117, 203, 0.1), rgba(148, 117, 203, 0.1)) padding-box,
    conic-gradient(from var(--border-angle), rgba(148, 117, 203, 0.1) 50%, rgba(130, 71, 229, 0.4)) border-box;
  backdrop-filter: blur(2px);
`

export const BannerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 3rem;
  padding: 18px 28px;
  border-radius: 12px;
  position: relative;
  background: linear-gradient(119.08deg, rgba(20, 29, 27, 1) -0.89%, rgba(14, 14, 14, 1) 132.3%);

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url(${positionsBg});
    background-position: right-top;
    background-size: cover;
    border-radius: 12px;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 2rem;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-content: space-between;
    gap: 0;
    row-gap: 1rem;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    padding: 16px;
    align-items: flex-start;
    gap: 0.5rem;
  `}
`

export const BannerDivider = styled.div`
  background-color: ${({ theme }) => theme.tabActive};
  height: 60px;
  width: 1px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

export const BannerDataItem = styled.div<{ columnInMobile?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1;

  ${({ theme }) =>
    theme.mediaWidth.upToSmall`
      width: 100%;
    `}

  ${({ theme, columnInMobile }) =>
    !columnInMobile &&
    theme.mediaWidth.upToSmall`
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    `}
`

export const PositionTableHeader = styled(TableHeader)`
  grid-template-columns:
    minmax(260px, 2fr) /* Position */
    minmax(80px, 1fr) /* Value */
    minmax(90px, 1fr) /* est. APR */
    minmax(100px, 1fr) /* Unclaimed fees */
    minmax(120px, 1fr) /* Unclaimed rewards */
    24px /* Spacer column for better visual separation */
    minmax(150px, 1.5fr) /* Balance */
    minmax(160px, 1.5fr) /* Price range */
    minmax(75px, auto); /* Actions */
`

export const PositionTableHeaderItem = styled.div`
  height: 100%;
`

export const PositionTableHeaderFlexItem = styled.div`
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  height: 100%;
  gap: 4px;
  cursor: pointer;
`

export const PositionTableWrapper = styled(TableWrapper)`
  ${({ theme }) => theme.mediaWidth.upToLarge`
    background: transparent;
    margin: 0;
  `}
`

export const PositionTableBody = styled(TableBody)`
  max-height: unset;
`

export const PriceRangeWrapper = styled.div<{ outOfRange: boolean }>`
  height: 4px;
  width: 90%;
  background: ${({ theme, outOfRange }) => (outOfRange ? rgba(theme.warning, 0.3) : theme.border)};
  border-radius: 4px;
  position: relative;
  top: 46%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 30px 0 20px;
    width: 100%;
  `}
`

export const PriceRangeEl = styled.div<{ isLowestPrice: boolean; isHighestPrice: boolean; outOfRange: boolean }>`
  display: flex;
  position: absolute;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  width: ${({ isLowestPrice, isHighestPrice }) =>
    isLowestPrice ? (isHighestPrice ? '100%' : '80%') : isHighestPrice ? '80%' : '60%'};
  left: ${({ isLowestPrice }) => (isLowestPrice ? 0 : '20%')};
  border-radius: 4px;
  background: linear-gradient(90deg, #09ae7d 0%, #6368f1 100%);

  ${({ outOfRange }) =>
    outOfRange &&
    `
      background: #737373;
    `}
`

export const PriceIndicator = styled.div`
  height: 16px;
  width: 4px;
  border-radius: 4px;
  position: relative;
`

export const LowerPriceIndicator = styled(PriceIndicator)<{ outOfRange: boolean }>`
  background: ${({ outOfRange }) => (outOfRange ? '#737373' : '#09ae7d')};
`

export const UpperPriceIndicator = styled(PriceIndicator)<{ outOfRange: boolean }>`
  background: ${({ outOfRange }) => (outOfRange ? '#737373' : '#6368f1')};
`

export const IndicatorLabel = styled.div`
  position: absolute;
  top: -20px;
  transform: translateX(-42%);
  font-size: 12px;
  color: #fafafa;
`

export const CurrentPriceWrapper = styled.div<{ lower?: boolean }>`
  position: absolute;
  top: -5px;
  left: ${({ lower }) => (lower ? '6%' : '86%')};
`

export const CustomIconCurrentPrice = styled(IconCurrentPrice)<{ lower?: boolean }>`
  transition: 0.2s ease-in-out;

  :hover {
    transform: scale(1.1);
  }
`

export const CurrentPriceTooltip = styled.div<{ show?: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  position: relative;
  left: -50%;
  transition: 0.2s ease-in-out;
  opacity: 0;
  width: max-content;

  ${({ show }) => show && 'opacity: 1;'}
`
