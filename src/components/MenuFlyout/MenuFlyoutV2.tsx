import { ReactNode, useRef, useState } from 'react'

import MenuFlyout from 'components/MenuFlyout'

export default function MenuFlyout_V2({
  children,
  trigger,
  hasArrow,
  customStyle,
  mobileCustomStyle,
  modalWhenMobile,
  toggle,
  isOpen,
}: {
  customStyle?: any
  mobileCustomStyle?: any
  children: ReactNode
  trigger: ReactNode
  modalWhenMobile?: boolean
  toggle?: () => void
  isOpen?: boolean
  hasArrow?: boolean
}) {
  const [isOpenLocal, setIsOpenLocal] = useState(false)
  const node = useRef<HTMLDivElement>(null)
  const onToggle = () => toggle ?? setTimeout(() => setIsOpenLocal(!isOpenLocal), 100)
  return (
    <div ref={node}>
      <div onClick={onToggle}>{trigger}</div>
      <MenuFlyout
        hasArrow={hasArrow}
        browserCustomStyle={customStyle}
        mobileCustomStyle={mobileCustomStyle ?? customStyle}
        modalWhenMobile={modalWhenMobile}
        node={node}
        isOpen={isOpen ?? isOpenLocal}
        toggle={onToggle}
      >
        {children}
      </MenuFlyout>
    </div>
  )
}
