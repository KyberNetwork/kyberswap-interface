import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Flex } from 'rebass'

import badgeDiamond from 'assets/recap/badge-diamond.png'
import badgeMover from 'assets/recap/badge-mover.png'
import badgeWhale from 'assets/recap/badge-whale.png'
import fireworkBanner from 'assets/recap/firework-banner.png'
import recapAnimation from 'assets/recap/recap-animation.mp4'
import starsBanner2 from 'assets/recap/stars-banner-2.png'
import starsBanner from 'assets/recap/stars-banner.png'
import kemLmIcon from 'assets/svg/kyber/kemLm.svg'
import {
  BackgroundImage,
  BadgeContainer,
  BadgeImage,
  ButText,
  ButYouWrapper,
  CapitalFlowContainer,
  CapitalFlowText,
  CapitalHighlight,
  CeraFontFace,
  ContentContainer,
  FairflowContainer,
  FairflowEarned,
  FairflowHighlight,
  FairflowRewardLabel,
  FairflowRewardLine,
  FairflowRewardValue,
  FairflowSubtext,
  FairflowTitle,
  FireworkContentWrapper,
  FlowText,
  JourneyContainer,
  KemLmIcon,
  LabelText,
  LogoContainer,
  LogoImage,
  MarkContainer,
  MarkHighlight,
  MarkText,
  MevContainer,
  MevFlowHighlight,
  MevFlowLine,
  MevOutsmarted,
  MevText,
  MevTextWrapper,
  NavigatedText,
  NavigatedWrapper,
  NicknameText,
  ProgressBar,
  ProgressBarContainer,
  ProgressSegment,
  ProgressSegmentFill,
  SmarterBannerBg,
  SmarterBannerText,
  SmarterBannerWrapper,
  SmarterBold,
  StatsContainer,
  StatsText,
  StormText,
  TextLine,
  TopListContainer,
  TopListIcon,
  TopListItem,
  TopListItems,
  TopListName,
  TopListRank,
  TopListTitle,
  TopPercentContainer,
  TopPercentText,
  TopPercentValue,
  TradingStatLabel,
  TradingStatLabel2,
  TradingStatLine,
  TradingStatLine2,
  TradingStatValue,
  TradingStatValue2,
  TradingStatsContainer,
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
  | 'mark-on-market'
  | 'trading-stats'
  | 'top-percent'
  | 'badge'
  | 'capital-flow'
  | 'top-chains'
  | 'top-tokens'
  | 'mev-bots'
  | 'mev-flow'
  | 'fairflow-rewards'
  | 'liquidity-smarter'
  | 'smarter-finale'

interface TopChain {
  chainId: number
  name: string
  icon: string
}

interface TopToken {
  symbol: string
  logo: string
}

interface RecapJourneyProps {
  nickname: string
  totalVolume: number
  totalUsers: number
  tradingVolume: number
  txCount: number
  top: number
  topChains: TopChain[]
  topTokens: TopToken[]
  totalRewards: number
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

const formatTradingVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toLocaleString()}`
}

const getBadgeImage = (top: number): string => {
  if (top >= 1 && top <= 5) {
    return badgeWhale
  }
  if (top >= 6 && top <= 20) {
    return badgeDiamond
  }
  return badgeMover
}

export default function RecapJourney({
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
  const [scene, setScene] = useState<Scene>('firework-2025')
  const [startTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  useEffect(() => {
    const timeline = [
      { scene: 'year-of-flow' as Scene, delay: 1500 },
      { scene: 'video-chaotic' as Scene, delay: 4000 },
      { scene: 'video-you' as Scene, delay: 5500 },
      { scene: 'video-nickname' as Scene, delay: 6000 },
      { scene: 'video-navigated' as Scene, delay: 7500 },
      { scene: 'stars-stats' as Scene, delay: 10500 },
      { scene: 'mark-on-market' as Scene, delay: 17000 },
      { scene: 'trading-stats' as Scene, delay: 19000 },
      { scene: 'top-percent' as Scene, delay: 22000 },
      { scene: 'badge' as Scene, delay: 24000 },
      { scene: 'capital-flow' as Scene, delay: 27000 },
      { scene: 'top-chains' as Scene, delay: 30000 },
      { scene: 'top-tokens' as Scene, delay: 33000 },
      { scene: 'mev-bots' as Scene, delay: 36000 },
      { scene: 'mev-flow' as Scene, delay: 39000 },
      { scene: 'fairflow-rewards' as Scene, delay: 42000 },
      { scene: 'liquidity-smarter' as Scene, delay: 47000 },
      { scene: 'smarter-finale' as Scene, delay: 50000 },
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

  // Update elapsed time continuously for smooth progress
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 50) // Update every 50ms for smooth animation

    return () => clearInterval(interval)
  }, [startTime])

  const isFireworkScene = scene === 'firework-2025' || scene === 'year-of-flow'
  const isVideoScene = scene.startsWith('video-')
  const isStarsScene =
    scene === 'stars-stats' ||
    scene === 'mark-on-market' ||
    scene === 'trading-stats' ||
    scene === 'top-percent' ||
    scene === 'badge' ||
    scene === 'capital-flow' ||
    scene === 'top-chains' ||
    scene === 'top-tokens' ||
    scene === 'mev-bots' ||
    scene === 'mev-flow' ||
    scene === 'fairflow-rewards' ||
    scene === 'liquidity-smarter'
  const isSmarterFinaleScene = scene === 'smarter-finale'
  const isMarkScene = scene === 'mark-on-market'
  const isTradingStatsScene = scene === 'trading-stats'
  const isTopPercentScene = scene === 'top-percent'
  const isBadgeScene = scene === 'badge'
  const isCapitalFlowScene = scene === 'capital-flow'
  const isTopChainsScene = scene === 'top-chains'
  const isTopTokensScene = scene === 'top-tokens'
  const isMevBotsScene = scene === 'mev-bots'
  const isMevFlowScene = scene === 'mev-flow'
  const isFairflowRewardsScene = scene === 'fairflow-rewards'
  const isLiquiditySmarterScene = scene === 'liquidity-smarter'

  // Calculate current part (1, 2, 3, or 4) and progress based on elapsed time
  const PART1_DURATION = 17000 // 17 seconds (from start to mark-on-market)
  const PART2_DURATION = 10000 // 10 seconds (from mark-on-market to capital-flow)
  const PART3_DURATION = 9000 // 9 seconds (from capital-flow to mev-bots)
  const PART4_DURATION = 17000 // 17 seconds (from mev-bots to end)

  const part1Scenes: Scene[] = [
    'firework-2025',
    'year-of-flow',
    'video-chaotic',
    'video-you',
    'video-nickname',
    'video-navigated',
    'stars-stats',
  ]
  const part2Scenes: Scene[] = ['mark-on-market', 'trading-stats', 'top-percent', 'badge']
  const part3Scenes: Scene[] = ['capital-flow', 'top-chains', 'top-tokens']
  const currentPart = part1Scenes.includes(scene)
    ? 1
    : part2Scenes.includes(scene)
    ? 2
    : part3Scenes.includes(scene)
    ? 3
    : 4

  const part1Progress = Math.min(elapsedTime / PART1_DURATION, 1)
  const part2Progress = elapsedTime > PART1_DURATION ? Math.min((elapsedTime - PART1_DURATION) / PART2_DURATION, 1) : 0
  const part3Progress =
    elapsedTime > PART1_DURATION + PART2_DURATION
      ? Math.min((elapsedTime - PART1_DURATION - PART2_DURATION) / PART3_DURATION, 1)
      : 0
  const part4Progress =
    elapsedTime > PART1_DURATION + PART2_DURATION + PART3_DURATION
      ? Math.min((elapsedTime - PART1_DURATION - PART2_DURATION - PART3_DURATION) / PART4_DURATION, 1)
      : 0

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
              <BackgroundImage src={currentPart === 1 ? starsBanner : starsBanner2} />
            </motion.div>
          )}
        </AnimatePresence>

        <LogoContainer>
          <LogoImage src={'/logo-dark.svg'} alt="logo" />
        </LogoContainer>

        {(isVideoScene || isStarsScene || isSmarterFinaleScene) && (
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
          {(scene === 'firework-2025' || scene === 'year-of-flow') && (
            <FireworkContentWrapper>
              <Year2025
                key="2025"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
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
                transition={{ delay: 1.6, duration: 0.7, ease: 'easeOut' }}
              >
                <VolumeText>{formatVolume(totalVolume)}</VolumeText>
                <LabelText>volume</LabelText>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.8, duration: 0.7, ease: 'easeOut' }}
              >
                <LabelText>&</LabelText>
                <UsersText>{formatUsers(totalUsers)}</UsersText>
                <LabelText>users</LabelText>
              </motion.div>
            </StatsContainer>
          )}

          {/* Scene 2: You made the MARK */}
          {isMarkScene && (
            <MarkContainer
              key="mark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <MarkText
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                You made your <MarkHighlight>MARK</MarkHighlight> on the market
              </MarkText>
            </MarkContainer>
          )}

          {/* Scene 3: Trading stats */}
          {isTradingStatsScene && (
            <TradingStatsContainer
              key="trading-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <TradingStatLine
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                <TradingStatLabel>You moved</TradingStatLabel>
                <TradingStatValue>{formatTradingVolume(tradingVolume)}</TradingStatValue>
              </TradingStatLine>
              <TradingStatLine2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7, ease: 'easeOut' }}
              >
                <Flex alignItems="flex-end" sx={{ gap: '6px' }}>
                  <TradingStatLabel>Executed</TradingStatLabel>
                  <TradingStatValue2>{txCount.toLocaleString()}</TradingStatValue2>
                </Flex>
                <TradingStatLabel2>specific trades</TradingStatLabel2>
              </TradingStatLine2>
            </TradingStatsContainer>
          )}

          {/* Scene 4 & 5: Top X% and Badge together */}
          {(isTopPercentScene || isBadgeScene) && (
            <motion.div
              key="top-percent-badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                marginTop: isBadgeScene ? '-120px' : '0',
              }}
            >
              <TopPercentContainer
                animate={{
                  opacity: 1,
                  y: isBadgeScene ? -60 : 0,
                }}
                transition={{
                  opacity: { duration: 0.8, ease: 'easeOut' },
                  y: { duration: 0.6, ease: 'easeOut' },
                }}
              >
                <TopPercentText>
                  In the <TopPercentValue>Top {top}%</TopPercentValue> of KyberSwap Traders
                </TopPercentText>
              </TopPercentContainer>
              <BadgeContainer
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{
                  opacity: isBadgeScene ? 1 : 0,
                  scale: isBadgeScene ? 1 : 0.5,
                  y: isBadgeScene ? 0 : 50,
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  top: '75%',
                  pointerEvents: isBadgeScene ? 'auto' : 'none',
                }}
              >
                <BadgeImage src={getBadgeImage(top)} alt="Achievement badge" />
              </BadgeContainer>
            </motion.div>
          )}

          {/* Part 3 Scene 1: Capital Flow */}
          {isCapitalFlowScene && (
            <CapitalFlowContainer
              key="capital-flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <CapitalFlowText
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                Here&apos;s where your
              </CapitalFlowText>
              <CapitalHighlight
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                capital
              </CapitalHighlight>
              <CapitalFlowText
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              >
                truly flowed.
              </CapitalFlowText>
            </CapitalFlowContainer>
          )}

          {/* Part 3 Scene 2: Top Chains */}
          {isTopChainsScene && (
            <TopListContainer
              key="top-chains"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <TopListTitle
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                Top Networks Traded
              </TopListTitle>
              <TopListItems>
                {topChains.slice(0, 3).map((chain, index) => (
                  <TopListItem
                    key={chain.chainId}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.2, duration: 0.6, ease: 'easeOut' }}
                  >
                    <TopListRank>{index + 1}</TopListRank>
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <TopListIcon src={chain.icon} alt={chain.name} />
                      <TopListName>{chain.name}</TopListName>
                    </Flex>
                  </TopListItem>
                ))}
              </TopListItems>
            </TopListContainer>
          )}

          {/* Part 3 Scene 3: Top Tokens */}
          {isTopTokensScene && (
            <TopListContainer
              key="top-tokens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <TopListTitle
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                Top Tokens Traded
              </TopListTitle>
              <TopListItems>
                {topTokens.slice(0, 5).map((token, index) => (
                  <TopListItem
                    key={token.symbol}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.15, duration: 0.6, ease: 'easeOut' }}
                  >
                    <TopListRank>{index + 1}</TopListRank>
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <TopListIcon src={token.logo} alt={token.symbol} />
                      <TopListName>{token.symbol}</TopListName>
                    </Flex>
                  </TopListItem>
                ))}
              </TopListItems>
            </TopListContainer>
          )}

          {/* Part 4 Scene 1 & 2: MEV Bots + Flow */}
          {(isMevBotsScene || isMevFlowScene) && (
            <MevContainer
              key="mev-combined"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <MevTextWrapper animate={{ y: isMevFlowScene ? -40 : 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                <MevText
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  While others
                </MevText>
                <MevText
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                >
                  fought MEV bots...
                </MevText>
              </MevTextWrapper>
              <MevFlowLine
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: isMevFlowScene ? 1 : 0, y: isMevFlowScene ? 0 : 30 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ visibility: isMevFlowScene ? 'visible' : 'hidden' }}
              >
                you <MevOutsmarted>outsmarted</MevOutsmarted> the <MevFlowHighlight>FLOW</MevFlowHighlight>
              </MevFlowLine>
            </MevContainer>
          )}

          {/* Part 4 Scene 3 & 4: FairFlow Rewards + Smarter Banner */}
          {(isFairflowRewardsScene || isLiquiditySmarterScene) && (
            <FairflowContainer
              key="fairflow-combined"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <FairflowTitle
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                Your <FairflowHighlight>FairFlow</FairflowHighlight> positions
              </FairflowTitle>
              <FairflowEarned
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              >
                earned
              </FairflowEarned>
              <FairflowRewardLine
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <KemLmIcon src={kemLmIcon} alt="reward" />
                <FairflowRewardValue>${totalRewards.toLocaleString()}</FairflowRewardValue>
                <FairflowRewardLabel>in Rewards</FairflowRewardLabel>
              </FairflowRewardLine>
              <FairflowSubtext
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
              >
                Equilibrium Gain + Liquidity Mining
              </FairflowSubtext>
            </FairflowContainer>
          )}
        </ContentContainer>

        {/* Smarter Banner with expanding background */}
        {(isLiquiditySmarterScene || isSmarterFinaleScene) && (
          <SmarterBannerWrapper>
            <SmarterBannerBg
              initial={{
                width: 'auto',
                height: 'auto',
                bottom: 40,
                left: '50%',
                x: '-50%',
                borderRadius: 8,
              }}
              animate={
                isSmarterFinaleScene
                  ? {
                      width: '100%',
                      height: '100%',
                      bottom: 0,
                      left: '50%',
                      x: '-50%',
                      borderRadius: 0,
                    }
                  : {
                      width: 'auto',
                      height: 'auto',
                      bottom: 40,
                      left: '50%',
                      x: '-50%',
                      borderRadius: 8,
                    }
              }
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <SmarterBannerText
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: isSmarterFinaleScene ? 1.3 : 1 }}
                transition={{ duration: 0.8, ease: isSmarterFinaleScene ? 'easeOut' : undefined }}
              >
                That&apos;s your liquidity working <SmarterBold>smarter</SmarterBold>
              </SmarterBannerText>
            </SmarterBannerBg>
          </SmarterBannerWrapper>
        )}

        {/* Progress Bar */}
        <ProgressBarContainer>
          <ProgressBar>
            <ProgressSegment $isActive={part1Progress > 0}>
              <ProgressSegmentFill $isActive={part1Progress > 0} style={{ width: `${part1Progress * 100}%` }} />
            </ProgressSegment>
            <ProgressSegment $isActive={part2Progress > 0}>
              <ProgressSegmentFill $isActive={part2Progress > 0} style={{ width: `${part2Progress * 100}%` }} />
            </ProgressSegment>
            <ProgressSegment $isActive={part3Progress > 0}>
              <ProgressSegmentFill $isActive={part3Progress > 0} style={{ width: `${part3Progress * 100}%` }} />
            </ProgressSegment>
            <ProgressSegment $isActive={part4Progress > 0}>
              <ProgressSegmentFill $isActive={part4Progress > 0} style={{ width: `${part4Progress * 100}%` }} />
            </ProgressSegment>
          </ProgressBar>
        </ProgressBarContainer>
      </JourneyContainer>
    </>
  )
}
