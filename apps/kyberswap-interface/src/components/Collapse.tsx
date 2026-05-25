import React, { CSSProperties, ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'

import { cn } from 'utils/cn'

type Props = {
  header: string | JSX.Element
  expandedOnMount?: boolean
  style?: CSSProperties
  activeStyle?: CSSProperties
  children: ReactNode
  onExpand?: () => void
  className?: string
  arrowComponent?: ReactNode
  headerStyle?: CSSProperties
  headerBorderRadius?: string
  arrowStyle?: CSSProperties
  arrowClassName?: string
  animation?: boolean
  maxHeight?: string
}

export const CollapseItem: React.FC<Props> = ({
  header,
  arrowComponent,
  children,
  expandedOnMount = false,
  style = {},
  className,
  headerStyle,
  headerBorderRadius,
  arrowStyle,
  arrowClassName,
  animation = false,
  maxHeight,
}) => {
  const [isExpanded, setExpanded] = useState(expandedOnMount)

  return (
    <div style={style} className={cn('relative w-full bg-background px-6 py-4', className)}>
      <div
        className="flex w-full cursor-pointer select-none items-center justify-between"
        style={{
          ...headerStyle,
          ...(headerBorderRadius !== undefined
            ? { borderRadius: isExpanded ? `${headerBorderRadius} ${headerBorderRadius} 0 0` : headerBorderRadius }
            : {}),
        }}
        onClick={() => {
          setExpanded(e => !e)
        }}
      >
        {header}
        <div
          data-expanded={isExpanded}
          style={arrowStyle}
          className={cn(
            'flex size-8 items-center justify-center text-text [&_svg]:transition-all [&_svg]:duration-150 [&_svg]:ease-in-out data-[expanded=true]:[&_svg]:rotate-180',
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
          animation && '[transition:max-height_500ms_ease]',
          'data-[expanded=false]:max-h-0',
        )}
        style={animation ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
