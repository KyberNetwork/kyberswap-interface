import { Trans } from '@lingui/macro'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ReactNode } from 'react'
import { Check } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import apeImage from 'assets/images/truesight-v2/landing-page/ape-image.png'
import backgroundImage from 'assets/images/truesight-v2/landing-page/background-gradient.png'
import bitcoinImage from 'assets/images/truesight-v2/landing-page/bitcoin.png'
import chartLightImage from 'assets/images/truesight-v2/landing-page/chart-light.png'
import chartImage from 'assets/images/truesight-v2/landing-page/chart.png'
import coreEditImage from 'assets/images/truesight-v2/landing-page/core-edit.png'
import ethereumImage from 'assets/images/truesight-v2/landing-page/ethereum.png'
import feature1 from 'assets/images/truesight-v2/landing-page/feature1.png'
import feature2 from 'assets/images/truesight-v2/landing-page/feature2.png'
import feature3 from 'assets/images/truesight-v2/landing-page/feature3.png'
import gradientImage2 from 'assets/images/truesight-v2/landing-page/gradient2.png'
// import gradientImage3 from 'assets/images/truesight-v2/landing-page/gradient3.png'
import gradientImage from 'assets/images/truesight-v2/landing-page/gradient.png'
import iconImage from 'assets/images/truesight-v2/landing-page/icon.png'
import image1 from 'assets/images/truesight-v2/landing-page/image1.png'
import kyberscoreMeterLightImage from 'assets/images/truesight-v2/landing-page/kyberscore-meter-light.png'
import kyberscoreMeterImage from 'assets/images/truesight-v2/landing-page/kyberscore-meter.png'
import liveDexTradesLightImage from 'assets/images/truesight-v2/landing-page/live-dex-trades-light.png'
import liveDexTradesImage from 'assets/images/truesight-v2/landing-page/live-dex-trades.png'
import starsImage from 'assets/images/truesight-v2/landing-page/stars.png'
import tokenListImage from 'assets/images/truesight-v2/landing-page/token-list.png'
import tokenPriceLightImage from 'assets/images/truesight-v2/landing-page/token-price-light.png'
import tokenPriceImage from 'assets/images/truesight-v2/landing-page/token-price.png'
import videoPlaceholderImage from 'assets/images/truesight-v2/landing-page/video-placeholder.png'
import sprite from 'assets/svg/kyberAILandingPageSprite.svg'
import Column from 'components/Column'
import GlobalIcon from 'components/Icons/Icon'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'
import RegisterWhitelist from 'pages/TrueSightV2/pages/RegisterWhitelist'
import { MEDIA_WIDTHS } from 'theme'

const Icon = ({
  id,
  size,
  style,
  ...rest
}: {
  id: string
  size?: number | string
  style?: React.CSSProperties
  title?: string
}) => {
  return (
    <div style={style} {...rest}>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}

const Wrapper = styled.div`
  padding: 20px 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url(${backgroundImage});
  background-size: contain;
  background-repeat: repeat-y;
`

const FixedWidth = styled.div`
  width: 1016px;
  max-width: 100%;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
  > * {
    flex: 1;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`
const PartWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: 1224px;
  position: relative;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: row;
    padding:12px;
  `}
`

const transition = { type: 'spring', bounce: 0, duration: 1.8 }
const appearVariants = {
  init: { opacity: 0, y: 80 },
  inView: { opacity: 1, y: 0 },
}
const PartWithMotion = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <PartWrapper
      initial="init"
      whileInView="inView"
      viewport={{ once: true, amount: 0.6 }}
      className={className}
      transition={transition}
      variants={appearVariants}
    >
      {children}
    </PartWrapper>
  )
}

const Part1 = styled(PartWithMotion)`
  height: 70vh;
  min-height: 700px;
  max-height: 1000px;
`
const Part2 = styled(PartWithMotion)`
  margin-bottom: 40px;
`
const Part3 = styled(PartWithMotion)``
const Part4 = styled(PartWithMotion)`
  height: 350px;
  gap: 32px;
  width: 100%;
`
const Part5 = styled(PartWithMotion)`
  height: 600px;
  gap: 20px;
`
const Part6 = styled(PartWithMotion)`
  height: 500px;
`
const Part7 = styled(PartWithMotion)`
  height: 500px;
`
const Part8 = styled(PartWithMotion)`
  height: 450px;
`

