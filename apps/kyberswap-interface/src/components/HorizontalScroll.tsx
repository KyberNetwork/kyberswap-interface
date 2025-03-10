import { CSSProperties, Fragment, ReactNode, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'
import { Flex } from 'rebass'
import styled from 'styled-components'

import useTheme from 'hooks/useTheme'
import useThrottle from 'hooks/useThrottle'

const ScrollContainerWithGradient = styled.div<{ backgroundColor?: string }>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: fit-content;
  width: 100%;
  max-width: calc(100vw - 32px);

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: flex-start;
  `}

  &.left-visible:after,
  &.right-visible:before {
    content: '';
    display: block;
    z-index: 2;
    pointer-events: none;
    position: absolute;
    inset: 0 0 auto auto;
    width: 40px;
    height: 100%;
    top: 50%;
    transform: translateY(-50%);
  }

  &.left-visible:after {
    background: linear-gradient(
      to right,
      ${({ theme, backgroundColor }) => backgroundColor ?? theme.buttonBlack},
      transparent
    );
    left: 0;
  }

  &.right-visible:before {
    background: linear-gradient(
      to left,
      ${({ theme, backgroundColor }) => backgroundColor ?? theme.buttonBlack},
      transparent
    );
    right: 0;
  }
`

const HorizontalScroll = ({
  items,
  renderItem,
  style,
  backgroundColor,
  noShadow,
}: {
  items: string[] | null
  renderItem: (item: string, index?: number) => ReactNode
  style?: CSSProperties
  backgroundColor?: string
  noShadow?: boolean
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const handleShadow = useThrottle(() => {
    if (noShadow || !contentRef.current) return
    const element: any = scrollRef.current
    if (element?.scrollLeft > 0) {
      shadowRef.current?.classList.add('left-visible')
    } else {
      shadowRef.current?.classList.remove('left-visible')
    }

    if (contentRef.current?.scrollWidth - element?.scrollLeft > element?.clientWidth) {
      shadowRef.current?.classList.add('right-visible')
    } else {
      shadowRef.current?.classList.remove('right-visible')
    }
  }, 300)

  useEffect(() => {
    window.addEventListener('resize', handleShadow)
    return () => window.removeEventListener('resize', handleShadow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    handleShadow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const theme = useTheme()

  return (
    <ScrollContainerWithGradient
      ref={shadowRef}
      style={{ flex: 1, overflow: 'hidden', justifyContent: 'flex-start', ...style }}
      backgroundColor={backgroundColor ?? theme.background}
    >
      <ScrollContainer innerRef={scrollRef} vertical={false} className="scroll-container" onScroll={handleShadow}>
        <TagContainer style={style} ref={contentRef}>
          {(items ?? []).map(i => (
            <Fragment key={i}>{renderItem(i)}</Fragment>
          ))}
        </TagContainer>
      </ScrollContainer>
    </ScrollContainerWithGradient>
  )
}

export default HorizontalScroll

const TagContainer = styled(Flex)`
  align-items: center;
  gap: 4px;
  flex: 1;
`
