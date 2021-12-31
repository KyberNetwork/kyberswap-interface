import React, { useMemo } from 'react'
import styled, { css } from 'styled-components'
import { BrowserView, MobileView, isMobile } from 'react-device-detect'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

const BrowserDefaultStyle = css`
  min-width: 9rem;
  background-color: ${({ theme }) => theme.background};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 4rem;
  right: 0rem;
  z-index: 100;
  padding: 20px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    top: unset;
    bottom: 3.5rem;
  `};
`

const MobileDefaultStyle = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  padding: 20px;
`
/**
 * Render a MenuFlyout if it's browser view and render a Modal popout from bottom if it's mobile view with custom different css apply for each one.
 */
const MenuFlyout = (props: {
  browserCustomStyle?: any
  mobileCustomStyle?: any
  isOpen: boolean
  toggle: () => void
  children: React.ReactNode
  node: any
}) => {
  useOnClickOutside(props.node, props.isOpen && !isMobile ? props.toggle : undefined)
  const BrowserStyle = useMemo(
    () => styled.span`
      ${BrowserDefaultStyle}
      ${props.browserCustomStyle}
    `,
    [props.browserCustomStyle]
  )
  const MobileStyle = useMemo(
    () => styled.span`
      ${MobileDefaultStyle}
      ${props.mobileCustomStyle}
    `,
    [props.mobileCustomStyle]
  )

  return (
    <>
      <BrowserView>
        <BrowserStyle>{props.children}</BrowserStyle>
      </BrowserView>
      <MobileView>
        <Modal isOpen={props.isOpen} onDismiss={props.toggle} maxWidth={900}>
          <MobileStyle>{props.children}</MobileStyle>
        </Modal>
      </MobileView>
    </>
  )
}

export default MenuFlyout
