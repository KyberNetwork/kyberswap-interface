import { CSSProperties, Fragment, ReactNode, useEffect, useRef } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import useTheme from 'hooks/useTheme'
import useThrottle from 'hooks/useThrottle'

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
  const gradientColor = backgroundColor ?? theme.background

  return (
    <div
      ref={shadowRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'flex-start',
        ['--ks-hs-bg' as never]: gradientColor,
        ...style,
      }}
      className="ks-horizontal-scroll relative flex h-fit w-full max-w-[calc(100vw-32px)] items-center justify-end max-sm:justify-start"
    >
      <ScrollContainer innerRef={scrollRef} vertical={false} className="scroll-container" onScroll={handleShadow}>
        <div ref={contentRef} style={style} className="flex flex-1 items-center gap-8">
          {(items ?? []).map(i => (
            <Fragment key={i}>{renderItem(i)}</Fragment>
          ))}
        </div>
      </ScrollContainer>
    </div>
  )
}

export default HorizontalScroll
