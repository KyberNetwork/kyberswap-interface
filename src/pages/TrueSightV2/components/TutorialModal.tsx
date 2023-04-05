import { Trans } from '@lingui/macro'
import React, { useEffect, useReducer } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import tutorial1 from 'assets/images/truesight-v2/tutorial_1.png'
import tutorial2 from 'assets/images/truesight-v2/tutorial_2.png'
import tutorial3 from 'assets/images/truesight-v2/tutorial_3.png'
import tutorial4 from 'assets/images/truesight-v2/tutorial_4.png'
import tutorial5 from 'assets/images/truesight-v2/tutorial_5.png'
import tutorial6 from 'assets/images/truesight-v2/tutorial_6.png'
import tutorial7 from 'assets/images/truesight-v2/tutorial_7.png'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

const preloadImage = (url: string) => (document.createElement('img').src = url)
preloadImage(tutorial1)

const Wrapper = styled.div`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(85vw, 808px);
  height: 700px;
`
const fadeInScale = keyframes`
  0% { opacity: 0; transform:scale(0.7) }
  100% { opacity: 1; transform:scale(1)}
`
const fadeInLeft = keyframes`
  0% { opacity: 0.5; transform:translateX(calc(-100% - 40px)) }
  100% { opacity: 1; transform:translateX(0)}
`
const fadeOutRight = keyframes`
  0% { opacity: 1; transform:translateX(0);}
  100% { opacity: 0.5; transform:translateX(calc(100% + 40px)); visibility:hidden; }
`
const fadeInRight = keyframes`
  0% { opacity: 0.5; transform:translateX(calc(100% + 40px)) }
  100% { opacity: 1; transform:translateX(0)}
`
const fadeOutLeft = keyframes`
  0% { opacity: 1; transform:translateX(0);}
  100% { opacity: 0.5; transform:translateX(calc(-100% - 40px)); visibility:hidden; }
`

const StepWrapper = styled.div`
  padding: 0;
  margin: 0;
  box-sizing: content-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
  &.fadeInScale {
    animation: ${fadeInScale} 0.3s ease;
  }
  &.fadeOutRight {
    animation: ${fadeOutRight} 0.5s ease;
  }
  &.fadeOutLeft {
    animation: ${fadeOutLeft} 0.5s ease;
  }
  &.fadeInRight {
    animation: ${fadeInRight} 0.5s ease;
  }
  &.fadeInLeft {
    animation: ${fadeInLeft} 0.5s ease;
  }
  img {
    object-fit: contain;
  }

  b {
    font-weight: 500;
    color: ${({ theme }) => theme.text};
  }
  p {
    margin-bottom: 16px;
  }
`
const StepDot = styled.div<{ active?: boolean }>`
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
`

