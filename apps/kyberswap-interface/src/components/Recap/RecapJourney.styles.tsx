import { HTMLMotionProps, motion } from 'framer-motion'
import { ComponentPropsWithoutRef, forwardRef, useEffect } from 'react'

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
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'
import { hexAlpha } from 'utils/colorAlpha'

import './RecapJourney.styles.css'

const CERA_STYLE_ID = 'ks-cera-font-face'
const CERA_FONT_FACE_CSS = `
@font-face { font-family: 'Cera'; src: url(${CeraThin}) format('truetype'); font-weight: 100; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraThinItalic}) format('truetype'); font-weight: 100; font-style: italic; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraLight}) format('truetype'); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraLightItalic}) format('truetype'); font-weight: 300; font-style: italic; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraRegular}) format('truetype'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraRegularItalic}) format('truetype'); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraMedium}) format('truetype'); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraMediumItalic}) format('truetype'); font-weight: 500; font-style: italic; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraBold}) format('truetype'); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraBoldItalic}) format('truetype'); font-weight: 700; font-style: italic; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraBlack}) format('truetype'); font-weight: 900; font-style: normal; font-display: swap; }
@font-face { font-family: 'Cera'; src: url(${CeraBlackItalic}) format('truetype'); font-weight: 900; font-style: italic; font-display: swap; }
`

export const CeraFontFace = () => {
  useEffect(() => {
    if (document.getElementById(CERA_STYLE_ID)) return
    const style = document.createElement('style')
    style.id = CERA_STYLE_ID
    style.textContent = CERA_FONT_FACE_CSS
    document.head.appendChild(style)
  }, [])
  return null
}

export const JourneyContainer = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'>>(
  ({ className, ...rest }, ref) => <div ref={ref} className={cn('ks-rj-journey', className)} {...rest} />,
)
JourneyContainer.displayName = 'JourneyContainer'

type BackgroundImageProps = ComponentPropsWithoutRef<'div'> & { src: string }
export const BackgroundImage = ({ className, src, style, ...rest }: BackgroundImageProps) => (
  <div className={cn('ks-rj-bg-image', className)} style={{ backgroundImage: `url(${src})`, ...style }} {...rest} />
)

export const BackgroundOverlayImage = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-bg-overlay', className)} {...rest} />
)

export const VideoBackground = ({ className, children, ...rest }: ComponentPropsWithoutRef<'video'>) => (
  <video className={cn('ks-rj-video-bg', className)} {...rest}>
    {children}
  </video>
)

export const VideoOverlay = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-video-overlay', className)} {...rest} />
)

export const LogoContainer = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-logo-container', className)} {...rest} />
)

export const LogoImage = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-logo-image', className)} {...rest} />
)

export const YearTag = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-year-tag', className)} {...rest} />
)

type YearTagBannerProps = ComponentPropsWithoutRef<'div'> & { $isFinale?: boolean }
export const YearTagBanner = ({ className, $isFinale, style, ...rest }: YearTagBannerProps) => {
  const theme = useTheme()
  return (
    <div
      className={cn('ks-rj-year-tag-banner', className)}
      style={{
        background: hexAlpha(theme.primary, $isFinale ? 0.4 : 0.2),
        ...style,
      }}
      {...rest}
    />
  )
}

export const ContentContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-content-container', className)} {...rest} />
)

export const FireworkContentWrapper = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-firework-wrapper', className)} {...rest} />
)

export const Year2025 = ({ className, ...rest }: HTMLMotionProps<'h1'>) => (
  <motion.h1 className={cn('ks-rj-year2025', className)} {...rest} />
)

export const YearOfFlow = ({ className, ...rest }: HTMLMotionProps<'h2'>) => (
  <motion.h2 className={cn('ks-rj-year-of-flow', className)} {...rest} />
)

export const FlowText = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-flow-text', className)} {...rest} />
)

export const TextLine = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-text-line', className)} {...rest} />
)

export const VideoTextWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-video-text-wrapper', className)} {...rest} />
)

export const ButYouWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-but-you-wrapper', className)} {...rest} />
)

export const ButText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-but-text', className)} {...rest} />
)

export const YouText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-you-text', className)} {...rest} />
)

export const NicknameText = ({ className, ...rest }: HTMLMotionProps<'p'>) => (
  <motion.p className={cn('ks-rj-nickname-text', className)} {...rest} />
)

export const NavigatedWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-navigated-wrapper', className)} {...rest} />
)

export const NavigatedText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-navigated-text', className)} {...rest} />
)

export const StormText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-storm-text', className)} {...rest} />
)

export const StatsContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-stats-container', className)} {...rest} />
)

export const StatsText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-stats-text', className)} {...rest} />
)

export const VolumeText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-volume-text', className)} {...rest} />
)

