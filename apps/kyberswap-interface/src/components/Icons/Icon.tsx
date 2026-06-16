import React from 'react'

import sprite from 'assets/svg/sprite.svg'
import { ICON_ID } from 'constants/index'
import { cn } from 'utils/cn'

export default function Icon({
  id,
  size,
  style,
  color,
  className,
  ...rest
}: {
  id: ICON_ID
  size?: number | string
  color?: string
  style?: React.CSSProperties
  className?: string
  title?: string
}) {
  return (
    <div style={color ? { ...style, color } : style} className={cn(className)} {...rest}>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