const steps = [
  {
    image: tutorial2,
    text: (
      <Trans>
        <p>
          Whether you&apos;re looking to identify new tokens to trade, or get alpha on a specific token, KyberAI has it
          all! KyberAI currently provides trading insights on <b>4000+ tokens</b> across <b>7 blockchains!</b>
        </p>{' '}
        <p>
          For traders who are in discovery mode, start with the Rankings section. Here you will see top tokens under
          each of the 7 categories -{' '}
          <b>Bullish, Bearish, Top CEX Inflow, Top CEX Outflow, Top Traded, Trending Soon, Currently Trending.</b>
          We update the token rankings multiple times a day!
        </p>{' '}
        <p>
          For traders looking to spot alpha on specific tokens, start with the Explore section. You will find a number
          of On-Chain and Technical insights on your token that you can look at to make an informed trading decision.
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial3,
    text: (
      <Trans>
        <p>
          A unique trading insight offered by KyberAI is the <b>KyberScore</b>. KyberScore uses <b>AI</b> to measure the
          upcoming trend (bullish or bearish) of a token by taking into account multiple on-chain and off-chain
          indicators. The score ranges from 0 to 100. Higher the score, more bullish the token in the <b>short-term</b>.
        </p>{' '}
        <p>
          Each token supported by KyberAI is assigned a KyberScore. It refreshes multiple times a day as we collect more
          data on the token. You can find the KyberScore of a token in the <b>Rankings</b> or <b>Explore</b> section.
          Read more about the calculation here.
        </p>{' '}
        <p>
          <i>Note: KyberScore should not be considered as financial advice</i>
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial4,
    text: (
      <Trans>
        <p>
          For traders, analyzing & interpreting on-chain data can be very powerful. It helps us see what whales, smart
          money and other traders are up to. And so, KyberAI has cherry picked the best on-chain indicators to help
          traders like you spot alpha on your tokens. Check out the <b>On-Chain Analysis</b> tab of the <b>Explore</b>{' '}
          section!
        </p>
        <p>
          The best traders combine on-chain analysis with technical analysis (TA). TA is used to identify trading
          opportunities by evaluating price charts, price trends, patterns etc. KyberAI makes TA easy for traders. Check
          out the <b>Technical Analysis</b> tab of the Explore section!
        </p>
      </Trans>
    ),
  },
  {
    image: tutorial5,
    text: (
      <Trans>
        <p>That&apos;s not all! Here are a few handy tips so you can get the most out of KyberAI:</p>{' '}
        <ul>
          <li>
            Use the search bar to <b>search</b> for any token you&apos;d like to explore. KyberAI supports 4000+ tokens!
          </li>
          <li>
            <b>Subscribe</b> to receive daily emails on the top tokens as recommended by KyberAI!
          </li>
          <li>
            Monitoring the price of a token? Set a <b>price alert</b>, sit back, and we&apos;ll notify you!
          </li>
          <li>
            Create a <b>watchlist</b> of your favorite tokens, and access it quickly!
          </li>
        </ul>{' '}
        <p>If you wish to view this guide again, you can enable it from the settings. </p>
        <p>
          <b>Ape Smart with KyberAI.</b>
        </p>
      </Trans>
    ),
  },
]

enum AnimationState {
  Idle,
  Animating,
  Animated,
}
enum SwipeDirection {
  LEFT,
  RIGHT,
}

type TutorialAnimationState = {
  step: number
  animationState: AnimationState
  swipe: SwipeDirection
}
const initialState = {
  step: 0,
  animationState: AnimationState.Idle,
  swipe: SwipeDirection.LEFT,
}
enum ActionTypes {
  START = 'START',
  NEXT_STEP = 'NEXT_STEP',
  PREV_STEP = 'PREV_STEP',
  ANIMATION_END = 'ANIMATION_END',
}
function reducer(state: TutorialAnimationState, action: ActionTypes) {
  switch (action) {
    case ActionTypes.START:
      return {
        step: 1,
        animationState: AnimationState.Idle,
        swipe: SwipeDirection.LEFT,
      }
    case ActionTypes.NEXT_STEP:
      if (state.step < steps.length && state.animationState !== AnimationState.Animating) {
        return {
          step: state.step + 1,
          animationState: AnimationState.Animating,
          swipe: SwipeDirection.LEFT,
        }
      }
      break
    case ActionTypes.PREV_STEP:
      if (state.step > 1 && state.animationState !== AnimationState.Animating) {
        return {
          step: state.step - 1,
          animationState: AnimationState.Animating,
          swipe: SwipeDirection.RIGHT,
        }
      }
      break
    case ActionTypes.ANIMATION_END:
      return { ...state, animationState: AnimationState.Idle }
    default:
      throw new Error()
  }
  return state
}

const StepContent = ({ step, ...rest }: { step: number; [k: string]: any }) => {
  const theme = useTheme()
  const { image, text } = steps[step - 1]
  return (
    <StepWrapper {...rest}>
      <img src={image} alt={'KyberAI Tutorial ' + step} style={{ height: '292px' }} />
      <Text fontSize="14px" lineHeight="20px" color={theme.subText} flex={1} backgroundColor={theme.tableHeader}>
        {text}
      </Text>
    </StepWrapper>
  )
}

const TutorialModal = () => {
  const theme = useTheme()
  const isOpen = useModalOpen(ApplicationModal.KYBERAI_TUTORIAL)
  const toggle = useToggleModal(ApplicationModal.KYBERAI_TUTORIAL)
  const [{ step, animationState, swipe }, dispatch] = useReducer(reducer, initialState)
  const lastStep =
    animationState === AnimationState.Animating ? (swipe === SwipeDirection.LEFT ? step - 1 : step + 1) : undefined

  useEffect(() => {
    preloadImage(tutorial2)
    preloadImage(tutorial3)
    preloadImage(tutorial4)
    preloadImage(tutorial5)
    preloadImage(tutorial6)
    preloadImage(tutorial7)
  }, [])

  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="fit-content">
      <Wrapper>
        <RowBetween>
          <Row fontSize="20px" lineHeight="24px" color={theme.text} gap="6px">
            <Trans>
              Welcome to <Icon id="truesight-v2" style={{ display: 'inline-block' }} />
              KyberAI
            </Trans>
            <div
              style={{
                padding: '4px 8px',
                background: theme.subText + '32',
                fontSize: '12px',
                lineHeight: '16px',
                borderRadius: '20px',
                color: theme.subText,
              }}
            >
              beta
            </div>
          </Row>
          <div onClick={toggle} style={{ cursor: 'pointer' }}>
            <X />
          </div>
        </RowBetween>
        {step === 0 && (
          <>
            <img
              src={tutorial1}
              alt="KyberAI Tutorial"
              style={{ width: '760px', height: '400px', borderRadius: '20px', backgroundColor: theme.buttonBlack }}
            />
            <Text fontSize="14px" lineHeight="20px" color={theme.subText} flex="1">
              <Trans>
                We&apos;re thrilled to have you onboard and can&apos;t wait for you to start exploring the world of
                trading powered by <span style={{ color: theme.text }}>KyberAI</span>. We&apos;ve created this short
                tutorial for you to highlight KyberAI&apos;s main features. Ready?
              </Trans>
            </Text>

            <Row justify="center" gap="20px">
              <ButtonOutlined width="160px" onClick={toggle}>
                <Text fontSize="16px" lineHeight="20px">
                  <Trans>Maybe later</Trans>
                </Text>
              </ButtonOutlined>
              <ButtonPrimary
                width="160px"
                onClick={() => {
                  dispatch(ActionTypes.START)
                }}
              >
                <Text fontSize="16px" lineHeight="20px">
                  <Trans>Let&apos;s get started</Trans>
                </Text>
              </ButtonPrimary>
            </Row>
          </>
        )}
        {step > 0 && (
          <>
            <Row style={{ position: 'relative', flex: 1, alignItems: 'stretch', backgroundColor: theme.tableHeader }}>
              {animationState === AnimationState.Animating && (
                <>
                  <StepContent
                    step={lastStep || 1}
                    className={swipe === SwipeDirection.LEFT ? 'fadeOutLeft' : 'fadeOutRight'}
                    style={{ position: 'absolute', top: 0, left: 0, backgroundColor: theme.tableHeader }}
                  />
                  <StepContent
                    step={step}
                    className={swipe === SwipeDirection.LEFT ? 'fadeInRight' : 'fadeInLeft'}
                    onAnimationEnd={() => dispatch(ActionTypes.ANIMATION_END)}
                    style={{ position: 'absolute', top: 0, left: 0, backgroundColor: theme.tableHeader }}
                  />
                </>
              )}
              <StepContent
                step={step}
                className="fadeInScale"
                style={{ visibility: animationState === AnimationState.Idle ? 'visible' : 'hidden' }}
              />
            </Row>
            <Row justify="center" gap="8px">
              {steps.map((a, index) => (
                <StepDot key={index} active={step - 1 === index} />
              ))}
            </Row>
            <Row gap="20px" justify="center">
              <ButtonOutlined width="160px" onClick={() => dispatch(ActionTypes.PREV_STEP)}>
                Back
              </ButtonOutlined>
              <ButtonPrimary width="160px" onClick={() => dispatch(ActionTypes.NEXT_STEP)}>
                Next
              </ButtonPrimary>
            </Row>
          </>
        )}
      </Wrapper>
    </Modal>
  )
}

export default React.memo(TutorialModal)
