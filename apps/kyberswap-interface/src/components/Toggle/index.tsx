import React, { CSSProperties, ReactNode } from 'react'

import { cn } from 'utils/cn'

export interface ToggleProps {
  id?: string
  className?: string
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
  icon?: ReactNode
  highlight?: boolean
}

const Toggle: React.FC<ToggleProps> = ({ id, isActive, toggle, style, className, icon, highlight }) => {
  return (
    <div
      id={id}
      onClick={toggle}
      style={style}
      data-active={isActive}
      data-highlight={highlight}
      className={cn(
        'group relative h-7 w-14 cursor-pointer rounded-full bg-background transition-all duration-200 ease-in-out',
        'data-[active=true]:bg-primary-20',
        'data-[highlight=true]:animate-highlight',
        className,
      )}
    >
      <div
        className={cn(
          'absolute left-1 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-border transition-all duration-200 ease-in-out',
          'group-data-[active=true]:left-8 group-data-[active=true]:bg-primary',
        )}
      >
        {isActive && icon}
      </div>
    </div>
  )
}

export default Toggle
