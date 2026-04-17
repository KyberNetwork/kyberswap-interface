import { rgba } from 'polished'
import { Link } from 'react-router-dom'
import { Flex } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

const STABLE_PAIR_BG = 'rgba(8, 161, 231, 0.06)'
const STABLE_PAIR_BG_HOVER = 'rgba(8, 161, 231, 0.16)'

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const fadeIn = (delay = 0) => css`
  opacity: 0;
  animation: ${fadeInUp} 0.5s ease-out ${delay}s forwards;

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    animation: none;
  }
`

const borderRotate = keyframes`
  0% { --border-angle: 0deg; }
  100% { --border-angle: 360deg; }
`

export const PageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

export const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 32px 16px 16px;
  ${fadeIn(0)}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 24px;
    padding: 16px 0 8px;
  `}
`

export const HeroTitle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 880px;
`

export const HeroRewardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 16px;
    flex-direction: column;
  `}
`

export const TopSectionsRow = styled.div`
  display: grid;
  grid-template-columns: 868fr 408fr;
  gap: 22px;
  ${fadeIn(0.15)}

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
    gap: 16px;
  `}
`

export const BottomSectionsRow = styled.div`
  ${fadeIn(0.3)}
`

export const BottomSectionInner = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0;
  align-items: stretch;
  position: relative;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
  `}
`

export const BottomLeftCol = styled.div`
  padding: 20px 24px 24px 24px;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 20px 20px 24px;
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 16px 16px 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 24px 0 0;
  `}
`

export const BottomRightCol = styled.div`
  padding: 20px 24px 24px 24px;
  min-width: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 76px;
    bottom: 24px;
    width: 1px;
    background: ${({ theme }) => rgba(theme.border, 0.4)};
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 0 20px 24px;

    &::before {
      display: none;
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 16px 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 24px 0 0;
  `}
`

export const SectionContainer = styled.div<{
  accentColor?: string
  clickable?: boolean
}>`
  ${({ clickable }) => clickable && 'cursor: pointer;'}
  position: relative;
  padding: 1px;
  border-radius: 20px;
  overflow: hidden;
  background-clip: padding-box;
  transition: transform 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1px;
    border-radius: 20px;
    --border-angle: 0deg;
    background: linear-gradient(
        306.9deg,
        #262525 38.35%,
        ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.06)} 104.02%
      ),
      radial-gradient(
        58.61% 54.58% at 30.56% 0%,
        ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.6)} 0%,
        rgba(0, 0, 0, 0) 100%
      );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    z-index: 0;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &:hover::before {
    background: conic-gradient(
      from var(--border-angle),
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.05)} 0%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.9)} 10%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.05)} 25%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.05)} 100%
    );
    animation: ${borderRotate} 3s linear infinite;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0;
    background: none;
    border-radius: 0;
    margin-left: -16px;
    margin-right: -16px;

    &::before,
    &:hover::before {
      display: none;
    }

    &:hover {
      transform: none;
    }
  `}

  ${({ theme }) => theme.mediaWidth.upToXXSmall`
    margin-left: -12px;
    margin-right: -12px;
  `}
`

export const SectionInner = styled.div<{ accentColor?: string }>`
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  padding: 0 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  z-index: 1;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 24px 20px;
    gap: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0 20px 20px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0 16px 16px;
    border-radius: 0;
  `}

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.15)} 0%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.85)} 18%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.2)} 50%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.1)} 80%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.05)} 100%
    );
    pointer-events: none;
    opacity: 0;

    ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      opacity: 1;
    `}
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.08)} 0%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.45)} 18%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.1)} 50%,
      ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.05)} 80%,
      transparent 100%
    );
    pointer-events: none;
    opacity: 0;

    ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      opacity: 1;
    `}
  }
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
`

export const HeaderIconWrapper = styled.div`
  position: relative;
  width: 80px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 64px;
  `}
