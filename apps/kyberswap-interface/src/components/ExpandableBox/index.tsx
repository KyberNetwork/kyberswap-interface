import { t } from '@lingui/macro'
import { CSSProperties, ReactNode, useRef, useState } from 'react'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { RowBetween } from 'components/Row'
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
    <AutoColumn
      style={{
        backgroundColor: backgroundColor || 'black',
        border: border || 'none',
        borderRadius: borderRadius || '8px',
        overflow: 'hidden',
        color,
        padding,
        ...style,
      }}
      className={cn('[&>*]:transition-all [&>*]:duration-300 [&>*]:ease-in-out', className)}
    >
      <RowBetween
        onClick={handleChange}
        style={{ backgroundColor: backgroundColor || 'black' }}
        className="z-[1] cursor-pointer"
      >
        {headerContent || t`Header`} <DropdownSVG style={{ transform: isExpanded ? 'rotate(180deg)' : undefined }} />
      </RowBetween>

      <div ref={contentRef} className={cn('z-0 mt-0', isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>
        {hasDivider && <Divider style={{ margin: '16px 0', opacity: isExpanded ? '1' : '0' }} />}
        {expandContent}
      </div>
    </AutoColumn>
  )
}
