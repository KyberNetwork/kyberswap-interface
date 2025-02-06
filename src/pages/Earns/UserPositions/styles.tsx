import { rgba } from 'polished'
import styled from 'styled-components'

import earnLargeBg from 'assets/banners/earn_background_large.png'

import { PoolPageWrapper, TableBody, TableHeader, TableWrapper } from '../PoolExplorer/styles'

export const PositionPageWrapper = styled(PoolPageWrapper)`
  padding: 24px 6rem 62px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 24px 6rem 60px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 24px 16px 100px;
  `}
`

export const PositionRow = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1.2fr 1.2fr 1.5fr 1fr;
  grid-template-rows: 1fr;
  padding: 16px 28px;
  row-gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-content: flex-start;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 1fr 1fr;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
    flex-direction: column;
    row-gap: 16px;
    padding: 16px;
    border-radius: 20px;
    background: ${rgba(theme.background, 0.8)};
    margin-bottom: 16px;
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
    grid-column: span 3;
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
  left: -14px;
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

export const PositionAction = styled.div<{ primary?: boolean }>`
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

export const BannerContainer = styled.div`
  padding: 1px;
  position: relative;
  background-clip: padding-box;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid transparent;

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px;
    background: linear-gradient(306.9deg, #262525 38.35%, rgba(148, 117, 203, 0.2) 104.02%),
      radial-gradient(58.61% 54.58% at 30.56% 0%, rgba(130, 71, 229, 0.6) 0%, rgba(130, 71, 229, 0) 100%);
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    z-index: -1;
  }
`

export const BannerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 3rem;
  padding: 22px 18px 22px 88px;

  background-image: url(${earnLargeBg});
  background-position: center;
  background-size: cover;

  ${({ theme }) => theme.mediaWidth.upToXL`
    padding: 20px 18px;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    gap: 1rem;
    padding: 20px 24px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    align-items: flex-start;
  `}
`

export const BannerDivider = styled.div`
  background-color: ${({ theme }) => theme.tabActive};
  height: 60px;
  width: 1px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 1px;
    width: 100%;
  `}
`

export const BannerOverview = styled.div`
  display: flex;
  gap: 4rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  `}
`

export const BannerDataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: row;
    justify-content: space-between;
  `}
`

export const PositionTableHeader = styled(TableHeader)`
  grid-template-columns: 3fr 1fr 1fr 1.2fr 1.2fr 1.5fr 1fr;
`

export const PositionTableWrapper = styled(TableWrapper)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    background: transparent;
    margin: 0;
  `}
`

export const PositionTableBody = styled(TableBody)`
  max-height: unset;
`
