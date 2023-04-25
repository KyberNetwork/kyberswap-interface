import KyberOauth2 from '@kybernetwork/oauth2'
import { Trans } from '@lingui/macro'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import apeImage from 'assets/images/truesight-v2/landing-page/ape-image.png'
import backgroundImage from 'assets/images/truesight-v2/landing-page/background-gradient.png'
import bitcoinImage from 'assets/images/truesight-v2/landing-page/bitcoin.png'
import chartImage from 'assets/images/truesight-v2/landing-page/chart.png'
import coreEditImage from 'assets/images/truesight-v2/landing-page/core-edit.png'
import eteherumImage from 'assets/images/truesight-v2/landing-page/ethereum.png'
import feature1 from 'assets/images/truesight-v2/landing-page/feature1.png'
import feature2 from 'assets/images/truesight-v2/landing-page/feature2.png'
import feature3 from 'assets/images/truesight-v2/landing-page/feature3.png'
import gradientImage from 'assets/images/truesight-v2/landing-page/gradient.png'
import iconImage from 'assets/images/truesight-v2/landing-page/icon.png'
import image1 from 'assets/images/truesight-v2/landing-page/image1.png'
import kyberscoreMeterImage from 'assets/images/truesight-v2/landing-page/kyberscore-meter.png'
import liveDexTradesImage from 'assets/images/truesight-v2/landing-page/live-dex-trades.png'
import starsImage from 'assets/images/truesight-v2/landing-page/stars.png'
import tokenListImage from 'assets/images/truesight-v2/landing-page/token-list.png'
import tokenPriceImage from 'assets/images/truesight-v2/landing-page/token-price.png'
import videoPlaceholderImage from 'assets/images/truesight-v2/landing-page/video-placeholder.png'
import sprite from 'assets/svg/kyberAILandingPageSprite.svg'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import GlobalIcon from 'components/Icons/Icon'
import LocalLoader from 'components/LocalLoader'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useWalletModalToggle } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'

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
`
const PartWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 1224px;
`

const transition = { type: 'spring', bounce: 0, duration: 1.5, delayChildren: 0.3, staggerChildren: 0.1 }
const appearVariants = {
  init: { opacity: 0, y: 100 },
  inView: { opacity: 1, y: 0 },
}
const PartWithMotion = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <PartWrapper
      initial="init"
      whileInView="inView"
      viewport={{ once: true, amount: 0.8 }}
      className={className}
      transition={transition}
      variants={appearVariants}
    >
      {children}
    </PartWrapper>
  )
}

const Part1 = styled(PartWithMotion)`
  height: 80vh;
  min-height: 700px;
  max-height: 1000px;
`
const Part2 = styled(PartWithMotion)``
const Part3 = styled(PartWithMotion)``
const Part4 = styled(PartWithMotion)`
  height: 550px;
  gap: 32px;
`
const Part5 = styled(PartWithMotion)`
  height: 700px;
  gap: 20px;
`
const Part6 = styled(PartWithMotion)`
  height: 700px;
`
const Part7 = styled(PartWithMotion)`
  height: 700px;
`
const Part8 = styled(PartWithMotion)`
  height: 450px;
`
const ConnectWalletButton = styled(ButtonPrimary)``

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
const FloatingImageWithMotion = (props: { src: string; alt: string; left: number; top: number }) => {
  return (
    <motion.div transition={transition} variants={appearVariants}>
      <FloatingImage {...props} />
    </motion.div>
  )
}
const VideoWrapper = styled.div``
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
`

const FeatureBox = styled(motion.div)`
  border-radius: 20px;
  padding: 28px;
  backdrop-filter: blur(25px);
  background: linear-gradient(91deg, rgba(237, 253, 248, 0.06) 4.04%, rgba(122, 183, 165, 0.02) 104.55%);
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.28);
  flex: 1;
  align-self: stretch;
  font-weight: 400;
  color: ${({ theme }) => theme.subText};
`
const CallToActionBox = styled.div`
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(91deg, rgba(237, 253, 248, 0.12) 4.04%, rgba(122, 183, 165, 0.04) 104.55%);
  backdrop-filter: blur(25px);
  border: 2px solid #e3e3e332;
  padding: 44px;
