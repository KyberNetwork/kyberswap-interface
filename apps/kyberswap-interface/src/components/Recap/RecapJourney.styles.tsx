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
  top: 24px;
  left: 24px;
  z-index: 10;
  gap: 8px;

  @media screen and (max-width: 768px) {
    top: 16px;
    left: 16px;
    gap: 6px;
  }
`

export const LogoImage = styled.img`
  width: 120px;
`

export const YearTag = styled.div`
  position: absolute;
  top: 0;
  right: 32px;
  z-index: 10;

  @media screen and (max-width: 768px) {
    right: 16px;
  }
`

export const YearTagBanner = styled.div`
  background: ${({ theme }) => rgba(theme.primary, 0.2)};
  padding: 30px 10px 32px;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;
  font-size: 24px;
  letter-spacing: -1.2px;
  font-weight: 700;
  position: relative;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%);
  -webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 20px), 0 100%);

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
export const ProgressBarContainer = styled.div`
  position: absolute;
  top: 24px;
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
  width: 120px;
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
