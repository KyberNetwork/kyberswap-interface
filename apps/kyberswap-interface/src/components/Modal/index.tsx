import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import React, { CSSProperties, useCallback } from 'react'
import { isMobile } from 'react-device-detect'

import { cn } from 'utils/cn'

const AnimatedDialogOverlay = motion(DialogOverlay)
const AnimatedDialogContent = motion(DialogContent)

export interface ModalProps {
  isOpen: boolean
  onDismiss?: () => void
  minHeight?: number | string | false
  maxHeight?: number | string
  maxWidth?: number | string
  borderRadius?: number | string
  width?: string
  height?: string
  bgColor?: string
  zindex?: number | string
  margin?: string
  padding?: string
  enableInitialFocusInput?: boolean
  className?: string
  children?: React.ReactNode
  transition?: boolean
  enableSwipeGesture?: boolean
  bypassScrollLock?: boolean
  bypassFocusLock?: boolean
  mobileFullWidth?: boolean
}

const resolveDim = (v: number | string | undefined, unit: 'px' | 'vh' | 'vw') => {
  if (v === undefined) return undefined
  if (typeof v === 'number') return `${v}${unit}`
  return /^\d+(\.\d+)?$/.test(v) ? `${v}${unit}` : v
}

export default function Modal({
  isOpen,
  onDismiss = () => {
    // when not pass prop onDismiss, we stop close Modal when click outside Modal
  },
  minHeight = false,
  margin = '',
  padding = '',
  maxHeight = 90,
  maxWidth = 420,
  width,
  height,
  bgColor,
  enableInitialFocusInput = false,
  className,
  children,
  transition = true,
  zindex = 100,
  borderRadius = '20px',
  enableSwipeGesture = false,
  bypassScrollLock = false,
  bypassFocusLock = false,
  mobileFullWidth = false,
}: ModalProps) {
  const animateValues = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: transition ? 0.2 : 0 },
  }

  const handleDrag = useCallback(
    (e: any, info: any) => {
      if (info.offset.y > 500 || info.velocity.y > 2000) {
        onDismiss()
      }
    },
    [onDismiss],
  )

  const overlayStyle: CSSProperties = { zIndex: zindex as number }

  // Only set width/borderRadius/alignSelf inline when consumer overrode the default — otherwise
  // let .ks-dialog-content CSS handle defaults + responsive fallbacks via media queries.
  const hasExplicitWidth = !!width
  const hasExplicitBorderRadius = borderRadius !== undefined && borderRadius !== '20px'
  const contentStyle: CSSProperties = {
    margin: margin || '0 0 2rem 0',
    backgroundColor: bgColor || 'var(--ks-tableHeader)',
    boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.05)',
    padding: padding || '0',
    height: height || 'auto',
    maxWidth: resolveDim(maxWidth, 'px'),
    maxHeight: maxHeight ? resolveDim(maxHeight, 'vh') : undefined,
    minHeight: minHeight ? resolveDim(minHeight, 'vh') : undefined,
    ...(hasExplicitWidth && { width }),
    ...(hasExplicitBorderRadius && { borderRadius: borderRadius as string }),
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <AnimatedDialogOverlay
          onDismiss={onDismiss}
          dangerouslyBypassScrollLock={bypassScrollLock}
          dangerouslyBypassFocusLock={bypassFocusLock}
          className="ks-dialog-overlay"
          style={overlayStyle}
          {...animateValues}
        >
          <AnimatedDialogContent
            drag={isMobile && enableSwipeGesture && 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDrag={handleDrag as any}
            aria-label="dialog content"
            className={cn('ks-dialog-content', className)}
            style={contentStyle}
            data-has-explicit-width={hasExplicitWidth ? 'true' : 'false'}
            data-has-explicit-radius={hasExplicitBorderRadius ? 'true' : 'false'}
            data-mobile={isMobile ? 'true' : 'false'}
            data-mobile-full-width={mobileFullWidth ? 'true' : 'false'}
            {...animateValues}
          >
            {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
            {!enableInitialFocusInput && isMobile ? <div tabIndex={1} /> : null}
            {children}
          </AnimatedDialogContent>
        </AnimatedDialogOverlay>
      )}
    </AnimatePresence>
  )
}

export const ModalCenter = ({ className, ...props }: ModalProps) => (
  // `ks-modal-center` triggers the override rules in tailwind.css that beat inline-style
  // alignSelf/borderRadius when wrapped on mobile (rendered as a centered dialog instead of
  // a bottom sheet).
  <Modal {...props} className={cn('ks-modal-center', className)} />
)
