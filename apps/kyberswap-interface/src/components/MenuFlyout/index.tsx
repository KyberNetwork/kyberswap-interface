import React, { CSSProperties, ReactNode, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'

import { ReactComponent as Close } from 'assets/images/x.svg'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { cn } from 'utils/cn'

/**
 * Render a MenuFlyout if it's browser view and render a Modal popout from bottom if it's mobile view.
 * Consumers customize via `className` (browser) or `mobileClassName` (mobile), plus optional `style`
 * and `mobileStyle` for inline overrides.
 */
const MenuFlyoutLocal = (props: {
  className?: string
  mobileClassName?: string
  style?: CSSProperties
  mobileStyle?: CSSProperties
  isOpen: boolean
  toggle: () => void
  children: ReactNode
  node: React.RefObject<HTMLDivElement>
  title?: string
  hasArrow?: boolean
  modalWhenMobile?: boolean
}) => {
  const {
    modalWhenMobile = true,
    children,
    isOpen,
    toggle,
    title,
    mobileClassName,
    className,
    style,
    mobileStyle,
    hasArrow,
    node,
  } = props

  const isModal = isMobile && modalWhenMobile
  useOnClickOutside(node, isOpen && !isModal ? toggle : undefined)
  if (!isOpen) return null
  const content = (
    <MenuTitleWrapper toggle={toggle} title={title}>
      {children}
    </MenuTitleWrapper>
  )
  if (isModal)
    return (
      <Modal isOpen={true} onDismiss={toggle} maxWidth={900}>
        <span className={cn('flex w-full flex-col bg-background p-5', mobileClassName)} style={mobileStyle}>
          {content}
        </span>
      </Modal>
    )
  return (
    <span
      style={style}
      className={cn(
        'ks-menu-flyout absolute right-0 top-14 z-[100] flex min-w-36 flex-col rounded-xl bg-tableHeader p-5 text-base',
        // drop-shadow + box-shadow stacked, recreated verbatim from the original styled-component.
        '[filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.36))]',
        'shadow-[0px_0px_1px_rgba(0,0,0,0.01),0px_4px_8px_rgba(0,0,0,0.04),0px_16px_24px_rgba(0,0,0,0.04),0px_24px_32px_rgba(0,0,0,0.01)]',
        hasArrow && 'ks-menu-flyout-arrow',
        className,
      )}
    >
      {content}
    </span>
  )
}

export default function MenuFlyout({
  children,
  trigger,
  hasArrow,
  className,
  mobileClassName,
  style,
  mobileStyle,
  modalWhenMobile,
  toggle,
  isOpen,
  title,
}: {
  className?: string
  mobileClassName?: string
  style?: CSSProperties
  mobileStyle?: CSSProperties
  title?: string
  children: ReactNode
  trigger: ReactNode
  modalWhenMobile?: boolean
  toggle?: () => void
  isOpen?: boolean
  hasArrow?: boolean
}) {
  const [isOpenLocal, setIsOpenLocal] = useState(false)
  const node = useRef<HTMLDivElement>(null)
  const toggleLocal = () => setTimeout(() => setIsOpenLocal(prev => !prev), 100)
  const onToggle = toggle ?? toggleLocal
  return (
    <div ref={node}>
      <div onClick={onToggle}>{trigger}</div>
      <MenuFlyoutLocal
        title={title}
        hasArrow={hasArrow}
        className={className}
        mobileClassName={mobileClassName ?? className}
        style={style}
        mobileStyle={mobileStyle ?? style}
        modalWhenMobile={modalWhenMobile}
        node={node}
        isOpen={isOpen ?? isOpenLocal}
        toggle={onToggle}
      >
        {children}
      </MenuFlyoutLocal>
    </div>
  )
}

const MenuTitleWrapper = (props: { toggle: () => void; title?: string; children: React.ReactNode }) => {
  if (!props.title) return <>{props.children}</>

  return (
    <AutoColumn className={isMobile ? 'gap-[14px]' : 'gap-2.5'}>
      {isMobile && (
        <div
          onClick={props.toggle}
          className="absolute right-5 top-[17px] cursor-pointer text-subText hover:opacity-60"
        >
          <Close />
        </div>
      )}
      <span className="text-base font-medium text-text">{props.title}</span>
      <ul className="m-0 list-none p-0">{props.children}</ul>
    </AutoColumn>
  )
}
