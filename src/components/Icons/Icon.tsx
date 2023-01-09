import React from 'react'

import sprite from 'assets/svg/sprite.svg'

export default function Icon({ id, size, style }: { id: string; size?: number | string; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <svg width={size || 24} height={size || 24} display="block">
        <use href={`${sprite}#${id}`} width={size || 24} height={size || 24} />
      </svg>
    </div>
  )
}
