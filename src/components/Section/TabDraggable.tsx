import { motion } from 'framer-motion'
import { ReactNode, useEffect, useRef, useState } from 'react'
import styled, { DefaultTheme } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Row from 'components/Row'
import TabButton from 'components/TabButton'
import { ICON_ID } from 'constants/index'
import useTheme from 'hooks/useTheme'
import SimpleTooltip from 'pages/TrueSightV2/components/SimpleTooltip'

const TabWrapper = styled(motion.div)`
  overflow: auto;
  cursor: grab;
  display: inline-flex;
  width: fit-content;
  position: relative;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  min-width: 100%;
  > * {
    flex: 1 0 fit-content;
    scroll-snap-align: start;
  }
  &.no-scroll {
    scroll-snap-type: unset;
    scroll-behavior: unset;
    > * {
      scroll-snap-align: unset;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: initial;
    flex: 1;
  `}
`

export type TabITem<T extends string = string> = {
  type: T
  icon?: ICON_ID
  tooltip?: (theme: DefaultTheme) => ReactNode
  title: string
}
const ARROW_SIZE = 44

export default function TabDraggable<T extends string>({
  activeTab,
  tabs,
  onChange,
  trackingChangeTab,
}: {
  tabs: TabITem<T>[]
  activeTab: T
  onChange?: (type: T) => void
  trackingChangeTab?: (fromTab: T, toTab: T) => void
}) {
  const theme = useTheme()
  const [showScrollRightButton, setShowScrollRightButton] = useState(false)
  const [scrollLeftValue, setScrollLeftValue] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tabListRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    wrapperRef.current?.scrollTo({ left: scrollLeftValue, behavior: 'smooth' })
  }, [scrollLeftValue])

  useEffect(() => {
    const wRef = wrapperRef.current
    if (!wRef) return
    const handleWheel = (e: any) => {
      e.preventDefault()
      setScrollLeftValue(prev => Math.min(Math.max(prev + e.deltaY, 0), wRef.scrollWidth - wRef.clientWidth))
    }
    if (wRef) {
      wRef.addEventListener('wheel', handleWheel)
    }
    return () => wRef?.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setShowScrollRightButton(
        Boolean(wrapperRef.current?.clientWidth && wrapperRef.current?.clientWidth < wrapperRef.current?.scrollWidth),
      )
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const indexActive = tabs.findIndex(e => e.type === activeTab)

  return (
    <Row gap="8px" style={{ position: 'relative' }}>
      <TabWrapper
        ref={wrapperRef}
        onScrollCapture={e => e.preventDefault()}
        style={{ paddingRight: showScrollRightButton ? ARROW_SIZE : undefined }}
      >
        {tabs.map(({ type, title, tooltip }, index) => {
          const props = {
            onClick: () => {
              trackingChangeTab?.(activeTab, type)
              onChange?.(type)
              if (!wrapperRef.current) return
              const tabRef = tabListRef.current[index]
              const wRef = wrapperRef.current
              if (tabRef.offsetLeft < wRef.scrollLeft) {
                setScrollLeftValue(tabRef.offsetLeft)
              }
              if (wRef.scrollLeft + wRef.clientWidth < tabRef.offsetLeft + tabRef.offsetWidth) {
                setScrollLeftValue(tabRef.offsetLeft + tabRef.offsetWidth - wRef.offsetWidth)
              }
            },
          }
          return (
            <SimpleTooltip key={type} text={tooltip?.(theme)} hideOnMobile>
              <TabButton
                separator={index !== 0 && index !== indexActive + 1}
                text={title}
                active={activeTab === type}
                key={type}
                style={{ fontSize: '14px', padding: '4px 12px', height: ARROW_SIZE }}
                {...props}
                ref={el => {
                  if (el) {
                    tabListRef.current[index] = el
                  }
                }}
              />
            </SimpleTooltip>
          )
        })}
      </TabWrapper>
      {showScrollRightButton && (
        <DropdownSVG
          style={{
            transform: 'rotate(-90deg)',
            cursor: 'pointer',
            flexShrink: '0',
            position: 'absolute',
            background: theme.background,
            color: theme.text,
            right: 0,
            top: 0,
            padding: 6,
            height: ARROW_SIZE,
            width: ARROW_SIZE,
          }}
          onClick={() => {
            setScrollLeftValue(prev => prev + 120)
          }}
        />
      )}
    </Row>
  )
}
