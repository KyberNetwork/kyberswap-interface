import { useCallback, useEffect, useState } from 'react'
import { useCopyToClipboard } from 'react-use'

export default function useCopyClipboard(timeout = 500): [string | undefined, (toCopy: string) => void] {
  const [copied, setCopied] = useState<string | undefined>(undefined)
  const [, copy] = useCopyToClipboard()
  const staticCopy = useCallback(
    (text: string) => {
      copy(text)
      setCopied(text)
    },
    [copy],
  )

  useEffect(() => {
    if (copied) {
      const hide = setTimeout(() => {
        setCopied(undefined)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
    return undefined
  }, [copied, timeout])

  return [copied, staticCopy]
}
