import React from 'react'

import sprite from 'assets/svg/sprite.svg'
import { ICON_ID } from 'constants/index'

export default function Icon({
  id,
  size,
  style,
  color,
  ...rest
}: {
  id: ICON_ID
  size?: number | string
  color?: string
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <div style={style} {...rest}>
      <svg width={size || 24} height={size || 24} display="block" color={color}>
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
