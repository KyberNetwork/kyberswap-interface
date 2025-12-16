import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import fireworkBanner from 'assets/recap/firework-banner.png'
import recapAnimation from 'assets/recap/recap-animation.mp4'
import starsBanner from 'assets/recap/stars-banner.png'
import {
  BackgroundImage,
  ButText,
  ButYouWrapper,
  CeraFontFace,
  ContentContainer,
  FireworkContentWrapper,
  FlowText,
  JourneyContainer,
  LabelText,
  LogoContainer,
  LogoImage,
  NavigatedText,
  NavigatedWrapper,
  NicknameText,
  StatsContainer,
  StatsText,
  StormText,
  TextLine,
  UsersText,
  VideoBackground,
  VideoOverlay,
  VideoTextWrapper,
  VolumeText,
  Year2025,
  YearOfFlow,
  YearTag,
  YearTagBanner,
  YouText,
} from 'components/Recap/RecapJourney.styles'

type Scene =
  | 'firework-2025'
  | 'year-of-flow'
  | 'video-chaotic'
  | 'video-you'
  | 'video-nickname'
  | 'video-navigated'
  | 'stars-stats'

interface RecapJourneyProps {
  nickname: string
  totalVolume: number
  totalUsers: number
  onClose?: () => void
}

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toFixed(2)}`
}

const formatUsers = (users: number): string => {
  if (users >= 1e6) {
    return `${(users / 1e6).toFixed(1)}M`
  }
  if (users >= 1e3) {
    return `${(users / 1e3).toFixed(1)}K`
  }
  return users.toString()
}

export default function RecapJourney({ nickname, totalVolume, totalUsers }: RecapJourneyProps) {
  const [scene, setScene] = useState<Scene>('firework-2025')

  useEffect(() => {
    const timeline = [
      { scene: 'year-of-flow' as Scene, delay: 2000 },
      { scene: 'video-chaotic' as Scene, delay: 5500 },
      { scene: 'video-you' as Scene, delay: 7000 },
      { scene: 'video-nickname' as Scene, delay: 7500 },
      { scene: 'video-navigated' as Scene, delay: 9000 },
      { scene: 'stars-stats' as Scene, delay: 12000 },
    ]

    const timers = timeline.map(({ scene: nextScene, delay }) =>
      setTimeout(() => {
        setScene(nextScene)
      }, delay),
    )

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const isFireworkScene = scene === 'firework-2025' || scene === 'year-of-flow'
  const isVideoScene = scene.startsWith('video-')
  const isStarsScene = scene === 'stars-stats'

  return (
    <>
      <CeraFontFace />
      <JourneyContainer>
        <AnimatePresence mode="wait">
          {isFireworkScene && (
            <motion.div
              key="firework-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
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
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <VideoBackground autoPlay loop muted playsInline>
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
              <BackgroundImage src={starsBanner} />
            </motion.div>
          )}
        </AnimatePresence>

        <LogoContainer>
          <LogoImage src={'/logo-dark.svg'} alt="logo" />
        </LogoContainer>

        {(isVideoScene || isStarsScene) && (
          <YearTag>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <YearTagBanner>2025</YearTagBanner>
            </motion.div>
          </YearTag>
        )}

        <ContentContainer>
          {/* Firework scenes */}
          {(scene === 'firework-2025' || scene === 'year-of-flow') && (
            <FireworkContentWrapper>
              <Year2025
                key="2025"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              >
                2025
              </Year2025>
              <YearOfFlow
                key="year-of-flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: scene === 'year-of-flow' ? 1 : 0,
                  y: scene === 'year-of-flow' ? 0 : 20,
                }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                style={{ visibility: scene === 'year-of-flow' ? 'visible' : 'hidden' }}
              >
                Year of the <FlowText>FLOW</FlowText>
              </YearOfFlow>
            </FireworkContentWrapper>
          )}

          {/* Video scenes */}
          {isVideoScene && (
            <VideoTextWrapper>
              <TextLine
                key="chaotic"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                The market was chaotic
              </TextLine>
              <ButYouWrapper
                key="you-line"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: scene === 'video-you' || scene === 'video-nickname' || scene === 'video-navigated' ? 1 : 0,
                  y: scene === 'video-you' || scene === 'video-nickname' || scene === 'video-navigated' ? 0 : 20,
                }}
                transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
                style={{
                  visibility:
                    scene === 'video-you' || scene === 'video-nickname' || scene === 'video-navigated'
                      ? 'visible'
                      : 'hidden',
                }}
              >
                <ButText>But</ButText>
                <YouText>YOU</YouText>
              </ButYouWrapper>
              <NicknameText
                key="nickname"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: scene === 'video-nickname' || scene === 'video-navigated' ? 1 : 0,
                  scale: scene === 'video-nickname' || scene === 'video-navigated' ? 1 : 0.8,
                }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  visibility: scene === 'video-nickname' || scene === 'video-navigated' ? 'visible' : 'hidden',
                }}
              >
                {nickname || 'Anonymous'}
              </NicknameText>
              <NavigatedWrapper
                key="navigated"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: scene === 'video-navigated' ? 1 : 0,
                  y: scene === 'video-navigated' ? 0 : 20,
                }}
                transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
                style={{ visibility: scene === 'video-navigated' ? 'visible' : 'hidden' }}
              >
                <NavigatedText>NAVIGATED</NavigatedText>
                <StormText> the storm</StormText>
              </NavigatedWrapper>
            </VideoTextWrapper>
          )}

          {/* Stars scene */}
          {scene === 'stars-stats' && (
            <StatsContainer
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <StatsText
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                You helped power KyberSwap to
              </StatsText>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
              >
                <VolumeText>{formatVolume(totalVolume)}</VolumeText>
                <LabelText>volume</LabelText>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
              >
                <LabelText>&</LabelText>
                <UsersText>{formatUsers(totalUsers)}</UsersText>
                <LabelText>users</LabelText>
              </motion.div>
            </StatsContainer>
          )}
        </ContentContainer>
      </JourneyContainer>
    </>
  )
}
