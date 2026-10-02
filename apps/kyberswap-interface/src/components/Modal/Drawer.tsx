import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import React, { CSSProperties, ReactNode } from 'react'

import IconButton from 'components/Button/IconButton'
import Column from 'components/Column'
import Row from 'components/Row'
import { CloseIcon } from 'theme'
import { cn } from 'utils/cn'

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
  const [shouldRender, setShouldRender] = React.useState(isOpen)
  const overlayStyle: CSSProperties = { zIndex: zindex as number }
  const contentStyle: CSSProperties | undefined =
    width || bgColor ? { ...(width && { width }), ...(bgColor && { backgroundColor: bgColor }) } : undefined

  React.useEffect(() => {
    if (isOpen) setShouldRender(true)
  }, [isOpen])

  return (
    <>
      {trigger}
      {shouldRender && (
        <DialogOverlay
          onDismiss={onDismiss}
          onAnimationEnd={event => {
            if (!isOpen && event.target === event.currentTarget) setShouldRender(false)
          }}
          className="ks-dialog-overlay"
          style={overlayStyle}
          data-drawer-state={isOpen ? 'open' : 'closing'}
        >
          <DialogContent
            className={cn('ks-drawer-content overflow-y-scroll', className)}
            style={contentStyle}
            data-drawer-state={isOpen ? 'open' : 'closing'}
          >
            <Column className="w-full gap-4">
              <Row className="w-full justify-between">
                <span className="font-medium text-text">{title}</span>
                <IconButton aria-label="Close" onClick={onDismiss}>
                  <CloseIcon className="pointer-events-none" />
                </IconButton>
              </Row>
              <div>{children}</div>
            </Column>
          </DialogContent>
        </DialogOverlay>
      )}
    </>
  )
}
