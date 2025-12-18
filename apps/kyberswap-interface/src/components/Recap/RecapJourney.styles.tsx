import { motion } from 'framer-motion'
import { rgba } from 'polished'
import styled, { createGlobalStyle } from 'styled-components'

import CeraBlack from 'assets/fonts/cera/Cera-Black.ttf'
import CeraBlackItalic from 'assets/fonts/cera/Cera-BlackItalic.ttf'
import CeraBold from 'assets/fonts/cera/Cera-Bold.ttf'
import CeraBoldItalic from 'assets/fonts/cera/Cera-BoldItalic.ttf'
import CeraLight from 'assets/fonts/cera/Cera-Light.ttf'
import CeraLightItalic from 'assets/fonts/cera/Cera-LightItalic.ttf'
import CeraMedium from 'assets/fonts/cera/Cera-Medium.ttf'
import CeraMediumItalic from 'assets/fonts/cera/Cera-MediumItalic.ttf'
import CeraRegular from 'assets/fonts/cera/Cera-Regular.ttf'
import CeraRegularItalic from 'assets/fonts/cera/Cera-RegularItalic.ttf'
import CeraThin from 'assets/fonts/cera/Cera-Thin.ttf'
import CeraThinItalic from 'assets/fonts/cera/Cera-ThinItalic.ttf'

export const CeraFontFace = createGlobalStyle`
  @font-face {
    font-family: 'Cera';
    src: url(${CeraThin}) format('truetype');
    font-weight: 100;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraThinItalic}) format('truetype');
    font-weight: 100;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraLight}) format('truetype');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraLightItalic}) format('truetype');
    font-weight: 300;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraRegular}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraRegularItalic}) format('truetype');
    font-weight: 400;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraMedium}) format('truetype');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraMediumItalic}) format('truetype');
    font-weight: 500;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraBold}) format('truetype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraBoldItalic}) format('truetype');
    font-weight: 700;
    font-style: italic;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraBlack}) format('truetype');
    font-weight: 900;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Cera';
    src: url(${CeraBlackItalic}) format('truetype');
    font-weight: 900;
    font-style: italic;
    font-display: swap;
  }
`

export const JourneyContainer = styled.div`
  position: relative;
  width: 640px;
  height: 640px;
  overflow: hidden;
  background: #0f0f0f;
  font-family: 'Cera', sans-serif;

  &:hover .controls-container {
    opacity: 1;
  }
`

export const BackgroundImage = styled.div<{ src: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url(${({ src }) => src});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`

export const BackgroundOverlayImage = styled.img`
  position: absolute;
  top: 5%;
  left: 5%;
  right: 5%;
  bottom: 5%;
  width: 90%;
  height: 90%;
  object-fit: contain;
  pointer-events: none;
  opacity: 0.3;
`

export const VideoBackground = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`

export const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2;
  pointer-events: none;
`

export const LogoContainer = styled.div`
  position: absolute;
  top: 30px;
  left: 24px;
  z-index: 20;
  gap: 8px;

  @media screen and (max-width: 768px) {
    top: 16px;
    left: 16px;
    gap: 6px;
  }
`

export const LogoImage = styled.img`
  width: 124px;
`

export const YearTag = styled.div`
  position: absolute;
  top: 0;
  right: 32px;
  z-index: 20;

  @media screen and (max-width: 768px) {
    right: 16px;
  }
`

export const YearTagBanner = styled.div<{ $isFinale?: boolean }>`
  background: ${({ theme, $isFinale }) => rgba(theme.primary, $isFinale ? 0.4 : 0.2)};
  padding: 30px 10px 32px;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;
  font-size: 24px;
  letter-spacing: -1.2px;
  font-weight: 700;
  position: relative;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%);
  -webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%);
  transition: background 0.5s ease;

  @media screen and (max-width: 768px) {
    padding: 8px 14px 12px;
    font-size: 16px;
  }
`

export const ContentContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
  padding: 24px;
`

export const FireworkContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-top: -180px;
`

export const Year2025 = styled(motion.h1)`
  font-size: 112px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin: 0;
  line-height: 1;

  @media screen and (max-width: 768px) {
    font-size: 64px;
  }
`

export const YearOfFlow = styled(motion.h2)`
  font-size: 46px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin: 18px 0 0 0;
  line-height: 1.2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;

  @media screen and (max-width: 768px) {
    font-size: 28px;
    margin: 16px 0 0 0;
  }
`

export const FlowText = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 62px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  position: relative;
  top: -6px;
`

export const TextLine = styled(motion.div)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin: 12px 0;
  line-height: normal;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 768px) {
    font-size: 32px;
    margin: 8px 0;
    min-height: 40px;
  }
`

export const VideoTextWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 120px;
  justify-content: center;

  @media screen and (max-width: 768px) {
    min-height: 80px;
    gap: 4px;
  }
`

export const ButYouWrapper = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  min-height: 58px;

  @media screen and (max-width: 768px) {
    min-height: 40px;
  }
`

export const ButText = styled(motion.span)`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-right: 4px;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const YouText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  position: relative;
  top: 4px;

  @media screen and (max-width: 768px) {
    font-size: 36px;
  }
