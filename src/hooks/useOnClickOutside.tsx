import { RefObject, useEffect, useRef } from 'react'
import { isMobile } from 'react-device-detect'

export function useOnClickOutside<T extends HTMLElement>(
  node: RefObject<T | undefined> | RefObject<T | undefined>[],
  handler: undefined | (() => void),
) {
  const handlerRef = useRef<undefined | (() => void)>(handler)
  handlerRef.current = handler

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      let nodes: RefObject<T | undefined>[]
      if (Array.isArray(node)) nodes = node
      else nodes = [node]
      if (nodes.some(node => node.current?.contains(e.target as Node) ?? false)) {
        return
      }
      if (handlerRef.current) handlerRef.current()
    }

    document.addEventListener(isMobile ? 'touchstart' : 'mousedown', handleClickOutside)

    return () => {
      document.removeEventListener(isMobile ? 'touchstart' : 'mousedown', handleClickOutside)
    }
  }, [node])
}
