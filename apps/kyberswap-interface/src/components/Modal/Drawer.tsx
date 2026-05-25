import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import React, { CSSProperties, ReactNode } from 'react'
import { X } from 'react-feather'

import Column from 'components/Column'
import Row from 'components/Row'
import { cn } from 'utils/cn'

const AnimatedDialogOverlay = motion(DialogOverlay)
const AnimatedDialogContent = motion(DialogContent)

export interface ModalProps {
  isOpen: boolean
  onDismiss?: () => void
  width?: string
  bgColor?: string
  zindex?: number | string
  className?: string
  children?: React.ReactNode
  trigger: ReactNode
  title: string
}

export default function Drawer({
  isOpen,
  onDismiss = () => {
    // when not pass prop onDismiss, we stop close Modal when click outside Modal
  },
  width,
  bgColor,
  className,
  children,
  zindex = 100,
  trigger,
  title,
}: ModalProps) {
  const overlayStyle: CSSProperties = { zIndex: zindex as number }
  const contentStyle: CSSProperties | undefined =
    width || bgColor ? { ...(width && { width }), ...(bgColor && { backgroundColor: bgColor }) } : undefined

  return (
    <>
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <AnimatedDialogOverlay
            onDismiss={onDismiss}
            className="ks-dialog-overlay"
            style={overlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatedDialogContent
              className={cn('ks-drawer-content overflow-y-scroll', className)}
              style={contentStyle}
              initial={{ x: -window.innerWidth }}
              animate={{ x: 0 }}
              exit={{ x: -window.innerWidth }}
              transition={{ duration: 0.3 }}
            >
              <Column className="w-full gap-3">
                <Row className="w-full justify-between">
                  <span className="font-medium text-text">{title}</span>
                  <X size={18} className="cursor-pointer text-subText" onClick={onDismiss} />
                </Row>
                <div>{children}</div>
              </Column>
            </AnimatedDialogContent>
          </AnimatedDialogOverlay>
        )}
      </AnimatePresence>
    </>
  )
}
