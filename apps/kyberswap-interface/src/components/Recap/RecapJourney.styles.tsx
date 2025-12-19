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
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  /* Prevent text selection and cursor change on all children */
  * {
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* Allow pointer cursor only on interactive elements */
  button,
  .controls-container,
  .share-buttons-container,
  .mute-button {
    cursor: pointer;
  }

  &:hover .controls-container {
    opacity: 1;
  }

  &:hover .mute-button {
    opacity: 1;
  }

  @media screen and (max-width: 480px) {
    &:hover .mute-button {
      opacity: 1;
    }
  }

  @media screen and (max-width: 640px) {
    width: 480px;
    height: 480px;
  }

  @media screen and (max-width: 480px) {
    width: 100vw;
    height: 100vw;
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

  @media screen and (max-width: 640px) {
    top: 22px;
    left: 18px;
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    top: 16px;
    left: 12px;
    gap: 4px;
  }
`

export const LogoImage = styled.img`
  width: 124px;

  @media screen and (max-width: 640px) {
    width: 93px;
  }

  @media screen and (max-width: 480px) {
    width: calc(124 / 640 * 100vw);
  }
`

export const YearTag = styled.div`
  position: absolute;
  top: 0;
  right: 32px;
  z-index: 20;

  @media screen and (max-width: 640px) {
    right: 24px;
  }

  @media screen and (max-width: 480px) {
    right: calc(32 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    padding: 22px 8px 24px;
    font-size: 18px;
    letter-spacing: -0.9px;
  }

  @media screen and (max-width: 480px) {
    padding: calc(30 / 640 * 100vw) calc(10 / 640 * 100vw) calc(32 / 640 * 100vw);
    font-size: calc(24 / 640 * 100vw);
    letter-spacing: calc(-1.2 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    padding: 18px;
  }

  @media screen and (max-width: 480px) {
    padding: calc(24 / 640 * 100vw);
  }
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

  @media screen and (max-width: 640px) {
    font-size: 84px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(112 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 34px;
    margin: 14px 0 0 0;
    gap: 9px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(46 / 640 * 100vw);
    margin: calc(18 / 640 * 100vw) 0 0 0;
    gap: calc(12 / 640 * 100vw);
  }
`

export const FlowText = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 62px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  position: relative;
  top: -6px;

  @media screen and (max-width: 640px) {
    font-size: 46px;
    top: -4px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(62 / 640 * 100vw);
    top: calc(-6 / 640 * 100vw);
  }
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

  @media screen and (max-width: 640px) {
    font-size: 36px;
    margin: 9px 0;
    min-height: 44px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
    margin: calc(12 / 640 * 100vw) 0;
    min-height: calc(58 / 640 * 100vw);
  }
`

export const VideoTextWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 120px;
  justify-content: center;

  @media screen and (max-width: 640px) {
    min-height: 90px;
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    min-height: calc(120 / 640 * 100vw);
    gap: calc(8 / 640 * 100vw);
  }
`

export const ButYouWrapper = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  min-height: 58px;

  @media screen and (max-width: 640px) {
    min-height: 44px;
    gap: 3px;
  }

  @media screen and (max-width: 480px) {
    min-height: calc(58 / 640 * 100vw);
    gap: calc(4 / 640 * 100vw);
  }
`

export const ButText = styled(motion.span)`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-right: 4px;

  @media screen and (max-width: 640px) {
    font-size: 27px;
    margin-right: 3px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
    margin-right: calc(4 / 640 * 100vw);
  }
`

export const YouText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  position: relative;
  top: 4px;

  @media screen and (max-width: 640px) {
    font-size: 36px;
    top: 3px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
    top: calc(4 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 36px;
    margin: 9px 0 0;
    min-height: 44px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
    margin: calc(12 / 640 * 100vw) 0 0;
    min-height: calc(58 / 640 * 100vw);
  }
`

export const NavigatedWrapper = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 58px;

  @media screen and (max-width: 640px) {
    min-height: 44px;
    gap: 7px;
  }

  @media screen and (max-width: 480px) {
    min-height: calc(58 / 640 * 100vw);
    gap: calc(10 / 640 * 100vw);
  }
`

export const NavigatedText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const StormText = styled(motion.span)`
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const StatsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 0;

  @media screen and (max-width: 640px) {
    gap: 3px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(4 / 640 * 100vw);
  }
`

export const StatsText = styled(motion.div)`
  font-size: 48px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  line-height: 1.2;

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const VolumeText = styled(motion.span)`
  font-size: 64px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;

  @media screen and (max-width: 640px) {
    font-size: 48px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(64 / 640 * 100vw);
  }
`

export const UsersText = styled(motion.span)`
  font-size: 64px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  position: relative;

  @media screen and (max-width: 640px) {
    font-size: 48px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(64 / 640 * 100vw);
  }
`

export const LabelText = styled.span`
  font-size: 32px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-left: 8px;

  @media screen and (max-width: 640px) {
    font-size: 24px;
    margin-left: 6px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(32 / 640 * 100vw);
    margin-left: calc(8 / 640 * 100vw);
  }
`

// Bar Chart for Stats Scene
export const BarChartWrapper = styled(motion.div)`
  width: 100%;
  margin-top: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-end;

  @media screen and (max-width: 640px) {
    margin-top: 30px;
  }

  @media screen and (max-width: 480px) {
    margin-top: calc(40 / 640 * 100vw);
  }
`

export const BarChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 120px;
  width: 100%;
  max-width: 500px;
  padding: 0 20px;

  @media screen and (max-width: 640px) {
    height: 90px;
    gap: 3px;
    max-width: 375px;
    padding: 0 15px;
  }

  @media screen and (max-width: 480px) {
    height: calc(120 / 640 * 100vw);
    gap: calc(4 / 640 * 100vw);
    max-width: calc(500 / 640 * 100vw);
    padding: 0 calc(20 / 640 * 100vw);
  }
`

export const ChartBar = styled(motion.div)<{ $height: number; $color: string }>`
  flex: 1;
  min-width: 8px;
  max-width: 40px;
  height: ${({ $height }) => $height}%;
  background: ${({ $color }) => $color};
  border-radius: 4px 4px 0 0;
  position: relative;
  overflow: hidden;

  @media screen and (max-width: 640px) {
    min-width: 6px;
    max-width: 30px;
    border-radius: 3px 3px 0 0;
  }

  @media screen and (max-width: 480px) {
    min-width: calc(8 / 640 * 100vw);
    max-width: calc(40 / 640 * 100vw);
    border-radius: calc(4 / 640 * 100vw) calc(4 / 640 * 100vw) 0 0;
  }
`

// Scene 2: You made the MARK
export const MarkContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const MarkText = styled(motion.div)`
  font-size: 40px;
  font-weight: 500;
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

  @media screen and (max-width: 640px) {
    font-size: 30px;
    gap: 7px;
    max-width: 390px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(40 / 640 * 100vw);
    gap: calc(10 / 640 * 100vw);
    max-width: calc(520 / 640 * 100vw);
  }
`

export const MarkHighlight = styled.span`
  font-size: 52px;
  font-weight: 500;
  position: relative;
  top: 4px;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 640px) {
    font-size: 39px;
    top: 3px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(52 / 640 * 100vw);
    top: calc(4 / 640 * 100vw);
  }
`

// Scene 3: You moved / Executed
export const TradingStatsContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  position: relative;
  padding-top: 120px;

  @media screen and (max-width: 640px) {
    padding-top: 90px;
  }

  @media screen and (max-width: 480px) {
    padding-top: calc(120 / 640 * 100vw);
  }
`

export const TradingStatsTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;

  @media screen and (max-width: 640px) {
    gap: 12px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(16 / 640 * 100vw);
  }
`

export const TradingStatLine = styled(motion.div)`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 48px;

  @media screen and (max-width: 640px) {
    gap: 6px;
    min-height: 36px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
    min-height: calc(48 / 640 * 100vw);
  }
`

export const TradingStatLine2 = styled(TradingStatLine)`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
`

export const TradingStatLabel = styled.span`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 27px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
  }
`

export const TradingStatLabel2 = styled(TradingStatLabel)`
  font-size: 24px;

  @media screen and (max-width: 640px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(24 / 640 * 100vw);
  }
`

export const TradingStatValue = styled.span`
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  font-family: 'Antonio', sans-serif;

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const TradingStatValue2 = styled(TradingStatValue)`
  color: ${({ theme }) => theme.blue3};
  position: relative;
  top: -4px;

  @media screen and (max-width: 640px) {
    top: -3px;
  }

  @media screen and (max-width: 480px) {
    top: calc(-4 / 640 * 100vw);
  }
`

// Candlestick Chart for Trading Stats Scene
export const CandlestickChartWrapper = styled(motion.div)`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-top: auto;
  padding-bottom: 24px;

  @media screen and (max-width: 640px) {
    padding-bottom: 18px;
  }

  @media screen and (max-width: 480px) {
    padding-bottom: calc(24 / 640 * 100vw);
  }
`

export const CandlestickChartImage = styled(motion.img)`
  width: 80%;
  max-width: 480px;
  height: auto;
  max-height: 180px;
  object-fit: contain;

  @media screen and (max-width: 640px) {
    width: 85%;
    max-width: 360px;
    max-height: 135px;
  }

  @media screen and (max-width: 480px) {
    width: 85%;
    max-width: calc(480 / 640 * 100vw);
    max-height: calc(180 / 640 * 100vw);
  }
`

// Scene 4: Top X%
export const TopPercentContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 60px;

  @media screen and (max-width: 640px) {
    gap: 6px;
    min-height: 45px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
    min-height: calc(60 / 640 * 100vw);
  }
`

export const TopPercentNickname = styled(motion.div)`
  font-size: 42px;
  font-weight: 700;
  color: #ffde69;
  text-align: center;
  line-height: 1.2;
  font-family: 'Cera', sans-serif;

  @media screen and (max-width: 640px) {
    font-size: 32px;
    margin-bottom: 9px;
    margin-top: 32px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(42 / 640 * 100vw);
    margin-bottom: calc(12 / 640 * 100vw);
    margin-top: 60px;
  }
`

export const TopPercentText = styled(motion.div)`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: center;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 40px;

  @media screen and (max-width: 640px) {
    font-size: 27px;
    gap: 6px;
    margin-bottom: 30px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
    gap: calc(8 / 640 * 100vw);
    margin-bottom: calc(40 / 640 * 100vw);
  }
`

export const TopPercentValue = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

// Badge
export const BadgeContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;

  @media screen and (max-width: 640px) {
    min-height: 150px;
  }

  @media screen and (max-width: 480px) {
    min-height: calc(200 / 640 * 100vw);
  }
`

export const BadgeImage = styled.img`
  width: 240px;
  height: auto;

  @media screen and (max-width: 640px) {
    width: 180px;
  }

  @media screen and (max-width: 480px) {
    width: calc(240 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    bottom: 10px;
    left: 14px;
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    display: none;
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

  @media screen and (max-width: 640px) {
    width: 32px;
    height: 32px;

    svg {
      width: 12px;
      height: 12px;
    }
  }

  @media screen and (max-width: 480px) {
    width: 44px;
    height: 44px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
`

export const ShareButtonsContainer = styled.div`
  position: absolute;
  bottom: 14px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  opacity: 1;

  @media screen and (max-width: 640px) {
    bottom: 10px;
    right: 14px;
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    bottom: calc(14 / 640 * 100vw);
    right: calc(18 / 640 * 100vw);
    gap: calc(8 / 640 * 100vw);
  }
`

export const MuteButton = styled.button`
  position: absolute;
  top: 28px;
  right: 18px;
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
  z-index: 100;
  opacity: 0;

  &:hover {
    background: ${({ theme }) => rgba(theme.black, 0.7)};
    border-color: ${({ theme }) => rgba(theme.white, 0.4)};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.white};
  }

  @media screen and (max-width: 640px) {
    top: 20px;
    right: 14px;
    width: 32px;
    height: 32px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  @media screen and (max-width: 480px) {
    top: auto;
    bottom: 14px;
    left: 18px;
    right: auto;
    width: 44px;
    height: 44px;
    opacity: 1;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`

export const PauseResumeOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  pointer-events: none;
`

export const PauseResumeIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.white};
  }

  @media screen and (max-width: 640px) {
    width: 60px;
    height: 60px;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  @media screen and (max-width: 480px) {
    width: calc(80 / 640 * 100vw);
    height: calc(80 / 640 * 100vw);

    svg {
      width: calc(32 / 640 * 100vw);
      height: calc(32 / 640 * 100vw);
    }
  }
`

export const ShareButton = styled.button<{ $isSuccess?: boolean; $isLoading?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme, $isSuccess, $isLoading }) =>
    $isSuccess ? rgba(theme.primary, 0.2) : $isLoading ? rgba(34, 34, 34, 0.9) : rgba(34, 34, 34, 0.8)};
  border: none;
  cursor: ${({ $isLoading }) => ($isLoading ? 'wait' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);

  &:hover {
    background: ${({ theme, $isSuccess, $isLoading }) =>
      $isSuccess ? rgba(theme.primary, 0.3) : $isLoading ? rgba(34, 34, 34, 0.9) : rgba(34, 34, 34, 1)};
    transform: ${({ $isLoading }) => ($isLoading ? 'none' : 'scale(1.05)')};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme, $isSuccess }) => ($isSuccess ? theme.primary : theme.subText)};
    transition: ${({ $isLoading }) => ($isLoading ? 'none' : 'color 0.3s ease')};
  }

  .loading-spinner {
    animation: spin 0.8s linear infinite;
    will-change: transform;
    transform-origin: center center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media screen and (max-width: 640px) {
    width: 32px;
    height: 32px;

    svg {
      width: 12px;
      height: 12px;
    }
  }

  @media screen and (max-width: 480px) {
    width: 44px;
    height: 44px;

    svg {
      width: 18px;
      height: 18px;
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

  @media screen and (max-width: 640px) {
    top: 9px;
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    top: calc(12 / 640 * 100vw);
    gap: calc(8 / 640 * 100vw);
  }
`

export const ProgressBar = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  @media screen and (max-width: 640px) {
    gap: 3px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(4 / 640 * 100vw);
  }
`

export const ProgressSegment = styled.div<{ $isActive: boolean }>`
  width: 116px;
  height: 4px;
  background: ${({ theme }) => theme.tableHeader};
  border-radius: 2px;
  position: relative;
  overflow: hidden;

  @media screen and (max-width: 640px) {
    width: 87px;
    height: 3px;
  }

  @media screen and (max-width: 480px) {
    width: calc(116 / 640 * 100vw);
    height: calc(4 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 9px;
    letter-spacing: 0.75px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(12 / 640 * 100vw);
    letter-spacing: calc(1 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const CapitalFlowText = styled(motion.div)`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 27px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
  }
`

export const CapitalHighlight = styled(motion.div)`
  font-size: 42px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 31px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(42 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    top: 64px;
    font-size: 21px;
  }

  @media screen and (max-width: 480px) {
    top: calc(85 / 640 * 100vw);
    font-size: calc(28 / 640 * 100vw);
  }
`

export const TopListContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;

  @media screen and (max-width: 640px) {
    gap: 24px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(32 / 640 * 100vw);
  }
`

export const TopListTitle = styled(motion.div)`
  font-size: 36px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;

  @media screen and (max-width: 640px) {
    font-size: 27px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
  }
`

export const TopListItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 320px;

  @media screen and (max-width: 640px) {
    gap: 12px;
    max-width: 240px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(16 / 640 * 100vw);
    max-width: calc(320 / 640 * 100vw);
  }
`

export const TopListItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;

  @media screen and (max-width: 640px) {
    gap: 12px;
    padding: 6px 0;
  }

  @media screen and (max-width: 480px) {
    gap: calc(16 / 640 * 100vw);
    padding: calc(8 / 640 * 100vw) 0;
  }
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

  @media screen and (max-width: 640px) {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  @media screen and (max-width: 480px) {
    width: calc(32 / 640 * 100vw);
    height: calc(32 / 640 * 100vw);
    font-size: calc(16 / 640 * 100vw);
  }
`

export const TopListIconWrapper = styled.div`
  position: relative;
  width: 36px;
  height: 36px;

  @media screen and (max-width: 640px) {
    width: 27px;
    height: 27px;
  }

  @media screen and (max-width: 480px) {
    width: calc(36 / 640 * 100vw);
    height: calc(36 / 640 * 100vw);
  }
`

export const TopListIcon = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;

  @media screen and (max-width: 640px) {
    width: 27px;
    height: 27px;
  }

  @media screen and (max-width: 480px) {
    width: calc(36 / 640 * 100vw);
    height: calc(36 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    width: 12px;
    height: 12px;
    bottom: -3px;
    right: -3px;
    border-width: 1.5px;
  }

  @media screen and (max-width: 480px) {
    width: calc(16 / 640 * 100vw);
    height: calc(16 / 640 * 100vw);
    bottom: calc(-4 / 640 * 100vw);
    right: calc(-4 / 640 * 100vw);
  }
`

export const TopListName = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(24 / 640 * 100vw);
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
  position: relative;
  width: 100%;
  height: 100%;

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const MevText = styled(motion.div)`
  font-size: 36px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 27px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
  }
`

export const MevTextWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const MevFlowLine = styled(motion.div)`
  font-size: 32px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;

  @media screen and (max-width: 640px) {
    font-size: 24px;
    gap: 7px;
    margin-top: 9px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(32 / 640 * 100vw);
    gap: calc(10 / 640 * 100vw);
    margin-top: calc(12 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const FairflowImage = styled(motion.img)`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  height: 60px;
  object-fit: contain;

  @media screen and (max-width: 640px) {
    bottom: 30px;
    height: 45px;
  }

  @media screen and (max-width: 480px) {
    bottom: calc(40 / 640 * 100vw);
    height: calc(60 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const FairflowTitle = styled(motion.div)`
  font-size: 36px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 27px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(36 / 640 * 100vw);
  }
`

export const FairflowHighlight = styled.span`
  color: #ff007a;
  font-weight: 500;
`

export const FairflowEarned = styled(motion.div)`
  font-size: 24px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(24 / 640 * 100vw);
  }
`

export const FairflowRewardLine = styled(motion.div)`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;

  @media screen and (max-width: 640px) {
    gap: 9px;
    margin: 12px 0;
  }

  @media screen and (max-width: 480px) {
    gap: calc(12 / 640 * 100vw);
    margin: calc(16 / 640 * 100vw) 0;
  }
`

export const KemLmIcon = styled.img`
  width: 48px;
  height: 48px;

  @media screen and (max-width: 640px) {
    width: 36px;
    height: 36px;
  }

  @media screen and (max-width: 480px) {
    width: calc(48 / 640 * 100vw);
    height: calc(48 / 640 * 100vw);
  }
`

export const FairflowRewardValue = styled.span`
  font-family: 'Antonio', sans-serif;
  font-size: 56px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};

  @media screen and (max-width: 640px) {
    font-size: 42px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(56 / 640 * 100vw);
  }
`

export const FairflowRewardLabel = styled.span`
  font-size: 32px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 24px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(32 / 640 * 100vw);
  }
`

export const FairflowSubtext = styled(motion.div)`
  font-size: 24px;
  font-weight: 400;
  font-style: italic;
  color: ${({ theme }) => theme.text};
  line-height: 1.3;

  @media screen and (max-width: 640px) {
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(24 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 15px;
    margin: 12px 24px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(20 / 640 * 100vw);
    margin: calc(16 / 640 * 100vw) calc(32 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    padding: 15px;
    gap: 12px;
    max-width: 525px;
  }

  @media screen and (max-width: 480px) {
    padding: calc(20 / 640 * 100vw);
    gap: calc(16 / 640 * 100vw);
    max-width: calc(700 / 640 * 100vw);
  }
`

export const SummaryNickname = styled.div`
  font-size: 40px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 8px;

  @media screen and (max-width: 640px) {
    font-size: 30px;
    margin-bottom: 6px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(40 / 640 * 100vw);
    margin-bottom: calc(8 / 640 * 100vw);
  }
`

export const SummaryMainRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  width: 100%;
  margin-top: 8px;

  @media screen and (max-width: 640px) {
    gap: 18px;
    margin-top: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(24 / 640 * 100vw);
    margin-top: calc(8 / 640 * 100vw);
  }
`

export const SummaryBadge = styled.img`
  width: 200px;
  height: auto;

  @media screen and (max-width: 640px) {
    width: 150px;
  }

  @media screen and (max-width: 480px) {
    width: calc(200 / 640 * 100vw);
  }
`

export const SummaryStatsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media screen and (max-width: 640px) {
    gap: 6px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(8 / 640 * 100vw);
  }
`

export const SummaryStatsRow = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto auto;
  gap: 12px 24px;

  @media screen and (max-width: 640px) {
    gap: 6px 18px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(12 / 640 * 100vw) calc(24 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 13px;
    margin-bottom: -7px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(18 / 640 * 100vw);
    margin-bottom: calc(-10 / 640 * 100vw);
  }
`

export const SummaryStatValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1;

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const SummaryTradesValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1;

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 13px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(18 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    font-size: 15px;
    padding: 4px 18px;
    border-radius: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(20 / 640 * 100vw);
    padding: calc(6 / 640 * 100vw) calc(24 / 640 * 100vw);
    border-radius: calc(20 / 640 * 100vw);
  }
`

export const SummaryFavoritesRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  margin-top: 16px;

  @media screen and (max-width: 640px) {
    gap: 12px;
    margin-top: 12px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(16 / 640 * 100vw);
    margin-top: calc(16 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    padding: 9px 16px 7px;
    gap: 3px;
    border-radius: 9px;
  }

  @media screen and (max-width: 480px) {
    padding: calc(12 / 640 * 100vw) calc(22 / 640 * 100vw) calc(10 / 640 * 100vw);
    gap: calc(4 / 640 * 100vw);
    border-radius: calc(12 / 640 * 100vw);
  }
`

export const SummaryFavoriteLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText};

  @media screen and (max-width: 640px) {
    font-size: 9px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(12 / 640 * 100vw);
  }
`

export const SummaryFavoriteValue = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 13px;
    gap: 4px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(18 / 640 * 100vw);
    gap: calc(6 / 640 * 100vw);
  }
`

export const SummaryFavoriteIconWrapper = styled.div`
  position: relative;
  width: 20px;
  height: 20px;

  @media screen and (max-width: 640px) {
    width: 15px;
    height: 15px;
  }

  @media screen and (max-width: 480px) {
    width: calc(20 / 640 * 100vw);
    height: calc(20 / 640 * 100vw);
  }
`

export const SummaryFavoriteIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;

  @media screen and (max-width: 640px) {
    width: 15px;
    height: 15px;
  }

  @media screen and (max-width: 480px) {
    width: calc(20 / 640 * 100vw);
    height: calc(20 / 640 * 100vw);
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

  @media screen and (max-width: 640px) {
    width: 7px;
    height: 7px;
    bottom: -2px;
    right: -2px;
  }

  @media screen and (max-width: 480px) {
    width: calc(10 / 640 * 100vw);
    height: calc(10 / 640 * 100vw);
    bottom: calc(-3 / 640 * 100vw);
    right: calc(-3 / 640 * 100vw);
  }
`

export const SummaryRewardsSection = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 16px;

  @media screen and (max-width: 640px) {
    gap: 9px;
    margin-top: 12px;
  }

  @media screen and (max-width: 480px) {
    gap: calc(12 / 640 * 100vw);
    margin-top: calc(16 / 640 * 100vw);
  }
`

export const SummaryRewardsValue = styled.div`
  font-family: 'Antonio', sans-serif;
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
  line-height: 1.1;

  @media screen and (max-width: 640px) {
    font-size: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(48 / 640 * 100vw);
  }
`

export const SummaryRewardsLabel = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: calc(20 / 640 * 100vw);
  }
`

export const SummaryFooter = styled.div`
  position: absolute;
  bottom: 24px;
  left: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};

  @media screen and (max-width: 640px) {
    bottom: 18px;
    left: 18px;
    font-size: 10px;
  }

  @media screen and (max-width: 480px) {
    bottom: calc(24 / 640 * 100vw);
    left: calc(24 / 640 * 100vw);
    font-size: calc(14 / 640 * 100vw);
  }
`

export const SummaryFooterLink = styled.span`
  color: ${({ theme }) => theme.primary};
`
