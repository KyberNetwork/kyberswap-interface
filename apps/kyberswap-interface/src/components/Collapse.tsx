import React, { CSSProperties, ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { cn } from 'utils/cn'

export type CollapseItemProps = {
  header: string | JSX.Element
  expandedOnMount?: boolean
  style?: CSSProperties
  activeStyle?: CSSProperties
  children: ReactNode
  onExpand?: () => void
  className?: string
  arrowComponent?: ReactNode
  headerStyle?: CSSProperties
  headerClassName?: string
  arrowClassName?: string
  animation?: boolean
  maxHeight?: string
}

export const CollapseItem: React.FC<CollapseItemProps> = ({
  header,
  arrowComponent,
  children,
  expandedOnMount = false,
  style,
  activeStyle,
  className,
  onExpand,
  headerStyle,
  headerClassName,
  arrowClassName,
  animation = false,
  maxHeight,
}) => {
  const [isExpanded, setExpanded] = useState(expandedOnMount)

  return (
    <div
      style={{ ...style, ...(isExpanded ? activeStyle : null) }}
      className={cn('relative w-full overflow-hidden bg-background px-6 py-4', className)}
    >
      <div
        className={cn('flex w-full cursor-pointer select-none items-center justify-between', headerClassName)}
        style={headerStyle}
        onClick={() => {
          setExpanded(e => !e)
          onExpand?.()
        }}
      >
        {header}
        <div
          data-expanded={isExpanded}
          className={cn(
            'flex size-8 items-center justify-center text-text transition-transform duration-150 ease-in-out data-[expanded=true]:rotate-180',
            arrowClassName,
          )}
        >
          {arrowComponent || <ChevronDown />}
        </div>
      </div>
      <div
        data-expanded={isExpanded}
        className={cn(
          'w-full overflow-hidden',
          animation &&
            '[transition:max-height_300ms_ease,opacity_200ms_ease,transform_300ms_ease] data-[expanded=false]:translate-y-[-4px] data-[expanded=true]:translate-y-0 data-[expanded=false]:opacity-0 data-[expanded=true]:opacity-100',
        )}
        style={animation ? { maxHeight: isExpanded ? maxHeight : 0 } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
