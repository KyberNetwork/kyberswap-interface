import useCopyClipboard from 'hooks/useCopyClipboard'
import React from 'react'
import { CheckCircle, Copy } from 'react-feather'
import useTheme from 'hooks/useTheme'

export default function CopyHelper({ textToCopy }: { textToCopy: string }) {
  const [isCopied, setCopied] = useCopyClipboard()
  const theme = useTheme()
  return (
    <span
      onClick={() => {
        setCopied(textToCopy)
      }}
      style={{ right: 0, cursor: 'pointer', color: theme.subText }}
    >
      {isCopied ? <CheckCircle size="17" /> : <Copy size="17" />}
    </span>
  )
}
