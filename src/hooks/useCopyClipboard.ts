import { useCallback, useEffect, useState } from 'react'
import { useCopyToClipboard } from 'react-use'

export default function useCopyClipboard(timeout = 500): [string | Blob | undefined, (toCopy: string | Blob) => void] {
  const [copied, setCopied] = useState<string | Blob | undefined>(undefined)
  const [, copy] = useCopyToClipboard()
  const staticCopy = useCallback(
    (data: string | Blob) => {
      if (data instanceof Blob) {
        navigator.clipboard.write([new ClipboardItem({ ['image/png']: data })])
      } else {
        copy(data)
      }
      setCopied(data)
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
