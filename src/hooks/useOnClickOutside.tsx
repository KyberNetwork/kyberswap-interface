import { RefObject, useEffect, useRef } from 'react'
import { isMobile } from 'react-device-detect'

export function useOnClickOutside<T extends HTMLElement>(
  node: RefObject<T | undefined>,
  handler: undefined | (() => void),
) {
  const handlerRef = useRef<undefined | (() => void)>(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (node.current?.contains(e.target as Node) ?? false) {
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
