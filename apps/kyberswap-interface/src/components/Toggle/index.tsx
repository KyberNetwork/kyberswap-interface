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
  size?: 'md' | 'sm'
}

const Toggle: React.FC<ToggleProps> = ({ id, isActive, toggle, style, className, icon, highlight, size = 'md' }) => {
  return (
    <div
      id={id}
      onClick={toggle}
      style={style}
      data-active={isActive}
      data-highlight={highlight}
      className={cn(
        'group relative cursor-pointer rounded-full bg-background transition-all duration-200 ease-in-out',
        size === 'sm' ? 'h-5 w-9' : 'h-7 w-14',
        'data-[active=true]:bg-primary-20',
        'data-[highlight=true]:animate-highlight',
        className,
      )}
    >
      <div
        className={cn(
          'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-border transition-all duration-200 ease-in-out',
          size === 'sm'
            ? 'left-0.5 size-4 group-data-[active=true]:left-[18px]'
            : 'left-1 size-5 group-data-[active=true]:left-8',
          'group-data-[active=true]:bg-primary',
        )}
      >
        {isActive && icon}
      </div>
    </div>
  )
}

export default Toggle
