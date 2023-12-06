import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import { AnimatePresence, motion } from 'framer-motion'
import { transparentize } from 'polished'
import React, { ReactNode } from 'react'
import { X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'

const AnimatedDialogOverlay = motion(DialogOverlay)

const StyledDialogOverlay = styled(AnimatedDialogOverlay)<{ zindex: string | number }>`
  &[data-reach-dialog-overlay] {
    z-index: ${({ zindex }) => zindex};
    overflow: hidden;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${({ theme }) => theme.bgModal};
  }
`

const AnimatedDialogContent = motion(DialogContent)
// destructure to not pass custom props to Dialog DOM element
const StyledDialogContent = styled(
  ({ borderRadius, minHeight, maxHeight, maxWidth, width, height, bgColor, isOpen, margin, ...rest }) => (
    <AnimatedDialogContent {...rest} />
  ),
)`
  overflow-y: scroll;
  &[data-reach-dialog-content] {
    ${({ theme }) => theme.mediaWidth.upToMedium`
      ${css`
        padding: 20px 16px;
        margin: 0 0 2rem 0;
        background-color: ${({ theme }) => theme.tableHeader};
        box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadow1)};
        height: 100vh;
        overflow-y: scroll;
        overflow-x: hidden;
        max-width: 100vw;
        display: flex;
        position: absolute;
        left: 0;
        top: 0;
        width: 80vw;
      `}
    `}
  }
`

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
  const theme = useTheme()

  return (
    <>
      {trigger}
      {
        <AnimatePresence>
          {isOpen && (
            <StyledDialogOverlay
              zindex={zindex}
              onDismiss={onDismiss}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StyledDialogContent
                width={width}
                bgColor={bgColor}
                className={className}
                initial={{ x: -window.innerWidth }}
                animate={{ x: 0 }}
                exit={{ x: -window.innerWidth }}
                transition={{ duration: 0.3 }}
              >
                <Column width={'100%'} gap="12px">
                  <Row width={'100%'} justify="space-between">
                    <Text fontWeight={'500'} color={theme.text}>
                      {title}
                    </Text>
                    <X style={{ cursor: 'pointer' }} size={18} color={theme.subText} onClick={onDismiss} />
                  </Row>
                  <div>{children}</div>
                </Column>
              </StyledDialogContent>
            </StyledDialogOverlay>
          )}
        </AnimatePresence>
      }
    </>
  )
}
