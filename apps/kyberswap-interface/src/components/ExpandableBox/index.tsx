import { t } from '@lingui/macro'
import { CSSProperties, ReactNode, useRef, useState } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export default function ExpandableBox({
  expandedDefault = false,
  headerContent,
  expandContent,
  backgroundColor,
  border,
  borderRadius,
  padding = '12px',
  color,
  style,
  className,
  hasDivider = true,
  isExpanded: expandedProp,
  onChange,
}: {
  expandedDefault?: boolean
  headerContent?: ReactNode
  expandContent?: ReactNode
  backgroundColor?: string
  border?: string
  borderRadius?: string
  padding?: string
  color?: string
  style?: CSSProperties
  className?: string
  hasDivider?: boolean
  isExpanded?: boolean
  onChange?: (value: boolean) => void
}) {
  const [expanded, setExpanded] = useState(expandedDefault)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleChange = () => {
    if (onChange && expandedProp !== undefined) {
      onChange(!expandedProp)
    } else {
      setExpanded(ex => !ex)
    }
  }

  const isExpanded = expandedProp !== undefined ? expandedProp : expanded
  return (
    <Stack
      style={{
        backgroundColor: backgroundColor || 'black',
        border: border || 'none',
        borderRadius: borderRadius || '8px',
        overflow: 'hidden',
        color,
        ...style,
      }}
      className={cn('[&>*]:transition-all [&>*]:duration-300 [&>*]:ease-in-out', className)}
    >
      <HStack
        onClick={handleChange}
        style={{ backgroundColor: backgroundColor || 'black', padding }}
        className="z-[1] cursor-pointer items-center justify-between gap-4"
      >
        {headerContent || t`Header`}{' '}
        <DropdownSVG style={{ minWidth: 20, transform: isExpanded ? 'rotate(180deg)' : undefined }} />
      </HStack>

      <div ref={contentRef} className={cn('z-0', isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
        {hasDivider && <div className="h-px w-full bg-darkBorder" />}
        <div style={{ padding }}>{expandContent}</div>
      </div>
    </Stack>
  )
}