`

export const NicknameText = styled(motion.p)`
  font-size: 48px;
  font-weight: 400;
  color: #ffde69;
  margin: 12px 0 0;
  text-align: center;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 768px) {
    font-size: 24px;
    min-height: 30px;
  }
`

export const NavigatedWrapper = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 58px;

  @media screen and (max-width: 768px) {
    min-height: 40px;
  }
`

export const NavigatedText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const StormText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const StatsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: -160px;
`

export const StatsText = styled(motion.div)`
  font-size: 48px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  line-height: 1.2;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const VolumeText = styled(motion.span)`
  font-size: 64px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }
`

export const UsersText = styled(motion.span)`
  font-size: 64px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  position: relative;

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }
`

export const LabelText = styled.span`
  font-size: 32px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  margin-left: 8px;

  @media screen and (max-width: 768px) {
    font-size: 16px;
    margin-left: 4px;
  }
`

// Scene 2: You made the MARK
export const MarkContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

export const MarkText = styled(motion.div)`
  font-size: 40px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  text-align: center;
  line-height: 1.15;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  white-space: normal;
  max-width: 520px;

  @media screen and (max-width: 768px) {
    font-size: 26px;
    gap: 6px;
    max-width: 320px;
  }
`

export const MarkHighlight = styled.span`
  font-size: 52px;
  font-weight: 500;
  position: relative;
  top: 4px;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 768px) {
    font-size: 38px;
  }
`

// Scene 3: You moved / Executed
export const TradingStatsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 120px;
`

export const TradingStatLine = styled(motion.div)`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 48px;
`

export const TradingStatLine2 = styled(TradingStatLine)`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
`

export const TradingStatLabel = styled.span`
  font-size: 36px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`

export const TradingStatLabel2 = styled(TradingStatLabel)`
  font-size: 24px;

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`

export const TradingStatValue = styled.span`
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const TradingStatValue2 = styled(TradingStatValue)`
  color: ${({ theme }) => theme.blue3};
  position: relative;
  top: -4px;
`

// Scene 4: Top X%
export const TopPercentContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 60px;
`

export const TopPercentText = styled(motion.div)`
  font-size: 36px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  text-align: center;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`

export const TopPercentValue = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

// Badge
export const BadgeContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;

  @media screen and (max-width: 768px) {
    min-height: 120px;
  }
`

export const BadgeImage = styled.img`
  width: 240px;
  height: auto;

  @media screen and (max-width: 768px) {
    width: 144px;
  }
`

// Progress Bar
export const ControlsContainer = styled.div`
  position: absolute;
  bottom: 14px;
  left: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;

  @media screen and (max-width: 768px) {
    bottom: 16px;
    left: 16px;
    gap: 6px;
  }
`

export const ControlButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.black, 0.5)};
  border: 1px solid ${({ theme }) => rgba(theme.white, 0.2)};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  &:hover {
    background: ${({ theme }) => rgba(theme.black, 0.7)};
    border-color: ${({ theme }) => rgba(theme.white, 0.4)};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.white};
  }

  @media screen and (max-width: 768px) {
    width: 32px;
    height: 32px;

    svg {
      width: 12px;
      height: 12px;
    }
  }
`

export const ProgressBarContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  @media screen and (max-width: 768px) {
    top: 16px;
    gap: 6px;
  }
`

export const ProgressBar = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  @media screen and (max-width: 768px) {
    gap: 3px;
  }
`

export const ProgressSegment = styled.div<{ $isActive: boolean }>`
  width: 116px;
  height: 4px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 2px;
  position: relative;
  overflow: hidden;

  @media screen and (max-width: 768px) {
    width: 80px;
    height: 3px;
  }
`

export const ProgressSegmentFill = styled(motion.div)<{ $isActive: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${({ theme }) => theme.gray};
  border-radius: 2px;
  width: ${({ $isActive }) => ($isActive ? '100%' : '0%')};
`

export const ProgressLabel = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.primary};
  text-transform: uppercase;
  letter-spacing: 1px;

  @media screen and (max-width: 768px) {
    font-size: 10px;
  }
`

// Part 3: Capital Flow
export const CapitalFlowContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
`

export const CapitalFlowText = styled(motion.div)`
  font-size: 36px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const CapitalHighlight = styled(motion.div)`
  font-size: 42px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

// Part 3: Top Lists (Chains & Tokens)
export const NicknameHeader = styled.div`
  position: absolute;
  top: 85px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
  font-weight: 600;
  color: #ffde69;

  @media screen and (max-width: 768px) {
    top: 65px;
    font-size: 20px;
  }
`

export const TopListContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`

export const TopListTitle = styled(motion.div)`
  font-size: 36px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const TopListItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 320px;
`

export const TopListItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
`

