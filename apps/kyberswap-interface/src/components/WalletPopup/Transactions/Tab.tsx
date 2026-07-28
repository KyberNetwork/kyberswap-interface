import { useCallback, useLayoutEffect, useState } from 'react'

import { cn } from 'utils/cn'

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
    <div
      data-scrollable={isScrollable}
      data-scroll-left={scrollLeft}
      data-scroll-right={scrollRight}
      className={cn(
        'ks-transactions-tab',
        'relative flex w-full items-center justify-center overflow-hidden rounded-[20px] bg-buttonBlack',
        isScrollable && 'justify-start',
      )}
    >
      <div
        ref={listRef => setListRef(listRef)}
        onScroll={handleScroll}
        className={cn(
          'flex w-full items-center justify-between gap-[2px] overflow-x-auto p-[3px]',
          isScrollable && 'justify-start',
        )}
      >
        {tabs.map(tab => (
          <div
            key={tab.title}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'w-full cursor-pointer select-none rounded-[20px] p-1.5 text-center text-xs font-medium leading-[14px]',
              'text-subText hover:bg-tabActive hover:text-text',
              activeTab === tab.value && '!bg-border text-text',
            )}
          >
            {tab.title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Tab
