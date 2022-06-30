import React, { useState, useRef } from 'react'
import captchaImage from 'assets/images/captcha-image.png'
import captchaPuzzleImage1 from 'assets/images/captcha-puzzle-1.png'
import styled from 'styled-components'
import { ArrowRight, Check } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { Trans } from '@lingui/macro'
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
`
const SliderButton = styled.div`
  cursor: grab;
  background-color: ${({ theme }) => theme.primary};
  height: 52px;
  width: 52px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
`
const SliderText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.subText};
  margin-left: 64px;
  pointer-events: none;
  transition: 0.2s opacity ease-out;
`
export default function SliderCaptcha({ onSuccess }: { onSuccess?: () => void }) {
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [leftValue, setLeftValue] = useState(325)
  const [successed, setSuccessed] = useState(false)
  const wrapperRef = useRef<HTMLElement>()
  const sliderButtonRef = useRef<HTMLElement>()
  const sliderImageRef = useRef<HTMLElement>()
  const sliderTextRef = useRef<HTMLElement>()
  const destinationRef = useRef<HTMLElement>()
  const theme = useTheme()
  const handleDrag = (e: any) => {
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
  const checkCorrectCaptcha = () => {
    if (sliderImageRef?.current && destinationRef?.current) {
      if (Math.abs(sliderImageRef.current.offsetLeft - destinationRef.current.offsetLeft) < 5) {
        setTimeout(() => {
          setSuccessed(true)
        }, 500)
        onSuccess && onSuccess()
      }
    }
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
        <SliderButton
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={e => {
            setIsMouseDown(false)
            checkCorrectCaptcha()
          }}
          onMouseMove={handleDrag}
          ref={sliderButtonRef as any}
        >
          {successed ? <Check color={theme.text} size={22} /> : <ArrowRight color={theme.textReverse} size={22} />}
        </SliderButton>
      </SliderWrapper>
    </Wrapper>
  )
}
