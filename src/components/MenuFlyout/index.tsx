import React from 'react'
import { isMobile } from 'react-device-detect'
import styled, { css } from 'styled-components'

import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

import { ReactComponent as Close } from '../../assets/images/x.svg'

const Arrow = css`
  & > div {
    position: relative;
    &:after {
      bottom: 100%;
      right: 0;
      top: -40px;
      border: solid transparent;
      content: '';
      height: 0;
      width: 0;
      position: absolute;
      pointer-events: none;
      border-bottom-color: ${({ theme }) => theme.tableHeader};
      border-width: 10px;
      margin-left: -10px;
    }
  }
  ${({ theme }) => theme.mediaWidth.upToLarge`
    & > div:after {
      top: calc(100% + 20px);
      border-top-color: ${({ theme }) => theme.tableHeader};
      border-bottom-color: transparent;
      border-width: 10px;
      margin-left: -10px;
    }
  `};
`

const BrowserDefaultStyle = css`
  min-width: 9rem;
  background-color: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3.5rem;
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

const BrowserStyle = styled.span<{ hasArrow: boolean; customStyle: any }>`
  ${BrowserDefaultStyle}
  ${({ hasArrow }) => (hasArrow ? Arrow : '')}
  ${({ customStyle }) => customStyle}
`

const MobileStyle = styled.span<{ customStyle: any }>`
  ${MobileDefaultStyle}
  ${({ customStyle }) => customStyle}
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
  hasArrow?: boolean
}) => {
  useOnClickOutside(props.node, props.isOpen && !isMobile ? props.toggle : undefined)
  if (!props.isOpen) return null
  if (isMobile)
    return (
      <Modal isOpen={true} onDismiss={props.toggle} maxWidth={900}>
        <MobileStyle customStyle={props.mobileCustomStyle}>
          <MenuTitleWrapper toggle={props.toggle}>{props.children}</MenuTitleWrapper>
        </MobileStyle>
      </Modal>
    )
  return (
    <BrowserStyle hasArrow={!!props.hasArrow} customStyle={props.browserCustomStyle}>
      <MenuTitleWrapper toggle={props.toggle}>{props.children}</MenuTitleWrapper>
    </BrowserStyle>
  )
}

export default MenuFlyout

const CloseIcon = styled.div`
  position: absolute;
  right: 20px;
  top: 17px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const MenuTitleWrapper = (props: { toggle: () => void; children: React.ReactNode }) => {
  return (
    <AutoColumn gap={isMobile ? '14px' : '10px'}>
      {isMobile && (
        <CloseIcon onClick={props.toggle}>
          <CloseColor />
        </CloseIcon>
      )}
      <AutoColumn>{props.children}</AutoColumn>
    </AutoColumn>
  )
}
