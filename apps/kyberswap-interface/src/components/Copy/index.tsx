import React, { CSSProperties, ReactNode, forwardRef, useCallback } from 'react'
import { CheckCircle } from 'react-feather'

import CopyIcon from 'components/Icons/CopyIcon'
import { RowFit } from 'components/Row'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { cn } from 'utils/cn'

type Props = {
  toCopy: string
  margin?: string
  style?: CSSProperties
  size?: string | number
  text?: ReactNode
  color?: string
}

const CopyHelper = forwardRef<HTMLDivElement, Props>(function CopyHelper(
  { toCopy, margin, style = {}, size, text, color },
  ref,
) {
  const [isCopied, setCopied] = useCopyClipboard(2000)

  const onCopy = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault()
      event.stopPropagation()
      setCopied(toCopy)
    },
    [toCopy, setCopied],
  )

  const copyIcon = (
    <>
      <div className={cn('ks-copy-icon absolute left-0 flex items-center', isCopied && 'copied')} style={{ color }}>
        <CopyIcon size={size || 14} />
      </div>
      <div className={cn('ks-check-icon -translate-y-full text-primary', isCopied && 'copied')}>
        <CheckCircle size={size || 14} />
      </div>
    </>
  )

  return (
    <div
      ref={ref}
      onMouseDown={onCopy}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
      }}
      style={{ marginLeft: margin || '4px', ...style }}
      className="relative flex shrink-0 cursor-pointer items-center overflow-hidden no-underline hover:opacity-80 focus:opacity-80 active:opacity-80"
    >
      {text ? (
        <RowFit>
          {copyIcon}&nbsp;{text}
        </RowFit>
      ) : (
        copyIcon
      )}
    </div>
  )
})

export default CopyHelper
