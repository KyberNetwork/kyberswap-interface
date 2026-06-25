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
  className?: string
}

const CopyHelper = forwardRef<HTMLDivElement, Props>(function CopyHelper(
  { toCopy, margin, style = {}, size = 14, text, color, className },
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
      <div
        className={cn('ks-copy-icon absolute left-0 flex items-center', isCopied && 'copied')}
        style={color ? { color } : undefined}
      >
        <CopyIcon size={size} />
      </div>
      <div className={cn('ks-check-icon flex items-center text-primary', isCopied && 'copied')}>
        <CheckCircle size={size} />
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
      className={cn(
        'relative flex h-fit shrink-0 cursor-pointer items-center self-center overflow-hidden no-underline hover:opacity-80 focus:opacity-80 active:opacity-80',
        className,
      )}
    >
      {text ? (
        <RowFit className="gap-1">
          <span className="relative flex shrink-0 items-center overflow-hidden" style={{ width: size, height: size }}>
            {copyIcon}
          </span>
          <span>{text}</span>
        </RowFit>
      ) : (
        copyIcon
      )}
    </div>
  )
})

export default CopyHelper
