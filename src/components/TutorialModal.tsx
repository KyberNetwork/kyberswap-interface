import { Trans } from '@lingui/macro'
import React, { ReactNode, useLayoutEffect, useReducer } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { CSSProperties, keyframes } from 'styled-components'

import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'

const Wrapper = styled.div`
  border-radius: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(95vw, 808px);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-height: 70vh;
  `}
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
  height: fit-content;
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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    p {
    margin-bottom: 0px;
  }
  `}
`

const StepDot = styled.div<{ active?: boolean }>`
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
`

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
  INITIAL = 'INITIAL',
  START = 'START',
  NEXT_STEP = 'NEXT_STEP',
  PREV_STEP = 'PREV_STEP',
  ANIMATION_END = 'ANIMATION_END',
}
function reducer(state: TutorialAnimationState, action: ActionTypes) {
  switch (action) {
    case ActionTypes.INITIAL:
      return {
        ...initialState,
      }
    case ActionTypes.START:
      return {
        step: 1,
        animationState: AnimationState.Animating,
        swipe: SwipeDirection.LEFT,
      }
    case ActionTypes.NEXT_STEP:
      if (state.animationState !== AnimationState.Animating) {
        return {
          step: state.step + 1,
          animationState: AnimationState.Animating,
          swipe: SwipeDirection.LEFT,
        }
      }
      break
    case ActionTypes.PREV_STEP:
      if (state.animationState !== AnimationState.Animating) {
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

// todo check kyberai
const StepContent = ({ step, ...rest }: { step: TutorialStep; [k: string]: any }) => {
  const theme = useTheme()
  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  if (!step) return null
  const { image, text, textStyle } = step

  return (
    <StepWrapper {...rest}>
      <div
        style={{
          overflow: 'hidden',
          borderRadius: above768 ? '16px' : '6px',
          boxShadow: '0 0 6px 0px #00000060',
          height: above768 ? '350px' : 'auto',
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          aspectRatio: '768/350',
        }}
      />
      <Text
        color={theme.subText}
        backgroundColor={theme.tableHeader}
        sx={{
          fontSize: !above768 ? '12px' : '14px',
          lineHeight: !above768 ? '16px' : '20px',
          overflowY: 'scroll',
          ...textStyle,
        }}
      >
        {text}
      </Text>
    </StepWrapper>
  )
}

type TutorialStep = { image: string; text: ReactNode; textStyle?: CSSProperties; title?: string }
const TutorialModal = ({
  steps,
  isOpen,
  toggle,
  title,
  onFinished,
}: {
  steps: TutorialStep[]
  isOpen: boolean
  toggle: () => void
  onFinished?: () => void
  title?: ReactNode
}) => {
  const theme = useTheme()
  const [{ step, animationState, swipe }, dispatch] = useReducer(reducer, initialState)
  const lastStep =
    animationState === AnimationState.Animating ? (swipe === SwipeDirection.LEFT ? step - 1 : step + 1) : undefined

  const above768 = useMedia(`(min-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useLayoutEffect(() => {
    if (isOpen) {
      dispatch(ActionTypes.INITIAL)
    }
  }, [isOpen])

  const stepTitle = steps[step]?.title

  return (
    <Modal isOpen={isOpen} width="fit-content" maxWidth="fit-content" onDismiss={toggle}>
      <Wrapper>
        <RowBetween>
          <Row fontSize={above768 ? '20px' : '16px'} lineHeight="24px" color={theme.text} gap="6px">
            {stepTitle || title}
          </Row>
          <div onClick={toggle} style={{ cursor: 'pointer' }}>
            <X />
          </div>
        </RowBetween>

        <Row
          style={{
            position: 'relative',
            flex: 1,
            alignItems: 'stretch',
            backgroundColor: theme.tableHeader,
            overflowY: 'scroll',
          }}
        >
          {animationState === AnimationState.Animating && (
            <>
              <StepContent
                step={steps[lastStep || 1]}
                className={swipe === SwipeDirection.LEFT ? 'fadeOutLeft' : 'fadeOutRight'}
                style={{ position: 'absolute', top: 0, left: 0, backgroundColor: theme.tableHeader }}
              />
              <StepContent
                step={steps[step]}
                className={swipe === SwipeDirection.LEFT ? 'fadeInRight' : 'fadeInLeft'}
                onAnimationEnd={() => dispatch(ActionTypes.ANIMATION_END)}
                style={{ position: 'absolute', top: 0, left: 0, backgroundColor: theme.tableHeader }}
              />
            </>
          )}
          <StepContent
            step={steps[step]}
            className="fadeInScale"
            style={{ visibility: animationState === AnimationState.Idle ? 'visible' : 'hidden' }}
          />
        </Row>
        <Row justify="center" gap="8px">
          {steps.map((a, index) => (
            <StepDot key={index} active={step === index} />
          ))}
        </Row>
        {step === 0 ? (
          <Row justify="center" gap="20px">
            <ButtonOutlined width="160px" onClick={toggle} height={'42px'}>
              <Text fontSize={above768 ? '14px' : '12px'} lineHeight={above768 ? '20px' : '14px'}>
                <Trans>Maybe later</Trans>
              </Text>
            </ButtonOutlined>
            <ButtonPrimary
              height={'42px'}
              width="160px"
              onClick={() => {
                dispatch(ActionTypes.START)
              }}
            >
              <Text fontSize={above768 ? '14px' : '12px'} lineHeight={above768 ? '20px' : '14px'}>
                <Trans>Let&apos;s get started</Trans>
              </Text>
            </ButtonPrimary>
          </Row>
        ) : (
          <Row gap="20px" justify="center">
            <ButtonOutlined
              width={above768 ? '160px' : '100px'}
              height={'42px'}
              onClick={() => dispatch(ActionTypes.PREV_STEP)}
            >
              <Text fontSize={above768 ? '14px' : '12px'}>
                <Trans>Back</Trans>
              </Text>
            </ButtonOutlined>
            <ButtonPrimary
              height={'42px'}
              width={above768 ? '160px' : '100px'}
              onClick={() => {
                if (step < steps.length - 1) {
                  dispatch(ActionTypes.NEXT_STEP)
                } else {
                  toggle()
                  onFinished?.()
                }
              }}
            >
              <Text fontSize={above768 ? '14px' : '12px'}>
                {step === steps.length - 1 ? <Trans>Let&apos;s go!</Trans> : <Trans>Next</Trans>}
              </Text>
            </ButtonPrimary>
          </Row>
        )}
      </Wrapper>
    </Modal>
  )
}

export default React.memo(TutorialModal)
