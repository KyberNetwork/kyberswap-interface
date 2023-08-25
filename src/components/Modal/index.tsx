import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import { transparentize } from 'polished'
import React, { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import styled, { css } from 'styled-components'

const AnimatedDialogOverlay = motion(DialogOverlay)

const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{ zindex: string | number }>`
  &[data-reach-dialog-overlay] {
    z-index: ${({ zindex }) => zindex};
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${({ theme }) => theme.modalBG};
  }
`

const AnimatedDialogContent = motion(DialogContent)
// destructure to not pass custom props to Dialog DOM element
const StyledDialogContent = styled(
  ({ borderRadius, minHeight, maxHeight, maxWidth, width, height, bgColor, mobile, isOpen, margin, ...rest }) => (
    <AnimatedDialogContent {...rest} />
  ),
).attrs({
  'aria-label': 'dialog',
})`
  overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};

  &[data-reach-dialog-content] {
    margin: ${({ margin }) => margin || '0 0 2rem 0'};
    background-color: ${({ theme, bgColor }) => bgColor || theme.tableHeader};
    box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
    padding: 0;
    width: ${({ width }) => width || '50vw'};
    height: ${({ height }) => height || 'auto'};
    overflow-y: ${({ mobile }) => (mobile ? 'scroll' : 'hidden')};
    overflow-x: hidden;
    align-self: ${({ mobile }) => (mobile ? 'flex-end' : 'center')};
    max-width: ${({ maxWidth }) => (maxWidth && !isNaN(maxWidth) ? `${maxWidth}px` : maxWidth)};
    ${({ maxHeight }) =>
      maxHeight &&
      `
        max-height: ${maxHeight && !isNaN(maxHeight) ? `${maxHeight}vh` : maxHeight};
      `}
    ${({ minHeight }) =>
      minHeight &&
      `
        min-height: ${!isNaN(minHeight) ? `${minHeight}vh` : minHeight};
      `}
    display: flex;
    ${({ borderRadius }) =>
      borderRadius &&
      `
        border-radius: ${borderRadius};
      `}
    ${({ theme, width }) => theme.mediaWidth.upToMedium`
      width:  ${width || '65vw'};
      margin: 0;
    `}
    ${({ theme, mobile, borderRadius }) => theme.mediaWidth.upToSmall`
      width:  85vw;
      ${
        mobile &&
        `
          width: 100vw;
          border-radius: ${borderRadius};
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        `
      }
    `}
  }
`

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
  enableInitialFocusInput?: boolean
  className?: string
  children?: React.ReactNode
  transition?: boolean
  enableSwipeGesture?: boolean
  bypassScrollLock?: boolean
  bypassFocusLock?: boolean
}

export default function Modal({
  isOpen,
  onDismiss = () => {
    // when not pass prop onDismiss, we stop close Modal when click outside Modal
  },
  minHeight = false,
  margin = '',
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
  enableSwipeGesture = true,
  bypassScrollLock = false,
  bypassFocusLock = false,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <StyledDialogOverlay
          zindex={zindex}
          onDismiss={onDismiss}
          dangerouslyBypassScrollLock={bypassScrollLock}
          dangerouslyBypassFocusLock={bypassFocusLock}
          {...animateValues}
        >
          <StyledDialogContent
            drag={isMobile && enableSwipeGesture && 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDrag={handleDrag}
            aria-label="dialog content"
            minHeight={minHeight}
            maxHeight={maxHeight}
            maxWidth={maxWidth}
            margin={margin}
            width={width}
            height={height}
            bgColor={bgColor}
            borderRadius={borderRadius}
            mobile={isMobile}
            className={className}
            {...animateValues}
          >
            {/* prevents the automatic focusing of inputs on mobile by the reach dialog */}
            {!enableInitialFocusInput && isMobile ? <div tabIndex={1} /> : null}
            {children}
          </StyledDialogContent>
        </StyledDialogOverlay>
      )}
    </AnimatePresence>
  )
}

export const ModalCenter = styled(Modal)`
  ${isMobile &&
  css`
    align-self: unset !important;
    border-radius: 24px !important;
  `}
`
