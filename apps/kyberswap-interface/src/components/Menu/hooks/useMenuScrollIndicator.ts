import { useEffect, useState } from 'react'

export const useMenuScrollIndicator = () => {
  const [wrapperNode, setWrapperNode] = useState<HTMLElement | null>(null)
  const [showScroll, setShowScroll] = useState<boolean>(false)

  useEffect(() => {
    if (wrapperNode) {
      const abortController = new AbortController()
      const onScroll = () => {
        if (abortController.signal.aborted) return
        setShowScroll(Math.abs(wrapperNode.offsetHeight + wrapperNode.scrollTop - wrapperNode.scrollHeight) > 10)
      }
      onScroll()
      wrapperNode.addEventListener('scroll', onScroll)
      window.addEventListener('resize', onScroll)
      return () => {
        abortController.abort()
        wrapperNode.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
      }
    }
    return
  }, [wrapperNode])

  return {
    setScrollContainerNode: setWrapperNode,
    showScroll,
  }
}