`
export default function KyberAILandingPage() {
  const theme = useTheme()
  const [{ isLogin, userInfo, anonymousUserInfo, processing }] = useSessionInfo()
  const { account } = useActiveWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useWalletModalToggle()
  console.log({
    isLogin,
    userInfo,
    anonymousUserInfo,
    processing,
  })

  if (processing) return <LocalLoader />

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
            {!account ? (
              <ConnectWalletButton style={{ height: '36px', width: '236px' }} onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </ConnectWalletButton>
            ) : !isLogin ? (
              <ConnectWalletButton
                style={{ height: '36px', width: '236px' }}
                onClick={() => KyberOauth2.authenticate()}
              >
                <Trans>Sign-in to Continue</Trans>
              </ConnectWalletButton>
            ) : (
              <>login roi ne</>
            )}
          </Column>
          <ColumnWithMotion transition={transition} variants={appearVariants} style={{ position: 'relative' }}>
            <FloatingImageWithMotion src={bitcoinImage} alt="ape head" left={-120} top={300} />
            <FloatingImageWithMotion src={chartImage} alt="ape head" left={400} top={240} />
            <FloatingImageWithMotion src={eteherumImage} alt="ape head" left={300} top={300} />
            <FloatingImageWithMotion src={liveDexTradesImage} alt="ape head" left={0} top={100} />
            <FloatingImageWithMotion src={gradientImage} alt="ape head" left={-800} top={-80} />
            <FloatingImageWithMotion src={iconImage} alt="ape head" left={200} top={80} />
            <FloatingImageWithMotion src={kyberscoreMeterImage} alt="ape head" left={350} top={10} />
            <FloatingImageWithMotion src={starsImage} alt="ape head" left={-800} top={100} />
            <FloatingImageWithMotion src={apeImage} alt="ape head" left={-100} top={100} />
            <FloatingImageWithMotion src={tokenPriceImage} alt="ape head" left={0} top={450} />
          </ColumnWithMotion>
        </FixedWidth>
      </Part1>
      <Part2>
        <Column maxWidth="1224px" gap="36px">
          <VideoWrapper>
            <img src={videoPlaceholderImage} alt="video placeholder" />
          </VideoWrapper>
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
        <FixedWidth style={{ height: '760px' }}>
          <Column justifyContent="center" style={{ flexGrow: 4 }}>
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
          <Column style={{ position: 'relative', height: '100%', flexGrow: 6 }}>
            <motion.div
              transition={transition}
              variants={{ init: { opacity: 0, y: 100, scale: 0.9 }, inView: { opacity: 1, y: 0, scale: 1 } }}
            >
              <FloatingImage src={image1} alt="kyberAI image" left={-10} top={0} />
            </motion.div>
          </Column>
        </FixedWidth>
      </Part3>
      <Part4>
        <motion.div transition={transition} variants={appearVariants}>
          <Text fontSize="48px" color={theme.text}>
            <Trans>
              We introduce to you,{' '}
              <span style={{ color: theme.primary, textShadow: `0 0 5px ${theme.primary}` }}>KyberAI</span>
            </Trans>
          </Text>
        </motion.div>
        <motion.div transition={transition} variants={appearVariants}>
          <Text fontSize="16px" color={theme.subText}>
            <Trans>An intelligent platform that provides valuable insights on 4000+ Tokens across 7 Chains</Trans>
          </Text>
        </motion.div>
        <Row justify="center" gap="16px">
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="eth-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="bnb-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="ava-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="matic-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="optimism-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="arbitrum-mono" />
          </motion.div>
          <motion.div transition={transition} variants={appearVariants}>
            <GlobalIcon id="fantom-mono" />
          </motion.div>
        </Row>
      </Part4>
      <Part5>
        <Row justify="center">
          <Text fontSize="48px" lineHeight="56px">
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
                <span style={{ color: theme.primary }}>Bullish</span> or
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
            <motion.div
              transition={transition}
              variants={{ init: { opacity: 0, y: 100, scale: 0.9 }, inView: { opacity: 1, y: 0, scale: 1 } }}
            >
              <img
                src={tokenListImage}
                alt="token list"
                style={{ position: 'absolute', right: '-100px', top: '-90px' }}
              />
            </motion.div>
          </Column>
          <Column>
            <Text fontSize="48px" lineHeight="56px" fontWeight={500} color={theme.text}>
              <Trans>Access deep insights & stay informed.</Trans>
            </Text>
            <ul>
              <li>
                <Trans>Search from over 4000+ tokens on 7 chains</Trans>
              </li>
              <li>
                <Trans>Subscribe to receive daily emails on the top tokens as recommended by KyberAI</Trans>
              </li>
              <li>
                <Trans>Monitor token prices - Set a price alert, sit back and we&apos;ll notify you</Trans>
              </li>
              <li>
                <Trans>Create a watchlist of your favorite tokens, and analyze them quickly</Trans>
              </li>
            </ul>
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
            <Text>
              <Trans>
                With advanced machine learning algorithms to help you stay ahead of the curve, KyberAI gives you the
                AI/ML edge by analyzing thousands of analyze thousands of tokens and billions of data points, putting
                you ahead of the curve. Whether you&apos;re a seasoned retail trader, just starting out or somewhere in
                between, KyberAI can give you a competitive edge in trading.
              </Trans>
            </Text>
          </Column>
          <Column style={{ position: 'relative' }}>
            <motion.div
              transition={transition}
              variants={{ init: { opacity: 0, y: 100, scale: 0.9 }, inView: { opacity: 1, y: 0, scale: 1 } }}
            >
              <FloatingImage src={coreEditImage} alt="core edit" left={0} top={-100} />
            </motion.div>
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
                <ConnectWalletButton width="236px">Connect Wallet</ConnectWalletButton>
              </Row>
            </Row>
          </CallToActionBox>
        </FixedWidth>
      </Part8>
    </Wrapper>
  )
}