const ColumnWithMotion = styled(motion.div)`
  ${Column}
`
const FloatingImage = styled.img<{ left: number; top: number }>`
  position: absolute;
  ${({ left, top }) => css`
    left: ${left || 0}px;
    top: ${top || 0}px;
  `}
`
const FloatingImageWithMotion = (props: {
  src: string
  alt: string
  left: number
  top: number
  parallaxDistance?: number
  style?: React.CSSProperties
}) => {
  const { scrollYProgress } = useScroll()
  const transformedTranslateY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, props.parallaxDistance ? 2200 / props.parallaxDistance : 0],
  )

  const translateY = useSpring(transformedTranslateY, { bounce: 0, duration: 0.5 })

  return (
    <motion.div transition={transition} variants={appearVariants} style={{ translateY, ...props.style }}>
      <FloatingImage {...props} />
    </motion.div>
  )
}
const VideoWrapper = styled.div`
  img {
    width: 100%;
  }
`
const ReasonWrapper = styled.div`
  border: 1px solid rgba(49, 203, 158, 0.5);
  border-radius: 16px;
  display: flex;
  padding: 28px 0;
  > * {
    flex: 1;
  }
  width: 100%;

  ${Column} {
    gap: 10px;
    padding: 0 32px;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: ${({ theme }) => theme.subText};

    b {
      font-weight: 400;
      color: ${({ theme }) => theme.text};
    }
  }

  ${Column}:not(:first-child) {
    border-left: 1px solid ${({ theme }) => theme.border};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    padding: 0 12px;
    ${Column} { padding: 16px 0;}
    ${Column}:not(:first-child) {
      border-left: none;
      border-top: 1px solid ${({ theme }) => theme.primary};
    }
  `}
`

const FeatureBox = styled(motion.div)`
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(25px);
  background: linear-gradient(91deg, rgba(237, 253, 248, 0.06) 4.04%, rgba(122, 183, 165, 0.02) 104.55%);
  box-shadow: 0px 8px 8px rgba(0, 0, 0, 0.04), inset 0px 4px 4px rgba(255, 255, 255, 0.25),
    inset 0px 4px 8px rgba(0, 0, 0, 0.12);
  flex: 1;
  align-self: stretch;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`
const CallToActionBox = styled.div`
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(91deg, rgba(237, 253, 248, 0.12) 4.04%, rgba(122, 183, 165, 0.04) 104.55%);
  box-shadow: inset 0px 4px 4px rgba(255, 255, 255, 0.25), inset 0px 4px 8px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(25px);
  border: 2px solid #e3e3e332;
  padding: 44px;
`

const StyledUL = styled.ul`
  color: ${({ theme }) => theme.subText};
  font-size: 16px;
  line-height: 24px;
  list-style-type: none;
  li {
    position: relative;
    padding: 6px 0;
  }
