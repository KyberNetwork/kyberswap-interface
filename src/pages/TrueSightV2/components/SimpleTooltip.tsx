import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isMobile } from 'react-device-detect'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  z-index: 100;
  width: fit-content;
  height: fit-content;
  transform: translateX(-50%);
  opacity: 0;
  transition: all;
  &.show {
    opacity: 1;
  }
`

const ContentWrapper = styled.div`
  padding: 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.tableHeader};
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  width: fit-content;
  max-width: 250px;
  position: relative;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.32);

  transform: translateY(5px);
  transition: all 0.5s ease;
`

const Arrow = styled.div<{ left?: number }>`
  width: 10px;
  height: 10px;
  z-index: 99;
  position: absolute;
  ::before {
    position: absolute;
    width: 10px;
    height: 10px;
    z-index: 98;

    content: '';
    border: 1px solid transparent;
    transform: rotate(45deg);
    background: ${({ theme }) => theme.tableHeader};
  }

  &.arrow-top {
    bottom: -8px;
    left: calc(50% - ${({ left }) => left || 0}px);
    transform: translatex(-50%);
    ::before {
      border-top: none;
      border-left: none;
    }
  }
`

export default function SimpleTooltip({
  text,
  delay = 50,
  x,
  y,
  children,
  width: widthProp,
  maxWidth: maxWidthProp,
  disappearOnHover,
  hideOnMobile,
}: {
  text: ReactNode
  delay?: number
  x?: number
  y?: number
  children?: ReactElement
  width?: string
  maxWidth?: string
  disappearOnHover?: boolean
  hideOnMobile?: boolean
}) {
  const [show, setShow] = useState<boolean>(false)
  const [className, setClassName] = useState('')
  const [bodyRect, setBodyRect] = useState<DOMRect>()
  const [{ width, height }, setWidthHeight] = useState({ width: 0, height: 0 })
  const timeOutID = useRef<NodeJS.Timeout>()
  const ref = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const firstRenderRef = useRef<boolean>(true)

  const handleMouseEnter = () => {
    if (timeOutID.current) {
      clearTimeout(timeOutID.current)
    }
    timeOutID.current = setTimeout(() => {
      setShow(true)
      setClassName('show')
    }, delay)
  }
  const handleMouseLeave = useCallback(() => {
    if (timeOutID.current) {
      clearTimeout(timeOutID.current)
    }
    timeOutID.current = setTimeout(() => {
      setClassName('')
      setTimeout(() => {
        setShow(false)
      }, 150)
    }, delay)
  }, [delay])

  useLayoutEffect(() => {
    if (wrapperRef.current && firstRenderRef.current) {
      setWidthHeight({ width: wrapperRef.current.clientWidth, height: wrapperRef.current.clientHeight })
      firstRenderRef.current = false
    }
  }, [show, x, y])

  const { top, left, alphaLeft } = useMemo(() => {
    const clientRect = ref.current?.getBoundingClientRect()
    if (!bodyRect || !clientRect || !height || !width) return {}
    const top = (y || clientRect.top) - (height || 50) - 15 - bodyRect.top + width * 0
    const left = clientRect ? x || clientRect.left + clientRect.width / 2 : 0
    let alphaLeft = Math.min(bodyRect.width - width / 2 - left || 0, 0)
    if (width / 2 > left) {
      alphaLeft = width / 2 - left
    }

    return { top, left, alphaLeft }
  }, [height, width, x, y, bodyRect])

  useEffect(() => {
    if (x !== undefined && y !== undefined) {
      setClassName('show')
    } else {
      setClassName('')
    }
  }, [x, y])

  useEffect(() => {
    const handleResize = () => {
      const bodyRect = document.body.getBoundingClientRect()
      setBodyRect(bodyRect)
    }
    handleResize()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [])

  const isShow = (show || (!!x && !!y)) && !(hideOnMobile && isMobile)

  const tooltipContent = useMemo(() => {
    if (!text) return null
    return ReactDOM.createPortal(
      <Wrapper
        ref={wrapperRef}
        className={className}
        style={{
          inset: `${top}px 0 0 ${(left || 0) + (alphaLeft || 0)}px`,
          transitionDuration: !!firstRenderRef.current ? '0s' : '0.15s',
        }}
        onMouseOver={() => disappearOnHover && handleMouseLeave()}
      >
        <ContentWrapper style={{ width: widthProp || 'fit-content', maxWidth: maxWidthProp || '250px' }}>
          {text}
        </ContentWrapper>
        <Arrow className={`arrow-top`} left={alphaLeft} />
      </Wrapper>,
      document.body,
    )
  }, [alphaLeft, className, disappearOnHover, handleMouseLeave, left, maxWidthProp, text, top, widthProp])

  return (
    <>
      <div ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
        {isShow && !disappearOnHover && tooltipContent}
      </div>
      {isShow && disappearOnHover && tooltipContent}
    </>
  )
}