export const TopListRank = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => rgba(theme.primary, 0.4)};
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Antonio', sans-serif;

  @media screen and (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
`

export const TopListIconWrapper = styled.div`
  position: relative;
  width: 36px;
  height: 36px;

  @media screen and (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`

export const TopListIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;

  @media screen and (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`

export const TopListChainIcon = styled.img`
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.background};

  @media screen and (max-width: 768px) {
    width: 14px;
    height: 14px;
    bottom: -3px;
    right: -3px;
  }
`

export const TopListName = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`

// Part 4: MEV Bots
export const MevContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
`

export const MevText = styled(motion.div)`
  font-size: 36px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const MevTextWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`

export const MevFlowLine = styled(motion.div)`
  font-size: 32px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;

  @media screen and (max-width: 768px) {
    font-size: 20px;
    gap: 6px;
    margin-top: 6px;
  }
`

export const MevOutsmarted = styled.span`
  color: ${({ theme }) => theme.primary};
  font-weight: 500;
`

export const MevFlowHighlight = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }
`

// Part 4: FairFlow Rewards
export const FairflowContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
`

export const FairflowTitle = styled(motion.div)`
  font-size: 36px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 24px;
  }
`

export const FairflowHighlight = styled.span`
  color: #ff007a;
  font-weight: 500;
`

export const FairflowEarned = styled(motion.div)`
  font-size: 24px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`

export const FairflowRewardLine = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;

  @media screen and (max-width: 768px) {
    gap: 8px;
    margin: 12px 0;
  }
`

export const KemLmIcon = styled.img`
  width: 48px;
  height: 48px;

  @media screen and (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`

export const FairflowRewardValue = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 56px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 768px) {
    font-size: 36px;
  }
`

export const FairflowRewardLabel = styled.span`
  font-size: 32px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`

export const FairflowSubtext = styled(motion.div)`
  font-size: 24px;
  font-weight: 400;
  font-style: italic;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`

export const SmarterBannerWrapper = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
`

export const SmarterBannerBg = styled(motion.div)`
  position: absolute;
  background: #09ae7d;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`

export const SmarterBannerText = styled(motion.div)`
  color: ${({ theme }) => theme.textReverse};
  font-size: 20px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  margin: 16px 32px;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`

export const SmarterBold = styled.span`
  font-weight: 700;
`

// Summary Scene (Part 5)
export const SummaryContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 700px;
  padding: 20px;

  @media screen and (max-width: 768px) {
    padding: 16px;
    gap: 12px;
  }
`

export const SummaryNickname = styled.div`
  font-size: 40px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 8px;

  @media screen and (max-width: 768px) {
    font-size: 28px;
  }
`

export const SummaryMainRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  width: 100%;
  margin-top: 8px;

  @media screen and (max-width: 768px) {
    gap: 16px;
  }
`

export const SummaryBadge = styled.img`
  width: 200px;
  height: auto;

  @media screen and (max-width: 768px) {
    width: 120px;
  }
`

export const SummaryStatsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const SummaryStatsRow = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto auto;
  gap: 12px 24px;

  @media screen and (max-width: 768px) {
    gap: 4px 12px;
  }
`

export const SummaryVolumeColumn = styled.div`
  display: contents;
`

export const SummaryTradesColumn = styled.div`
  display: contents;
`

export const SummaryStatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

export const SummaryStatLabel = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: -10px;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`

export const SummaryStatValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1;

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }
`

export const SummaryTradesValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1;

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }
`

export const SummaryTradesItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

export const SummaryTradesLabel = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`

export const SummaryTopBadge = styled.div`
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  padding: 6px 24px;
  border-radius: 20px;
  font-size: 20px;
  font-weight: 500;
  width: fit-content;

  @media screen and (max-width: 768px) {
    font-size: 14px;
    padding: 6px 16px;
  }
`

export const SummaryFavoritesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 16px;

  @media screen and (max-width: 768px) {
    gap: 12px;
  }
`

export const SummaryFavoriteItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(34, 34, 34, 0.8);
  border-radius: 12px;
  padding: 12px 22px 10px;
  gap: 4px;

  @media screen and (max-width: 768px) {
    padding: 8px 16px;
    gap: 2px;
  }
`

export const SummaryFavoriteLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
`

export const SummaryFavoriteValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`

export const SummaryFavoriteIconWrapper = styled.div`
  position: relative;
  width: 20px;
  height: 20px;

  @media screen and (max-width: 768px) {
    width: 16px;
    height: 16px;
  }
`

export const SummaryFavoriteIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;

  @media screen and (max-width: 768px) {
    width: 16px;
    height: 16px;
  }
`

export const SummaryFavoriteChainIcon = styled.img`
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.background};

  @media screen and (max-width: 768px) {
    width: 8px;
    height: 8px;
    bottom: -2px;
    right: -2px;
  }
`

export const SummaryRewardsSection = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 16px;
`

export const SummaryRewardsValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1.1;

  @media screen and (max-width: 768px) {
    font-size: 36px;
  }
`

export const SummaryRewardsLabel = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`

export const SummaryFooter = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 768px) {
    bottom: 16px;
    left: 16px;
    font-size: 12px;
  }
`

export const SummaryFooterLink = styled.span`
  color: ${({ theme }) => theme.primary};
`