export const UsersText = ({ className, ...rest }: HTMLMotionProps<'span'>) => (
  <motion.span className={cn('ks-rj-users-text', className)} {...rest} />
)

export const LabelText = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-label-text', className)} {...rest} />
)

export const BarChartWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-bar-chart-wrapper', className)} {...rest} />
)

export const BarChartContainer = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-bar-chart-container', className)} {...rest} />
)

type ChartBarProps = HTMLMotionProps<'div'> & { $height: number; $color: string }
export const ChartBar = ({ className, $height, $color, style, ...rest }: ChartBarProps) => (
  <motion.div
    className={cn('ks-rj-chart-bar', className)}
    style={{ height: `${$height}%`, background: $color, ...style }}
    {...rest}
  />
)

export const MarkContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mark-container', className)} {...rest} />
)

export const MarkText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mark-text', className)} {...rest} />
)

export const MarkHighlight = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-mark-highlight', className)} {...rest} />
)

export const TradingStatsContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-trading-stats-container', className)} {...rest} />
)

export const TradingStatsTextWrapper = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-trading-stats-text-wrapper', className)} {...rest} />
)

export const TradingStatLine = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-trading-stat-line', className)} {...rest} />
)

export const TradingStatLine2 = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-trading-stat-line ks-rj-trading-stat-line-2', className)} {...rest} />
)

export const TradingStatLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-trading-stat-label', className)} {...rest} />
)

export const TradingStatLabel2 = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-trading-stat-label ks-rj-trading-stat-label-2', className)} {...rest} />
)

export const TradingStatValue = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-trading-stat-value', className)} {...rest} />
)

export const TradingStatValue2 = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-trading-stat-value ks-rj-trading-stat-value-2', className)} {...rest} />
)

export const CandlestickChartWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-candlestick-wrapper', className)} {...rest} />
)

export const CandlestickChartImage = ({ className, ...rest }: HTMLMotionProps<'img'>) => (
  <motion.img className={cn('ks-rj-candlestick-image', className)} {...rest} />
)

export const TopPercentContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-percent-container', className)} {...rest} />
)

export const TopPercentNickname = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-percent-nickname', className)} {...rest} />
)

export const TopPercentText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-percent-text', className)} {...rest} />
)

export const TopPercentValue = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-top-percent-value', className)} {...rest} />
)

export const BadgeContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-badge-container', className)} {...rest} />
)

export const BadgeImage = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-badge-image', className)} {...rest} />
)

export const ControlsContainer = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-controls-container', className)} {...rest} />
)

export const ControlButton = ({ className, ...rest }: ComponentPropsWithoutRef<'button'>) => (
  <button className={cn('ks-rj-control-button', className)} {...rest} />
)

export const ShareButtonsContainer = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-share-buttons-container', className)} {...rest} />
)

export const MuteButton = ({ className, ...rest }: ComponentPropsWithoutRef<'button'>) => (
  <button className={cn('ks-rj-mute-button', className)} {...rest} />
)

export const PauseResumeOverlay = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-pause-resume-overlay', className)} {...rest} />
)

export const PauseResumeIcon = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-pause-resume-icon', className)} {...rest} />
)

type ShareButtonProps = ComponentPropsWithoutRef<'button'> & { $isSuccess?: boolean; $isLoading?: boolean }
export const ShareButton = ({ className, $isSuccess, $isLoading, ...rest }: ShareButtonProps) => (
  <button
    className={cn('ks-rj-share-button', className)}
    data-success={$isSuccess ? 'true' : undefined}
    data-loading={$isLoading ? 'true' : undefined}
    {...rest}
  />
)

export const ProgressBarContainer = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-progress-bar-container', className)} {...rest} />
)

export const ProgressBar = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-progress-bar', className)} {...rest} />
)

type ProgressSegmentProps = ComponentPropsWithoutRef<'div'> & { $isActive: boolean }
export const ProgressSegment = ({ className, $isActive: _isActive, ...rest }: ProgressSegmentProps) => (
  <div className={cn('ks-rj-progress-segment', className)} {...rest} />
)

type ProgressSegmentFillProps = HTMLMotionProps<'div'> & { $isActive: boolean }
export const ProgressSegmentFill = ({ className, $isActive, style, ...rest }: ProgressSegmentFillProps) => (
  <motion.div
    className={cn('ks-rj-progress-segment-fill', className)}
    style={{ width: $isActive ? '100%' : '0%', ...style }}
    {...rest}
  />
)

export const CapitalFlowContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-capital-flow-container', className)} {...rest} />
)

export const CapitalFlowText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-capital-flow-text', className)} {...rest} />
)

export const CapitalHighlight = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-capital-highlight', className)} {...rest} />
)