`

const CheckIcon = () => {
  return (
    <div style={{ position: 'absolute', left: '-40px' }}>
      <Check size={28} />
    </div>
  )
}

export default function KyberAILandingPage() {
  const theme = useTheme()
  const above768 = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Wrapper>
      <Part1>
        <FixedWidth style={{ height: '700px', position: 'relative' }}>
          <Column height="100%" gap="24px" style={{ justifyContent: 'center' }}>
            <Text fontSize="48px" lineHeight="60px" fontWeight={800}>
              <Trans>
                Ape Smart with{' '}
                <span style={{ color: theme.primary, textShadow: `0 0 6px ${theme.primary}` }}>KyberAI</span>
              </Trans>
            </Text>
            <Text fontSize="20px" lineHeight="24px" fontWeight={500}>
              Get alpha before it happens
            </Text>
            <RegisterWhitelist />
          </Column>
          <ColumnWithMotion style={{ position: 'relative' }}>
            <FloatingImageWithMotion src={bitcoinImage} alt="bitcoin" left={0} top={320} parallaxDistance={6} />
            <FloatingImageWithMotion
              src={theme.darkMode ? chartImage : chartLightImage}
              alt="chart"
              left={660}
              top={400}
              parallaxDistance={9}
              style={{ scale: 0.5 }}
            />
            <FloatingImageWithMotion
              src={theme.darkMode ? liveDexTradesImage : liveDexTradesLightImage}
              alt="live dex trade"
              left={-200}
              top={190}
              parallaxDistance={10}
              style={{ scale: 0.5 }}
            />
            <FloatingImageWithMotion
              src={theme.darkMode ? kyberscoreMeterImage : kyberscoreMeterLightImage}
              alt="kyberscore"
              left={550}
              top={-20}
              parallaxDistance={4}
              style={{ scale: 0.5 }}
            />
            <FloatingImageWithMotion src={iconImage} alt="icon" left={230} top={80} parallaxDistance={7} />
            <FloatingImageWithMotion src={starsImage} alt="stars" left={-600} top={80} parallaxDistance={-10} />
            <FloatingImageWithMotion src={apeImage} alt="ape head" left={-20} top={100} parallaxDistance={4} />
            <motion.div
              animate={{
                opacity: [
                  1, 0.9, 0.7, 0.8, 1, 1, 0.9, 1, 1, 0.9, 1, 0.2, 1, 1, 0.1, 1, 0.6, 0.5, 0.6, 1, 1, 0.7, 0.8, 0.7, 1,
                  1, 0.6, 0.5, 0.6, 1,
                ],
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <FloatingImageWithMotion
                src={gradientImage}
                alt="ape sight"
                left={-720}
                top={-100}
                parallaxDistance={4}
                style={{ filter: 'brightness(1.1)' }}
              />
            </motion.div>
            <FloatingImageWithMotion src={ethereumImage} alt="ethereum" left={300} top={320} parallaxDistance={-7} />
            <FloatingImageWithMotion
              src={theme.darkMode ? tokenPriceImage : tokenPriceLightImage}
              alt="token Price"
              left={0}
              top={920}
              parallaxDistance={11}
              style={{ scale: 0.5 }}
            />
          </ColumnWithMotion>
        </FixedWidth>
      </Part1>
      <Part2>
        <VideoWrapper>
          <img src={videoPlaceholderImage} alt="video placeholder" />
        </VideoWrapper>
      </Part2>
      <Part2>
        <Column maxWidth="1224px" gap="36px">
          <ReasonWrapper>
            <Column>
              <Icon id="query-stats" />
              <Text>
                <Trans>
                  Want to <b>let AI do the work of sifting through a noisy market</b>
                </Trans>
              </Text>
            </Column>
            <Column>
              <Icon id="quick-reference" />
              <Text>
                <Trans>
                  Don&apos;t have enough time to <b>conduct thorough technical analysis of potential tokens?</b>
                </Trans>
              </Text>
            </Column>
            <Column>
              <Icon id="timer-black" />
              <Text>
                <Trans>
                  Finding it hard to figure out <b>when is the right time to ape?</b>
                </Trans>
              </Text>
            </Column>
            <Column>
              <Icon id="exhausted" />
              <Text>
                <Trans>
                  Feeling exhausted <b>managing your emotions?</b>
                </Trans>
              </Text>
            </Column>
          </ReasonWrapper>
        </Column>
      </Part2>

      <Part3>
        <FixedWidth style={{ height: '650px' }}>
          <Column justifyContent="center" style={{ flexGrow: 4, order: above768 ? 2 : 1 }}>
            <Text fontSize="48px" lineHeight="56px" fontWeight={500} color={theme.subText}>
              <Trans>
                Less Effort <br />
                <span style={{ color: theme.text }}>More Signals</span>
              </Trans>
            </Text>
            <Text lineHeight="24px" color={theme.subText}>
              <Trans>
                <p>
                  Crypto traders all around the world face various challenges every day.{' '}
                  <span style={{ color: theme.text }}>
                    Having to stay on top of the news, making high pressure decisions, spending a lot of time
                    researching information and analysing market movements... it&apos;s not easy.
                  </span>
                </p>
                <p>
                  But what if there was a solution to these problems. What if you could have access to{' '}
                  <span style={{ color: theme.text }}>
                    a tool that could assist you to navigate the dizzy world of crypto with ease?
                  </span>
                </p>
                <p style={{ color: theme.text, fontSize: '20px' }}>Well, there is.</p>
              </Trans>
            </Text>
          </Column>
          <Column style={{ position: 'relative', height: '100%', flexGrow: 6, order: above768 ? 1 : 2 }}>
            <FloatingImage src={image1} alt="kyberAI image" left={-10} top={-20} />
          </Column>
        </FixedWidth>
      </Part3>
      <Part4>
        <FloatingImageWithMotion
          src={starsImage}
          alt="stars"
          left={-100}
          top={-20}
          parallaxDistance={-8}
          style={{ zIndex: -1 }}
        />
        <FloatingImageWithMotion
          src={gradientImage2}
          alt="stars"
          left={-200}
          top={-200}
          parallaxDistance={-8}
          style={{ zIndex: -1, opacity: 0.7, scale: 0.8 }}
        />

        <Column gap="20px" alignItems="center">
          <Text fontSize="48px" color={theme.text} fontWeight={500}>
            <Trans>
              We introduce to you,{' '}
              <span style={{ color: theme.primary, textShadow: `0 0 5px ${theme.primary}` }}>KyberAI</span>
            </Trans>
          </Text>
          <Text fontSize="16px" lineHeight="28px" color={theme.subText}>
            <Trans>An intelligent platform that provides valuable insights on 4000+ Tokens across 7 Chains</Trans>
          </Text>
          <Row justify="center" gap="16px">
            <GlobalIcon id="eth-mono" size={36} />
            <GlobalIcon id="bnb-mono" size={36} />
            <GlobalIcon id="ava-mono" size={36} />
            <GlobalIcon id="matic-mono" size={36} />
            <GlobalIcon id="optimism-mono" size={36} />
            <GlobalIcon id="arbitrum-mono" size={36} />
            <GlobalIcon id="fantom-mono" size={36} />
          </Row>
        </Column>
      </Part4>
      <Part5>
        <Row justify="center">
          <Text fontSize="48px" lineHeight="56px" fontWeight={500}>
            <Trans>Key Features</Trans>
          </Text>
        </Row>
        <Row justify="center" gap="26px">
          <FeatureBox variants={appearVariants} transition={transition}>
            <Column justifyContent="center" alignItems="center" height="200px" gap="26px">
              <img src={feature1} alt="feature 1" width="130px" />
              <Text fontSize="20px" lineHeight="24px" color={theme.text}>
                KyberScore
              </Text>
            </Column>
            <Text fontSize="16px" lineHeight="24px">
              <Trans>
                <span style={{ color: theme.text }}>
                  KyberScore - our unique insight uses our Machine Learning algorithms
                </span>{' '}
                and multiple on-chain and off-chain indicators to identify whether a token is going to be{' '}
                <span style={{ color: theme.primary }}>Bullish</span> or{' '}
                <span style={{ color: theme.red }}>Bearish</span> in the short term.
              </Trans>
            </Text>
          </FeatureBox>
          <FeatureBox variants={appearVariants} transition={transition}>
            <Column justifyContent="center" alignItems="center" height="200px" gap="26px">
              <img src={feature2} alt="feature 2" />
              <Text fontSize="20px" lineHeight="24px" color={theme.text}>
                <Trans>Token Rankings</Trans>
              </Text>
            </Column>
            <Text fontSize="16px" lineHeight="24px">
              <Trans>
                <span style={{ color: theme.text }}>On the lookout for tokens?</span> <br />
                Start with the Rankings section. You will see top tokens ranked by Bullish, Bearish, Top CEX Inflow, Top
                CEX Outflow, Top Traded, Trending Soon and Currently Trending.
              </Trans>
            </Text>
          </FeatureBox>
          <FeatureBox variants={appearVariants} transition={transition}>
            <Column justifyContent="center" alignItems="center" height="200px" gap="26px">
              <img src={feature3} alt="feature 3" />
              <Text fontSize="20px" lineHeight="24px" color={theme.text}>
                <Trans>Explore</Trans>
              </Text>
            </Column>
            <Text fontSize="16px" lineHeight="24px">
              <Trans>
                <span style={{ color: theme.text }}>Already have a token in mind?</span> <br />
                Find on-chain & technical insights that provide you the edge to make the right decision, at the right
                time.
              </Trans>
            </Text>
          </FeatureBox>
        </Row>
      </Part5>
      <Part6>
        <FixedWidth>
          <Column style={{ position: 'relative' }}>
            <img
              src={tokenListImage}
              alt="token list"
              style={{ position: 'absolute', right: '-100px', top: '-90px' }}
            />
          </Column>
          <Column>
            <Text fontSize="48px" lineHeight="56px" fontWeight={500} color={theme.text}>
              <Trans>Access deep insights & stay informed.</Trans>
            </Text>
            <StyledUL>
              <li>
                <CheckIcon />
                <Trans>
                  Search from over <span style={{ color: theme.text }}>4000+ tokens on 7 chains</span>
                </Trans>
              </li>
              <li>
                <CheckIcon />
                <Trans>
                  Subscribe to <span style={{ color: theme.text }}>receive daily emails on the top tokens</span> as
                  recommended by KyberAI
                </Trans>
              </li>
              <li>
                <CheckIcon />
                <Trans>
                  <span style={{ color: theme.text }}>Monitor token prices - Set a price alert</span>, sit back and
                  we&apos;ll notify you
                </Trans>
              </li>
              <li>
                <CheckIcon />
                <Trans>
                  {' '}
                  <span style={{ color: theme.text }}>Create a watchlist of your favorite tokens</span>, and analyze
                  them quickly
                </Trans>
              </li>
            </StyledUL>
          </Column>
        </FixedWidth>
      </Part6>
      <Part7>
        <FixedWidth>
          <Column>
            <Text fontSize="48px" lineHeight="56px" fontWeight={500} color={theme.text}>
              <Trans>
                <Trans>Discover new opportunities.</Trans>
              </Trans>
            </Text>
            <Text fontSize="16px" lineHeight="24px" color={theme.subText}>
              <Trans>
                <p>
                  With advanced machine learning algorithms to help you stay ahead of the curve, KyberAI gives you the
                  AI/ML edge by analyzing thousands of{' '}
                  <span style={{ color: theme.text }}>analyze thousands of tokens and billions of data points</span>,
                  putting you ahead of the curve.{' '}
                </p>
                <p>
                  Whether you&apos;re a seasoned retail trader, just starting out or somewhere in between,{' '}
                  <span style={{ color: theme.text }}>KyberAI can give you a competitive edge in trading.</span>
                </p>
              </Trans>
            </Text>
          </Column>
          <Column style={{ position: 'relative' }}>
            <FloatingImage src={coreEditImage} alt="core edit" left={0} top={-50} />
          </Column>
        </FixedWidth>
      </Part7>
      <Part8>
        <FixedWidth>
          <CallToActionBox>
            <Row>
              <Text fontSize="36px" lineHeight="48px" style={{ flex: 2 }}>
                <Trans>
                  Ready to experience{' '}
                  <span style={{ color: theme.primary, textShadow: `0 0 5px ${theme.primary}` }}>KyberAI</span>? <br />
                  Get alpha before it happens
                </Trans>
              </Text>
              <Row style={{ flex: 1 }}>
                <RegisterWhitelist showForm={false} />
              </Row>
            </Row>
          </CallToActionBox>
        </FixedWidth>
      </Part8>
    </Wrapper>
  )
}
