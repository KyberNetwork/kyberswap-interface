import { AnimatePresence, motion } from 'framer-motion'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Download, Loader, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'react-feather'

import confetti from 'assets/recap/confetti.png'
import customizedKyber from 'assets/recap/customized-kyber.png'
import fireworkBanner from 'assets/recap/firework-banner.png'
import moneyAirdrop from 'assets/recap/money-airdrop.png'
import recapAnimation from 'assets/recap/recap-animation.mp4'
import sound from 'assets/recap/sound.mp3'
import starsBanner from 'assets/recap/stars-banner.png'
import stars from 'assets/recap/stars.png'
import xIcon from 'assets/recap/x.png'
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
  MuteButton,
  PauseResumeIcon,
  PauseResumeOverlay,
  ProgressBar,
  ProgressBarContainer,
  ProgressSegment,
  ProgressSegmentFill,
  ShareButton,
  ShareButtonsContainer,
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
import { captureScreenshot, copyImageToClipboard, downloadImage } from 'components/Recap/utils'

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
  const { scene, partProgress, sceneFlags, isPaused, togglePause, goToNextPart, goToPrevPart } = useRecapTimeline()

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

  // Ref for container to capture screenshot
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isFirstMountRef = useRef(true)
  const hasInitializedRef = useRef(false)
  const prevIsPausedRef = useRef<boolean | null>(null)
  const [isMuted, setIsMuted] = useState(true) // Default to muted
  const [showPauseResumeIcon, setShowPauseResumeIcon] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [copyLoading, setCopyLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Initialize and control audio
  useEffect(() => {
    // Create audio element
    const audio = new Audio(sound)
    audio.loop = true
    audio.volume = 0.5 // Set volume to 50%
    audioRef.current = audio

    if (!isMuted) {
      const playAudio = async () => {
        try {
          await audio.play()
        } catch (error) {
          console.error('Failed to play audio:', error)
        }
      }
      playAudio()
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
      audioRef.current = null
    }
  }, [isMuted])

  // Sync audio with pause/resume
  useEffect(() => {
    if (!audioRef.current || isMuted) return

    if (isPaused) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(error => {
        console.error('Failed to resume audio:', error)
      })
    }
  }, [isPaused, isMuted])

  // Toggle mute/unmute
  const handleToggleMute = () => {
    if (!audioRef.current) return

    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    if (newMutedState) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error)
      })
    }
  }

  // Check if current scene should show share buttons
  const shouldShowShareButtons = useMemo(() => {
    return (
      scene === 'stars-stats' ||
      scene === 'badge' ||
      scene === 'top-chains' ||
      scene === 'top-tokens' ||
      scene === 'fairflow-rewards' ||
      scene === 'summary'
    )
  }, [scene])

  const handleCopyImage = async () => {
    if (!containerRef.current || isCapturing) return

    try {
      setIsCapturing(true)
      setCopyLoading(true)
      const dataUrl = await captureScreenshot(containerRef.current)
      await copyImageToClipboard(dataUrl)
      setCopyLoading(false)
      setCopySuccess(true)
      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy image:', error)
      setCopyLoading(false)
    } finally {
      setIsCapturing(false)
    }
  }

  // Handle download image
  const handleDownloadImage = async () => {
    if (!containerRef.current || isCapturing) return

    try {
      setIsCapturing(true)
      setDownloadLoading(true)
      const dataUrl = await captureScreenshot(containerRef.current)
      const filename = `kyberswap-recap-${scene}-${Date.now()}.png`
      downloadImage(dataUrl, filename)
      setDownloadLoading(false)
      setDownloadSuccess(true)
      // Reset success state after 2 seconds
      setTimeout(() => {
        setDownloadSuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to download image:', error)
      setDownloadLoading(false)
    } finally {
      setIsCapturing(false)
    }
  }

  // Handle share to X.com
  const handleShareToX = () => {
    const shareText = encodeURIComponent('Watch your 2025 Journey 👇 kyberswap.com/2025-journey')
    const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  // Handle click on screen to control recap
  const handleScreenClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent if clicking on interactive elements
    const target = event.target as HTMLElement
    if (
      target.closest('.controls-container') ||
      target.closest('.share-buttons-container') ||
      target.closest('.mute-button') ||
      target.closest('.progress-bar-container')
    ) {
      return
    }

    // Get click position
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width

    // Determine action based on position
    if (relativeX < 0.3) {
      // Left 30% - go to previous
      goToPrevPart()
    } else if (relativeX > 0.7) {
      // Right 30% - go to next
      goToNextPart()
    } else {
      // Center 40% - toggle pause/resume
      togglePause()
    }
  }

  // Handle touch on screen to control recap
  const handleScreenTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    // Prevent if touching on interactive elements
    const target = event.target as HTMLElement
    if (
      target.closest('.controls-container') ||
      target.closest('.share-buttons-container') ||
      target.closest('.mute-button') ||
      target.closest('.progress-bar-container')
    ) {
      return
    }

    // Only handle single touch
    if (event.touches.length !== 1) return

    // Get touch position
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const touch = event.touches[0]
    const relativeX = (touch.clientX - rect.left) / rect.width

    // Determine action based on position
    if (relativeX < 0.3) {
      // Left 30% - go to previous
      event.preventDefault()
      goToPrevPart()
    } else if (relativeX > 0.7) {
      // Right 30% - go to next
      event.preventDefault()
      goToNextPart()
    } else {
      // Center 40% - toggle pause/resume
      event.preventDefault()
      togglePause()
    }
  }

  // Reset success and loading states when scene changes
  useEffect(() => {
    setCopySuccess(false)
    setCopyLoading(false)
    setDownloadSuccess(false)
    setDownloadLoading(false)
  }, [scene])

  // Initialize prevIsPausedRef on first mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      prevIsPausedRef.current = isPaused
      hasInitializedRef.current = true
      // Wait a bit before allowing icon to show (to avoid showing on initial mount)
      setTimeout(() => {
        isFirstMountRef.current = false
      }, 500)
    }
  }, [isPaused])

  // Show pause/resume icon when isPaused changes (but not on first mount or initial changes)
  useEffect(() => {
    // Skip showing icon on first mount or if still initializing
    if (isFirstMountRef.current || !hasInitializedRef.current) {
      prevIsPausedRef.current = isPaused
      return undefined
    }

    // Only show icon if isPaused actually changed from previous value
    if (prevIsPausedRef.current !== null && prevIsPausedRef.current !== isPaused) {
      setShowPauseResumeIcon(true)
      const timer = setTimeout(() => {
        setShowPauseResumeIcon(false)
      }, 1000) // Show for 1 second

      prevIsPausedRef.current = isPaused
      return () => clearTimeout(timer)
    }

    prevIsPausedRef.current = isPaused
    return undefined
  }, [isPaused])

  return (
    <>
      <CeraFontFace />
      <JourneyContainer ref={containerRef} onClick={handleScreenClick} onTouchStart={handleScreenTouch}>
        {/* Mute Button */}
        <MuteButton className="mute-button" onClick={handleToggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX /> : <Volume2 />}
        </MuteButton>

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

          {scene === 'stars-stats' && (
            <motion.div
              key="stars-stats-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f0f0f' }}
            >
              <BackgroundOverlayImage src={stars} alt="" />
            </motion.div>
          )}

          {isStarsScene && scene !== 'stars-stats' && (
            <motion.div
              key="stars-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <BackgroundImage src={starsBanner} />
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
          isLiquiditySmarterScene ||
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
          {(isMevBotsScene || isMevFlowScene) && (
            <MevScene isMevFlowScene={isMevFlowScene} isFairflowRewardsScene={isFairflowRewardsScene} />
          )}

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

        {/* Share Buttons */}
        {shouldShowShareButtons && (
          <ShareButtonsContainer className="share-buttons-container">
            <ShareButton
              onClick={handleCopyImage}
              aria-label="Copy image"
              disabled={isCapturing}
              $isSuccess={copySuccess}
              $isLoading={copyLoading}
            >
              {copyLoading ? <Loader className="loading-spinner" /> : copySuccess ? <Check /> : <Copy />}
            </ShareButton>
            <ShareButton
              onClick={handleDownloadImage}
              aria-label="Download image"
              disabled={isCapturing}
              $isSuccess={downloadSuccess}
              $isLoading={downloadLoading}
            >
              {downloadLoading ? <Loader className="loading-spinner" /> : downloadSuccess ? <Check /> : <Download />}
            </ShareButton>
            {scene === 'summary' && (
              <ShareButton onClick={handleShareToX} aria-label="Share to X">
                <img src={xIcon} alt="X" style={{ width: '14px', height: '14px' }} />
              </ShareButton>
            )}
          </ShareButtonsContainer>
        )}

        {/* Progress Bar */}
        <ProgressBarContainer className="progress-bar-container">
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

        {/* Pause/Resume Icon Overlay */}
        <AnimatePresence>
          {showPauseResumeIcon && (
            <PauseResumeOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PauseResumeIcon
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {isPaused ? <Play /> : <Pause />}
              </PauseResumeIcon>
            </PauseResumeOverlay>
          )}
        </AnimatePresence>
      </JourneyContainer>
    </>
  )
}

export default memo(RecapJourney)
