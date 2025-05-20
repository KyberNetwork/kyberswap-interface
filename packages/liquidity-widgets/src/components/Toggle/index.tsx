import React, { CSSProperties, ReactNode } from 'react'

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
  icon?: ReactNode
}

const Toggle: React.FC<ToggleProps> = ({ id, isActive, toggle, style, icon }) => {
  return (
    <div
      id={id}
      onClick={toggle}
      style={style}
      data-active={isActive}
      className="relative w-14 h-7 bg-layer1 rounded-full cursor-pointer transition-all duration-200 ease-in-out data-[active='true']:bg-[#18947033]"
    >
      <div
        data-active={isActive}
        className="absolute top-1/2 left-1 w-5 h-5 bg-subText opacity-[0.6] rounded-full -translate-y-1/2 transition-all duration-200 ease-in-out flex items-center justify-center data-[active='true']:bg-success data-[active='true']:left-8 data-[active='true']:opacity-100"
      >
        {isActive && icon}
      </div>
    </div>
  )
}

export default Toggle
