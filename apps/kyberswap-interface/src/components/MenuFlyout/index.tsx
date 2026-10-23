import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
 * Only sidePanel opts into enter/exit motion and its shadow; default flyouts and mobile modals retain their lifecycle.
 */
const MenuFlyoutLocal = (props: {
  variant?: 'default' | 'sidePanel'
  className?: string
  mobileClassName?: string
  style?: CSSProperties
  mobileStyle?: CSSProperties
  isOpen: boolean
  toggle: () => void
  children: ReactNode
  node: React.RefObject<HTMLDivElement | null>
  title?: string
  hasArrow?: boolean
  modalWhenMobile?: boolean
}) => {
  const {
    variant = 'default',
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

  const reduceMotion = useReducedMotion()
  const isModal = isMobile && modalWhenMobile
  useOnClickOutside(node, isOpen && !isModal ? toggle : undefined)
  const content = (
    <MenuTitleWrapper toggle={toggle} title={title}>
      {children}
    </MenuTitleWrapper>
  )
  if (isModal)
    return isOpen ? (
      <Modal isOpen={true} onDismiss={toggle} maxWidth={900}>
        <span className={cn('flex w-full flex-col bg-background p-5', mobileClassName)} style={mobileStyle}>
          {content}
        </span>
      </Modal>
    ) : null

  const surfaceProps = {
    style,
    className: cn(
      'ks-menu-flyout absolute right-0 top-14 z-[100] flex min-w-36 flex-col rounded-xl bg-tableHeader p-5 text-base',
      variant === 'sidePanel'
        ? 'shadow-[0_8px_24px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.08)]'
        : 'shadow-[0px_0px_1px_rgba(0,0,0,0.01),0px_4px_8px_rgba(0,0,0,0.04),0px_16px_24px_rgba(0,0,0,0.04),0px_24px_32px_rgba(0,0,0,0.01)] [filter:drop-shadow(0_4px_12px_rgba(0,0,0,0.36))]',
      hasArrow && 'ks-menu-flyout-arrow',
      className,
    ),
  }

  if (variant !== 'sidePanel') return isOpen ? <span {...surfaceProps}>{content}</span> : null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.span
          key="side-panel"
          {...surfaceProps}
          initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
          animate={{ opacity: 1, x: 0, pointerEvents: 'auto' }}
          exit={{
            opacity: 0,
            x: reduceMotion ? 0 : -8,
            pointerEvents: 'none',
            transition: { duration: reduceMotion ? 0 : 0.14 },
          }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {content}
        </motion.span>
      )}
    </AnimatePresence>
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
  variant,
}: {
  variant?: 'default' | 'sidePanel'
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
        variant={variant}
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
        <div onClick={props.toggle} className="absolute right-5 top-4 cursor-pointer text-subText hover:opacity-60">
          <Close />
        </div>
      )}
      <span className="text-base font-medium text-text">{props.title}</span>
      <ul className="m-0 list-none p-0">{props.children}</ul>
    </AutoColumn>
  )
}
