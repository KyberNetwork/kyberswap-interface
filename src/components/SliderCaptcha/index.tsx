import React, { useState, useRef, useEffect } from 'react'
import captchaImage from 'assets/images/captcha/captcha-image.png'
import captchaPuzzleImage1 from 'assets/images/captcha/captcha-puzzle-1.png'
import captchaPuzzleDesImage1 from 'assets/images/captcha/captcha-puzzle-des-1.png'
import captchaPuzzleImage2 from 'assets/images/captcha/captcha-puzzle-2.png'
import captchaPuzzleDesImage2 from 'assets/images/captcha/captcha-puzzle-des-2.png'
import captchaImageMobile from 'assets/images/captcha/captcha-image-mobile.png'
import captchaPuzzleMobileImage1 from 'assets/images/captcha/captcha-puzzle-mobile-1.png'
import captchaPuzzleMobileDesImage1 from 'assets/images/captcha/captcha-puzzle-mobile-des-1.png'
import styled, { keyframes } from 'styled-components'
import { ArrowRight, X } from 'react-feather'
import { Trans } from '@lingui/macro'
import { isMobile } from 'react-device-detect'
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
  max-width: 100%;
  border-radius: 4px;
  overflow: hidden;
`
const BackgroundImage = styled.div<{ imageUrl: string }>`
  ${isMobile
    ? `
    height: 195px;
    width: 310px;
  `
    : `
    height: 312px;
    width: 500px;
  `}
  position: relative;
  background-image: url(${({ imageUrl }) => imageUrl});
  background-size: cover;
  margin-bottom: 20px;
`
const SliderImage = styled.div<{ puzzleUrl: string; top: number }>`
  position: absolute;
  top: ${({ top }) => top + 'px'};
  ${
    isMobile
      ? `
    height: 53px;
    width: 53px;
  `
      : `
    height: 80px;
    width: 80px;
  `
  }
  background-image: url(${({ puzzleUrl }) => puzzleUrl});
  //border: 2px solid #ffffff90;
  z-index: 2;
  filter: drop-shadow(0 0 3px #333);
`
const DestinationImage = styled.div<{ left: number; top: number; desUrl: string; successed: boolean }>`
  position: absolute;
  top: ${({ top }) => top + 'px'};
  ${
    isMobile
      ? `
    height: 53px;
    width: 53px;
  `
      : `
    height: 80px;
    width: 80px;
  `
  }
  left: ${({ left }) => left}px;
  background-image: url(${({ desUrl }) => desUrl});
  background-size: cover;
  background-repeat: no-repeat;
  z-index: 1;
  transition: opacity 0.5s;
  ${({ successed }) => successed && 'opacity: 0;'}
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
  cursor: grab !important;
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
    animation: ${shake} 0.5s normal;
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
  font-size: ${isMobile ? '16px' : '20px'};
  color: black;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  opacity: 0;
  display: none;
  transition: opacity 0.3s;
  &.successed {
    opacity: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
`

const captchaImages = [
  {
    imageUrl: captchaImage,
    puzzleUrl: captchaPuzzleImage1,
    desUrl: captchaPuzzleDesImage1,
    leftValue: 279,
    topValue: 52,
  },
  {
    imageUrl: captchaImage,
    puzzleUrl: captchaPuzzleImage2,
    desUrl: captchaPuzzleDesImage2,
    leftValue: 112,
    topValue: 125,
  },
]
const captchaImagesMobile = [
  {
    imageUrl: captchaImageMobile,
    puzzleUrl: captchaPuzzleMobileImage1,
    desUrl: captchaPuzzleMobileDesImage1,
    leftValue: 208,
    topValue: 105,
  },
]
export default function SliderCaptcha({ onSuccess, onDismiss }: { onSuccess?: () => void; onDismiss?: () => void }) {
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [successed, setSuccessed] = useState(false)
  const [failed, setFailed] = useState(false)
  const wrapperRef = useRef<HTMLElement>()
  const sliderButtonRef = useRef<HTMLElement>()
  const sliderImageRef = useRef<HTMLElement>()

  const sliderTextRef = useRef<HTMLElement>()
  const destinationRef = useRef<HTMLElement>()
  const captchaImagesList = isMobile ? captchaImagesMobile : captchaImages
  const [captchaImageValues, setCaptchaImageValues] = useState(
    captchaImagesList[Math.floor(Math.random() * captchaImagesList.length)],
  )

  const { imageUrl, puzzleUrl, desUrl, leftValue, topValue } = captchaImageValues
  const handleMousemove = (e: any) => {
    if (successed) return
    if (
      isMouseDown &&
      wrapperRef?.current &&
      sliderButtonRef?.current &&
      sliderImageRef?.current &&
      sliderTextRef?.current
    ) {
      const clientX = isMobile ? e.touches[0].clientX : e.clientX
      const calculateLeft = clientX - wrapperRef.current.offsetLeft - sliderButtonRef.current.offsetWidth / 2

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
        timeoutRef.current = setTimeout(() => {
          onSuccess && onSuccess()
        }, 500)
      } else {
        sliderButtonRef?.current?.classList.add('shake')
        setFailed(true)
        timeoutRef.current = setTimeout(() => {
          setFailed(false)
          sliderButtonRef?.current?.classList.remove('shake')
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
      if (isMobile) {
        document.addEventListener('touchmove', handleMousemove)
        document.addEventListener('touchend', handleMouseup)
      } else {
        document.addEventListener('mousemove', handleMousemove)
        document.addEventListener('mouseup', handleMouseup)
      }
    }
    return () => {
      if (isMobile) {
        document.addEventListener('touchmove', handleMousemove)
        document.addEventListener('touchend', handleMouseup)
      } else {
        document.removeEventListener('mousemove', handleMousemove)
        document.removeEventListener('mouseup', handleMouseup)
      }
    }
  }, [isMouseDown])
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [timeoutRef.current])

  return (
    <Wrapper ref={wrapperRef as any}>
      <BackgroundImage imageUrl={imageUrl}>
        <SliderImage ref={sliderImageRef as any} puzzleUrl={puzzleUrl} top={topValue} />
        <DestinationImage
          ref={destinationRef as any}
          desUrl={desUrl}
          left={leftValue}
          top={topValue}
          successed={successed}
        />
      </BackgroundImage>
      <SliderWrapper>
        <SliderText ref={sliderTextRef as any}>
          <Trans>Slide to complete the puzzle</Trans>
        </SliderText>
        <SuccessText className={successed ? 'successed' : ''}>
          <Trans>Verification successful!</Trans>
        </SuccessText>
        <SliderButton
          onMouseDown={el => {
            if (!failed) {
              setIsMouseDown(true)
            }
          }}
          onTouchStart={el => {
            if (!failed) {
              console.log(1241245124)
              setIsMouseDown(true)
            }
          }}
          ref={sliderButtonRef as any}
        >
          {failed ? <X color="white" size={22} /> : <ArrowRight color="currentcolor" size={22} />}
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
