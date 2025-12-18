import { AnimatePresence, motion } from 'framer-motion'
import { memo, useMemo } from 'react'
import { Pause, Play, SkipBack, SkipForward } from 'react-feather'

import confetti from 'assets/recap/confetti.png'
import customizedKyber from 'assets/recap/customized-kyber.png'
import fireworkBanner from 'assets/recap/firework-banner.png'
import moneyAirdrop from 'assets/recap/money-airdrop.png'
import recapAnimation from 'assets/recap/recap-animation.mp4'
import starsBanner2 from 'assets/recap/stars-banner-2.png'
import starsBanner from 'assets/recap/stars-banner.png'
import {
  BackgroundImage,
  BackgroundOverlayImage,
  CeraFontFace,
  ContentContainer,
  ControlButton,
  ControlsContainer,
  JourneyContainer,
  LogoContainer,
  LogoImage,
  ProgressBar,
  ProgressBarContainer,
  ProgressSegment,
  ProgressSegmentFill,
  VideoBackground,
  VideoOverlay,
  YearTag,
  YearTagBanner,
} from 'components/Recap/RecapJourney.styles'
import {
  CapitalFlowScene,
  FairflowScene,
  FireworkScene,
  MarkScene,
  MevScene,
  SmarterBannerScene,
  StatsScene,
  SummaryScene,
  TopChainsScene,
  TopPercentBadgeScene,
  TopTokensScene,
  TradingStatsScene,
  VideoScene,
} from 'components/Recap/scenes'
import { RecapJourneyProps } from 'components/Recap/types'
import useRecapTimeline from 'components/Recap/useRecapTimeline'

