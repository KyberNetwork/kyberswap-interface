import { Trans } from '@lingui/macro'
import { DialogContent, DialogOverlay } from '@reach/dialog'
import '@reach/dialog/styles.css'
import { transparentize } from 'polished'
import React, { ReactNode } from 'react'
import { X } from 'react-feather'
import { animated, useTransition } from 'react-spring'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Column from 'components/Column'
import Row from 'components/Row'
import useTheme from 'hooks/useTheme'

const AnimatedDialogOverlay = animated(DialogOverlay)

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

const AnimatedDialogContent = animated(DialogContent)
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
export default function Modal({
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
  const fadeTransition = useTransition(isOpen, {
    config: { duration: 200 },
    from: { left: -window.innerWidth },
    enter: { left: 0 },
    leave: { left: -window.innerWidth },
  })

  const theme = useTheme()
  return (
    <>
      {trigger}
      {fadeTransition(
        (style, item) =>
          item && (
            <StyledDialogOverlay zindex={zindex} style={style} onDismiss={onDismiss}>
              <StyledDialogContent width={width} bgColor={bgColor} className={className}>
                <Column width={'100%'} gap="12px">
                  <Row width={'100%'} justify="space-between">
                    <Text fontWeight={'500'} color={theme.text}>
                      <Trans>{title}</Trans>
                    </Text>
                    <X style={{ cursor: 'pointer' }} size={18} color={theme.subText} onClick={onDismiss} />
                  </Row>
                  <div>{children}</div>
                </Column>
              </StyledDialogContent>
            </StyledDialogOverlay>
          ),
      )}
    </>
  )
}
