import React, { useState, useRef, useEffect } from 'react'
import captchaImage from 'assets/images/captcha-image.png'
import captchaPuzzleImage1 from 'assets/images/captcha-puzzle-1.png'
import styled, { keyframes } from 'styled-components'
import { ArrowRight, Check, X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { Trans } from '@lingui/macro'
import { Text } from 'rebass'

const shine = keyframes`
  0% {
    background-position: 0px;
  }
  100% {
    background-position: 200px;
  }
`
const shake = keyframes`
  0%,
	100% {
		transform: translateX(0);
	}

	10%,
	30%,
	50%,
	70% {
		transform: translateX(-5px);
	}

	20%,
	40%,
	60% {
		transform: translateX(5px);
	}

	80% {
		transform: translateX(4px);
	}

	90% {
		transform: translateX(-3px);
	}
`
const ripple = (backgroundColor: string) => keyframes`
  to {
    transform: scale(14);
    opacity:1;
    background-color: ${backgroundColor};
  }
`
const AnimateRipple = styled.span<{ left: number }>`
  opacity: 0;
  position: absolute;
  transform: scale(0);
  background-color: white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${({ theme }) => ripple(theme.primary)} 0.4s ease-out forwards;
  left: ${({ left }) => left}px;
`
const Wrapper = styled.div`
  width: 500px;
  border-radius: 4px;
  overflow: hidden;
`
const BackgroundImage = styled.div`
  height: 312px;
  width: 500px;
  position: relative;
  background-image: url(${captchaImage});
  background-size: cover;
  margin-bottom: 20px;
`
const SliderImage = styled.div`
  position: absolute;
  top: 60px;
  height: 50px;
  width: 60px;
  background-image: url(${captchaPuzzleImage1});
  border: 2px solid #ffffff90;
  z-index: 2;
`
const DestinationImage = styled.div<{ left: number }>`
  position: absolute;
  top: 60px;
  height: 50px;
  width: 60px;
  left: ${({ left }) => left}px;
  background-color: #ffffff70;
  border: 3px solid #ffffff90;
  box-shadow: 0 0 8px #eee;
  z-index: 1;
`
const SliderWrapper = styled.div`
  height: 50px;
  width: 100%;
  background: ${({ theme }) => theme.buttonBlack};
  color: ${({ theme }) => theme.subText};
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  user-select: none;
  overflow: hidden;
`
const SliderButton = styled.div`
  cursor: grab;
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.textReverse};
  height: 52px;
  width: 52px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  transition: background-color 0.1s linear;
  transition: color 0.1s linear;

  &.shake {
    animation: ${shake} 0.5s normal forwards;
    animation-delay: 0.2s;
    animation-iteration-count: 1;
    background-color: red;
  }
`

const SliderText = styled.span`
  font-size: 14px;
  margin-left: 64px;
  pointer-events: none;
  transition: 0.2s opacity ease-out;
  background: linear-gradient(
    to right,
    ${({ theme }) => theme.subText} 0,
    white 10%,
    ${({ theme }) => theme.subText} 20%
  );
  animation: ${shine} 1.3s infinite linear;
  animation-fill-mode: forwards;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-size-adjust: none;
`
const SuccessText = styled.div`
  font-size: 20px;
  color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s;
  &.successed {
    opacity: 1;
  }
`
export default function SliderCaptcha({ onSuccess, onDismiss }: { onSuccess?: () => void; onDismiss?: () => void }) {
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [leftValue, setLeftValue] = useState(325)
  const [successed, setSuccessed] = useState(false)
  const [failed, setFailed] = useState(false)
  const wrapperRef = useRef<HTMLElement>()
  const sliderButtonRef = useRef<HTMLElement>()
  const sliderImageRef = useRef<HTMLElement>()
  const sliderTextRef = useRef<HTMLElement>()
  const destinationRef = useRef<HTMLElement>()
  const handleMousemove = (e: any) => {
    if (successed) return
    if (
      isMouseDown &&
      wrapperRef?.current &&
      sliderButtonRef?.current &&
      sliderImageRef?.current &&
      sliderTextRef?.current
    ) {
      const calculateLeft = e.clientX - wrapperRef.current.offsetLeft - sliderButtonRef.current.offsetWidth / 2
      let left =
        calculateLeft > 0
          ? calculateLeft < wrapperRef.current.offsetWidth - sliderButtonRef.current.offsetWidth
            ? calculateLeft
            : wrapperRef.current.offsetWidth - sliderButtonRef.current.offsetWidth
          : 0
      sliderButtonRef.current.style.left = `${left}px`
      sliderImageRef.current.style.left = `${left}px`
      sliderTextRef.current.style.opacity = left > 60 ? '0' : '1'
    }
  }

  const timeoutRef = useRef<any>(null)
  const checkCorrectCaptcha = () => {
    if (sliderImageRef?.current && destinationRef?.current) {
      if (Math.abs(sliderImageRef.current.offsetLeft - destinationRef.current.offsetLeft) < 5) {
        setSuccessed(true)
        setTimeout(() => {
          onSuccess && onSuccess()
        }, 1500)
      } else {
        sliderButtonRef?.current?.classList.add('shake')
        setFailed(true)
        timeoutRef.current = setTimeout(() => {
          setFailed(false)
        }, 1000)
      }
    }
  }

  const handleMouseup = () => {
    setIsMouseDown(false)
    checkCorrectCaptcha()
  }
  useEffect(() => {
    if (isMouseDown) {
      document.addEventListener('mousemove', handleMousemove)
      document.addEventListener('mouseup', handleMouseup)
    }
    return () => {
      document.removeEventListener('mousemove', handleMousemove)
      document.removeEventListener('mouseup', handleMouseup)
    }
  }, [isMouseDown])
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [timeoutRef.current])
  const handdleWrongVerification = () => {
    onDismiss && onDismiss()
  }
  return (
    <Wrapper ref={wrapperRef as any}>
      <BackgroundImage>
        <SliderImage ref={sliderImageRef as any} />
        <DestinationImage ref={destinationRef as any} left={leftValue} />
      </BackgroundImage>
      <SliderWrapper>
        <SliderText ref={sliderTextRef as any}>
          <Trans>Slide to complete the puzzle</Trans>
        </SliderText>
        <SuccessText className={successed ? 'successed' : ''}>
          <Trans>Verification successful!</Trans>
        </SuccessText>
        <SliderButton
          onMouseDown={() => setIsMouseDown(true)}
          ref={sliderButtonRef as any}
          onAnimationEnd={() => {
            handdleWrongVerification()
          }}
        >
          {failed ? (
            <X color="white" size={22} />
          ) : successed ? (
            <Check color="white" size={22} />
          ) : (
            <ArrowRight color="currentcolor" size={22} />
          )}
        </SliderButton>
        {successed && (
          <>
            <AnimateRipple left={leftValue} />
          </>
        )}
      </SliderWrapper>
    </Wrapper>
  )
}