function RecapJourney({
  nickname,
  totalVolume,
  totalUsers,
  tradingVolume,
  txCount,
  top,
  topChains,
  topTokens,
  totalRewards,
}: RecapJourneyProps) {
  const { scene, currentPart, partProgress, sceneFlags, isPaused, togglePause, goToNextPart, goToPrevPart } =
    useRecapTimeline()

  const {
    isFireworkScene,
    isVideoScene,
    isStarsScene,
    isSmarterFinaleScene,
    isSummaryScene,
    isMarkScene,
    isTradingStatsScene,
    isTopPercentScene,
    isBadgeScene,
    isCapitalFlowScene,
    isTopChainsScene,
    isTopTokensScene,
    isMevBotsScene,
    isMevFlowScene,
    isFairflowRewardsScene,
    isLiquiditySmarterScene,
  } = sceneFlags

  // Memoize background image source
  const starsBackgroundSrc = useMemo(() => (currentPart === 1 ? starsBanner : starsBanner2), [currentPart])

  return (
    <>
      <CeraFontFace />
      <JourneyContainer>
        {/* Preload video */}
        <video preload="auto" style={{ display: 'none' }}>
          <source src={recapAnimation} type="video/mp4" />
        </video>

        <AnimatePresence mode="wait">
          {isFireworkScene && (
            <motion.div
              key="firework-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BackgroundImage src={fireworkBanner} />
            </motion.div>
          )}

          {isVideoScene && (
            <motion.div
              key="video-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <VideoBackground autoPlay loop muted playsInline preload="auto">
                <source src={recapAnimation} type="video/mp4" />
              </VideoBackground>
              <VideoOverlay />
            </motion.div>
          )}

          {isStarsScene && (
            <motion.div
              key="stars-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <BackgroundImage src={starsBackgroundSrc} />
            </motion.div>
          )}

          {(isMarkScene || isTradingStatsScene) && (
            <motion.div
              key="money-airdrop-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BackgroundOverlayImage src={moneyAirdrop} alt="" />
            </motion.div>
          )}

          {(isTopPercentScene || isBadgeScene) && (
            <motion.div
              key="confetti-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BackgroundOverlayImage src={confetti} alt="" />
            </motion.div>
          )}

          {(isMevBotsScene || isMevFlowScene || isFairflowRewardsScene || isLiquiditySmarterScene) && (
            <motion.div
              key="customized-kyber-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <BackgroundOverlayImage
                src={customizedKyber}
                alt=""
                style={{
                  opacity: 0.05,
                  top: '10%',
                  left: '10%',
                  right: '10%',
                  bottom: '10%',
                  width: '80%',
                  height: '80%',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <LogoContainer>
          <LogoImage src={'/logo-dark.svg'} alt="logo" />
        </LogoContainer>

        {(isVideoScene ||
          isStarsScene ||
          isSmarterFinaleScene ||
          isMarkScene ||
          isTradingStatsScene ||
          isTopPercentScene ||
          isBadgeScene ||
          isMevBotsScene ||
          isMevFlowScene ||
          isFairflowRewardsScene) && (
          <YearTag>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <YearTagBanner $isFinale={isSmarterFinaleScene}>2025</YearTagBanner>
            </motion.div>
          </YearTag>
        )}

        <ContentContainer>
          {/* Firework scenes */}
          {(scene === 'firework-2025' || scene === 'year-of-flow') && <FireworkScene scene={scene} />}

          {/* Video scenes */}
          {isVideoScene && <VideoScene scene={scene} nickname={nickname} />}

          {/* Stars scene */}
          {scene === 'stars-stats' && <StatsScene totalVolume={totalVolume} totalUsers={totalUsers} />}

          {/* Scene 2: You made the MARK */}
          {isMarkScene && <MarkScene />}

          {/* Scene 3: Trading stats */}
          {isTradingStatsScene && <TradingStatsScene tradingVolume={tradingVolume} txCount={txCount} />}

          {/* Scene 4 & 5: Top X% and Badge together */}
          {(isTopPercentScene || isBadgeScene) && <TopPercentBadgeScene top={top} isBadgeScene={isBadgeScene} />}

          {/* Part 3 Scene 1: Capital Flow */}
          {isCapitalFlowScene && <CapitalFlowScene />}

          {/* Part 3 Scene 2: Top Chains */}
          {isTopChainsScene && <TopChainsScene nickname={nickname} topChains={topChains} />}

          {/* Part 3 Scene 3: Top Tokens */}
          {isTopTokensScene && <TopTokensScene nickname={nickname} topTokens={topTokens} />}

          {/* Part 4 Scene 1 & 2: MEV Bots + Flow */}
          {(isMevBotsScene || isMevFlowScene) && <MevScene isMevFlowScene={isMevFlowScene} />}

          {/* Part 4 Scene 3 & 4: FairFlow Rewards + Smarter Banner */}
          {(isFairflowRewardsScene || isLiquiditySmarterScene) && <FairflowScene totalRewards={totalRewards} />}

          {/* Summary Scene (Part 5) */}
          {isSummaryScene && (
            <SummaryScene
              nickname={nickname}
              tradingVolume={tradingVolume}
              txCount={txCount}
              top={top}
              topChains={topChains}
              topTokens={topTokens}
              totalRewards={totalRewards}
            />
          )}
        </ContentContainer>

        {/* Smarter Banner with expanding background */}
        {(isLiquiditySmarterScene || isSmarterFinaleScene) && (
          <SmarterBannerScene isSmarterFinaleScene={isSmarterFinaleScene} />
        )}

        {/* Controls */}
        <ControlsContainer className="controls-container">
          <ControlButton onClick={goToPrevPart} aria-label="Previous part">
            <SkipBack />
          </ControlButton>
          <ControlButton onClick={togglePause} aria-label={isPaused ? 'Play' : 'Pause'}>
            {isPaused ? <Play /> : <Pause />}
          </ControlButton>
          <ControlButton onClick={goToNextPart} aria-label="Next part">
            <SkipForward />
          </ControlButton>
        </ControlsContainer>

        {/* Progress Bar */}
        <ProgressBarContainer>
          <ProgressBar>
            <ProgressSegment $isActive={partProgress.part1 > 0}>
              <ProgressSegmentFill
                $isActive={partProgress.part1 > 0}
                style={{ width: `${partProgress.part1 * 100}%` }}
              />
            </ProgressSegment>
            <ProgressSegment $isActive={partProgress.part2 > 0}>
              <ProgressSegmentFill
                $isActive={partProgress.part2 > 0}
                style={{ width: `${partProgress.part2 * 100}%` }}
              />
            </ProgressSegment>
            <ProgressSegment $isActive={partProgress.part3 > 0}>
              <ProgressSegmentFill
                $isActive={partProgress.part3 > 0}
                style={{ width: `${partProgress.part3 * 100}%` }}
              />
            </ProgressSegment>
            <ProgressSegment $isActive={partProgress.part4 > 0}>
              <ProgressSegmentFill
                $isActive={partProgress.part4 > 0}
                style={{ width: `${partProgress.part4 * 100}%` }}
              />
            </ProgressSegment>
            <ProgressSegment $isActive={partProgress.part5 > 0}>
              <ProgressSegmentFill
                $isActive={partProgress.part5 > 0}
                style={{ width: `${partProgress.part5 * 100}%` }}
              />
            </ProgressSegment>
          </ProgressBar>
        </ProgressBarContainer>
      </JourneyContainer>
    </>
  )
}

export default memo(RecapJourney)
