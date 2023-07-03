import { useCallback, useEffect, useState } from 'react'
import { useCopyToClipboard } from 'react-use'

export default function useCopyClipboard(timeout = 500): [boolean, (toCopy: string) => void] {
  const [isCopied, setIsCopied] = useState(false)
  const [, copy] = useCopyToClipboard()
  const staticCopy = useCallback(
    (text: string) => {
      copy(text)
      setIsCopied(Boolean(text))
    },
    [copy],
  )

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
    return undefined
  }, [isCopied, timeout])

  return [isCopied, staticCopy]
}
