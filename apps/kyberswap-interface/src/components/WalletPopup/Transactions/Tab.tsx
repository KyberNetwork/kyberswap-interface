import { useCallback, useLayoutEffect, useState } from 'react'
import styled, { css } from 'styled-components'

import Row from 'components/Row'

const ListTab = styled.div`
  display: flex;
  width: 100%;
  gap: 2px;
  align-items: center;
  justify-content: space-between;
  padding: 3px;
  overflow-x: auto;
`

type WrapperProps = {
  $scrollable: boolean
  $scrollLeft: boolean
  $scrollRight: boolean
}
const TabWrapper = styled(Row).attrs<WrapperProps>(props => ({
  'data-scrollable': props.$scrollable,
  'data-scroll-left': props.$scrollLeft,
  'data-scroll-right': props.$scrollRight,
}))<WrapperProps>`
  position: relative;

  width: 100%;
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  justify-content: center;

  overflow: hidden;

  &[data-scrollable='true'] {
    justify-content: flex-start;

    ${ListTab} {
      justify-content: flex-start;
    }

    &[data-scroll-left='true'] {
      ::before {
        content: '';
        width: 36px;
        height: 100%;

        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-1px);

        display: flex;
        align-items: center;

        background: linear-gradient(
          -90deg,
          rgba(0, 0, 0, 0) 0%,
          ${({ theme }) => theme.background} 90%,
          ${({ theme }) => theme.background} 100%
        );
      }
    }

    &[data-scroll-right='true'] {
      ::after {
        content: '';
        width: 36px;
        height: 100%;

        position: absolute;
        top: 0;
        right: 0;
        transform: translateX(1px);

        display: flex;
        justify-content: flex-end;
        align-items: center;

        background: linear-gradient(
          90deg,
          rgba(0, 0, 0, 0) 0%,
          ${({ theme }) => theme.background} 90%,
          ${({ theme }) => theme.background} 100%
        );
      }
    }
  }
`

const TabItem = styled.div<{ active: boolean }>`
  width: 100%;
  padding: 6px;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  color: ${({ theme }) => theme.subText};
  border-radius: 20px;
  :hover {
    color: ${({ theme }) => theme.text};
    background-color: ${({ theme }) => theme.tabActive};
  }
  ${({ active }) =>
    active
      ? css`
          color: ${({ theme }) => theme.text};
          background-color: ${({ theme }) => theme.border} !important;
        `
      : null}
`

interface TabProps<T extends string> {
  activeTab: T
  setActiveTab: React.Dispatch<React.SetStateAction<T>>
  tabs: readonly { readonly title: string; readonly value: T }[]
}
function Tab<T extends string>({ activeTab, setActiveTab, tabs }: TabProps<T>) {
  const [isScrollable, setScrollable] = useState(false)
  const [scrollLeft, setScrollLeft] = useState(false)
  const [scrollRight, setScrollRight] = useState(false)

  const [listRef, setListRef] = useState<HTMLDivElement | null>(null)

  const handleScroll = useCallback(() => {
    if (!listRef) return
    const { clientWidth, scrollWidth, scrollLeft } = listRef
    setScrollable(clientWidth < scrollWidth)
    setScrollLeft(scrollLeft > 0)
    setScrollRight(scrollLeft < scrollWidth - clientWidth)
  }, [listRef])

  useLayoutEffect(() => {
    if (!listRef) return
    const resizeHandler = () => {
      const { clientWidth, scrollWidth, scrollLeft } = listRef
      setScrollable(clientWidth < scrollWidth)
      setScrollLeft(scrollLeft > 0)
      setScrollRight(scrollLeft < scrollWidth - clientWidth)
    }

    const { ResizeObserver } = window
    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(resizeHandler)
      resizeObserver.observe(listRef)

      return () => resizeObserver.disconnect()
    } else {
      window.addEventListener('resize', resizeHandler)
      return () => window.removeEventListener('resize', resizeHandler)
    }
  }, [listRef])

  return (
    <TabWrapper $scrollable={isScrollable} $scrollLeft={scrollLeft} $scrollRight={scrollRight}>
      <ListTab ref={listRef => setListRef(listRef)} onScroll={handleScroll}>
        {tabs.map(tab => (
          <TabItem key={tab.title} active={activeTab === tab.value} onClick={() => setActiveTab(tab.value)}>
            {tab.title}
          </TabItem>
        ))}
      </ListTab>
    </TabWrapper>
  )
}

export default Tab
