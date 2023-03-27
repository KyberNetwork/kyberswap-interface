import { Trans, t } from '@lingui/macro'
import React, { useEffect, useReducer } from 'react'
import { ChevronLeft, ChevronRight, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css, keyframes } from 'styled-components'

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
  gap: 20px;
  width: min(85vw, 808px);
  height: 644px;
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
  100% { opacity: 0.5; transform:translateX(calc(100% + 40px)); }
`
const fadeInRight = keyframes`
  0% { opacity: 0.5; transform:translateX(calc(100% + 40px)) }
  100% { opacity: 1; transform:translateX(0)}
`
const fadeOutLeft = keyframes`
  0% { opacity: 1; transform:translateX(0);}
  100% { opacity: 0.5; transform:translateX(calc(-100% - 40px)); }
`

const StepWrapper = styled.div`
  padding: 0;
  margin: 0;
  box-sizing: content-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
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
`

const NavItem = styled.div<{ active?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  :hover {
    filter: brightness(0.7);
  }
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${theme.buttonBlack};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.buttonBlack + '64'};
        `};
`

const steps = [
  {
    image: tutorial2,
    text: t`You can use TrueSight’s leaderboard to find token worth exploring. We used an algorithm to measures the current trend of a token by taking into account multiple on-chain and off-chan indicators. The score range from 0 to 100. Higher the score, more bullish the token.`,
  },
  {
    image: tutorial3,
    text: t`Once you had decided on a token to explore, you can take a deeper dive with all the information you need available in one place. We divided the information into three separate parts: On-chain Analysis, Technical Analysis and News`,
  },
  {
    image: tutorial4,
    text: t`In On-chain Analysis, we gather the information from on-chain sources to provide an overall view of the token. The data we provide include: Number and Type of Trades, Number of Holders, Trading Volume, Netflow to Whale Wallets, Netflow to CEX, Number / Volume of Transfers and the Top 25 Holders`,
  },
  {
    image: tutorial5,
    text: t`In Technical Analysis, we gather the information from on-chain and off-chain sources to help you build up your own analysis for the token. The data we provide include: Live Price Chart, Funding Rate on CEX, Live DEX Trades, Liquidation on CEX and Netflow the CEX`,
  },
  {
    image: tutorial6,
    text: t`We also gather information from all the reliable news sources about the particular token so you can update on all the lastest news. Currently, we will keep you in tab on various news sources like LunarCrush, Coindesk, Benzinga, Cointelegraph, Cryptonews, NewsBTC, Coin Edition`,
  },
  {
    image: tutorial7,
    text: t`You can also directly swap a token in the explore tab and choose which indicator to be displayed below in each analysis tab. Remember to subscribe to be able to receive update about our token list everyday. Happy Trading folks.`,
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
      <img src={image} alt={'KyberAI Tutorial ' + step} />
      <Text fontSize="14px" lineHeight="20px" color={theme.subText}>
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
            <Text fontSize="14px" lineHeight="20px" color={theme.subText}>
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
            <Row style={{ position: 'relative', marginBottom: 'auto' }}>
              <StepContent
                step={step}
                className="fadeInScale"
                style={{ visibility: animationState === AnimationState.Idle ? 'visible' : 'hidden' }}
              />
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
            </Row>
            <Row justify="center" gap="4px" alignSelf="flex-end">
              <NavItem onClick={() => dispatch(ActionTypes.PREV_STEP)}>
                <ChevronLeft />
              </NavItem>
              {steps.map((a, index) => (
                <NavItem key={index} active={step === index + 1}>
                  {index + 1}
                </NavItem>
              ))}
              <NavItem onClick={() => dispatch(ActionTypes.NEXT_STEP)}>
                <ChevronRight />
              </NavItem>
            </Row>
          </>
        )}
      </Wrapper>
    </Modal>
  )
}

export default React.memo(TutorialModal)