export const NicknameHeader = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-nickname-header', className)} {...rest} />
)

export const TopListContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-list-container', className)} {...rest} />
)

export const TopListTitle = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-list-title', className)} {...rest} />
)

export const TopListItems = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-top-list-items', className)} {...rest} />
)

export const TopListItem = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-top-list-item', className)} {...rest} />
)

export const EmptyItem = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-empty-item', className)} {...rest} />
)

export const TopListRank = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-top-list-rank', className)} {...rest} />
)

export const TopListIconWrapper = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-top-list-icon-wrapper', className)} {...rest} />
)

export const TopListIcon = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-top-list-icon', className)} {...rest} />
)

export const TopListChainIcon = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-top-list-chain-icon', className)} {...rest} />
)

export const TopListName = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-top-list-name', className)} {...rest} />
)

export const MevContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mev-container', className)} {...rest} />
)

export const MevText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mev-text', className)} {...rest} />
)

export const MevTextWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mev-text-wrapper', className)} {...rest} />
)

export const MevFlowLine = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-mev-flow-line', className)} {...rest} />
)

export const MevOutsmarted = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-mev-outsmarted', className)} {...rest} />
)

export const MevFlowHighlight = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-mev-flow-highlight', className)} {...rest} />
)

export const FairflowImage = ({ className, ...rest }: HTMLMotionProps<'img'>) => (
  <motion.img className={cn('ks-rj-fairflow-image', className)} {...rest} />
)

export const FairflowContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-fairflow-container', className)} {...rest} />
)

export const FairflowTitle = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-fairflow-title', className)} {...rest} />
)

export const FairflowHighlight = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-fairflow-highlight', className)} {...rest} />
)

export const FairflowEarned = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-fairflow-earned', className)} {...rest} />
)

export const FairflowRewardLine = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-fairflow-reward-line', className)} {...rest} />
)

export const KemLmIcon = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-kem-lm-icon', className)} {...rest} />
)

export const FairflowRewardValue = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-fairflow-reward-value', className)} {...rest} />
)

export const FairflowRewardLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-fairflow-reward-label', className)} {...rest} />
)

export const FairflowSubtext = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-fairflow-subtext', className)} {...rest} />
)

export const SmarterBannerWrapper = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-smarter-banner-wrapper', className)} {...rest} />
)

export const SmarterBannerBg = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-smarter-banner-bg', className)} {...rest} />
)

export const SmarterBannerText = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-smarter-banner-text', className)} {...rest} />
)

export const SmarterBold = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-smarter-bold', className)} {...rest} />
)

export const SummaryContainer = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-summary-container', className)} {...rest} />
)

export const SummaryNickname = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-nickname', className)} {...rest} />
)

export const SummaryMainRow = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-main-row', className)} {...rest} />
)

export const SummaryBadge = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-summary-badge', className)} {...rest} />
)

export const SummaryStatsColumn = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-stats-column', className)} {...rest} />
)

export const SummaryStatsRow = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-stats-row', className)} {...rest} />
)

export const SummaryStatLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-stat-label', className)} {...rest} />
)

export const SummaryStatValue = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-stat-value', className)} {...rest} />
)

export const SummaryTradesValue = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-trades-value', className)} {...rest} />
)

export const SummaryTradesLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-trades-label', className)} {...rest} />
)

export const SummaryTopBadge = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-top-badge', className)} {...rest} />
)

export const SummaryFavoritesRow = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-favorites-row', className)} {...rest} />
)

export const SummaryFavoriteItem = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-favorite-item', className)} {...rest} />
)

export const SummaryFavoriteLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-favorite-label', className)} {...rest} />
)

export const SummaryFavoriteValue = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-favorite-value', className)} {...rest} />
)

export const SummaryFavoriteIconWrapper = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-favorite-icon-wrapper', className)} {...rest} />
)

export const SummaryFavoriteIcon = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-summary-favorite-icon', className)} {...rest} />
)

export const SummaryFavoriteChainIcon = ({ className, ...rest }: ComponentPropsWithoutRef<'img'>) => (
  <img className={cn('ks-rj-summary-favorite-chain-icon', className)} {...rest} />
)

export const SummaryRewardsSection = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-rewards-section', className)} {...rest} />
)

export const SummaryRewardsValue = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-rewards-value', className)} {...rest} />
)

export const SummaryRewardsLabel = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => (
  <div className={cn('ks-rj-summary-rewards-label', className)} {...rest} />
)

export const SummaryFooter = ({ className, ...rest }: HTMLMotionProps<'div'>) => (
  <motion.div className={cn('ks-rj-summary-footer', className)} {...rest} />
)

export const SummaryFooterLink = ({ className, ...rest }: ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('ks-rj-summary-footer-link', className)} {...rest} />
)