`

export const HeaderIconLine = styled.div<{ accentColor?: string }>`
  width: 1px;
  height: 20px;
  background: ${({ accentColor, theme }) => accentColor || theme.primary};
`

export const HeaderIconCircle = styled.div<{ accentColor?: string }>`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid ${({ accentColor, theme }) => rgba(accentColor || theme.primary, 0.6)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.subText};
  background: transparent;

  &::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    background: ${({ accentColor, theme }) => (accentColor ? rgba(accentColor, 0.2) : rgba(theme.primary, 0.15))};
    pointer-events: none;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 64px;
    height: 64px;

    &::before {
      inset: 6px;
    }
  `}
`

export const HeaderTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 32px;
  flex: 1;
  min-width: 0;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-top: 20px;
  `}
`

export const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => rgba(theme.border, 0.4)};
`

export const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
    gap: 16px;
  `}
`

export const InnerSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`

export const InnerListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const PartnerVaultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`

export const HighlightedPoolsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 16px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
    gap: 12px;
  `}
`

export const FarmingPoolsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 12px;
  `}
`

export const SimpleSectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px 16px 0;
  margin-bottom: 4px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 4px 12px 12px 0;
  `}
`

export const LargePoolRow = styled.div<{ variant?: 'default' | 'stable' | 'farming' }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ variant, theme }) =>
    variant === 'stable'
      ? STABLE_PAIR_BG
      : variant === 'farming'
      ? rgba(theme.primary, 0.04)
      : rgba(theme.white, 0.04)};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ variant, theme }) => (variant === 'stable' ? STABLE_PAIR_BG_HOVER : rgba(theme.primary, 0.16))};
  }
`

export const SmallPoolRow = styled(Flex)<{ variant?: 'default' | 'stable' }>`
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ variant, theme }) => (variant === 'stable' ? STABLE_PAIR_BG : rgba(theme.white, 0.04))};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ variant, theme }) => (variant === 'stable' ? STABLE_PAIR_BG_HOVER : rgba(theme.primary, 0.16))};
  }

  ${({ theme, variant }) =>
    variant !== 'stable' &&
    theme.mediaWidth.upToExtraSmall`
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 16px;
    `}
`

export const Tag = styled.div`
  border-radius: 999px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  color: ${({ theme }) => theme.subText};
  padding: 4px 8px;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  flex-shrink: 0;
`

export const ProtocolTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 8px;
  background: ${({ theme }) => rgba(theme.white, 0.08)};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 16px;
  flex-shrink: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const RewardsNavigateButton = styled(Link)`
  padding: 8px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  cursor: pointer;

  --border-angle: 0deg;
  animation: ${borderRotate} 2s infinite linear;
  border: 1px solid transparent;
  background: linear-gradient(161.87deg, rgba(22, 31, 28, 0.8) 8.13%, rgba(24, 45, 39, 0.8) 99%) padding-box,
    conic-gradient(
        from var(--border-angle),
        ${({ theme }) => theme.primary} 0%,
        #196750 15%,
        #196750 35%,
        ${({ theme }) => theme.primary} 50%,
        #196750 65%,
        #196750 85%,
        ${({ theme }) => theme.primary} 100%
      )
      border-box;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  transition: box-shadow 0.2s ease, filter 0.2s ease;

  &:hover {
    box-shadow: 0px 4px 16px rgba(49, 203, 158, 0.25);
    filter: brightness(1.2);
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100%;
    justify-content: center;
  `}
`

export const ExplorePoolsButton = styled(RewardsNavigateButton)`
  padding: 16px 32px;
  font-size: 16px;
  margin: 16px auto 0;

  &:hover {
    box-shadow: 0px 6px 24px rgba(49, 203, 158, 0.3);
    filter: brightness(1.25);
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 12px 24px;
  `}
`

export const ExplorePoolsWrapper = styled.div`
  display: flex;
  justify-content: center;
  ${fadeIn(0.45)}
`
