import React from 'react'

import sprite from 'assets/svg/sprite.svg'

export default function Icon({
  id,
  size,
  style,
  ...rest
}: {
  id: string
  size?: number | string
  style?: React.CSSProperties
  title?: string
}) {
  return (
    <div style={style} {...rest}>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
