import { rgba } from 'polished'
import { type CSSProperties } from 'react'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'

export const DropdownTitleWrapper = styled.div<{ flatten?: boolean; highlight?: boolean; background?: string }>`
  width: 100%;
  background: ${({ theme, highlight, flatten, background }) =>
    highlight ? rgba(flatten ? theme.primary : theme.blue, 0.2) : background || theme.background};
  border: ${({ theme, highlight, flatten }) =>
    flatten ? `1px solid ${highlight ? theme.primary : 'transparent'}` : 'none'};
  border-radius: 30px;
  padding: ${({ flatten }) => (flatten ? '0px 6px' : '6px 12px')};
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme, highlight }) => (highlight ? theme.text : theme.subText)};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 200ms ease;
`

export const DropdownWrapper = styled.div<{
  mobileFullWidth: boolean
  mobileHalfWidth: boolean
  fullWidth?: boolean
}>`
  position: relative;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'fit-content')};
  flex: ${({ fullWidth }) => (fullWidth ? '1 1 0%' : 'initial')};
  min-width: ${({ fullWidth }) => (fullWidth ? '0' : 'auto')};

  &:hover ${DropdownTitleWrapper} {
    filter: brightness(1.2);
  }

  ${({ theme, mobileFullWidth, mobileHalfWidth }) => theme.mediaWidth.upToSmall`
    ${mobileFullWidth && 'width: 100%;'}
    ${mobileHalfWidth && 'width: calc(50% - 4px);'}
  `}
`

export const DropdownTitle = styled.div<{ width?: number; justifyContent?: string; fullWidth?: boolean }>`
  width: ${({ width, fullWidth }) => {
    if (width) return `${width}px`
    return fullWidth ? '100%' : 'auto'
  }};
  min-width: ${({ width, fullWidth }) => {
    if (fullWidth) return '0'
    return !width ? '100px' : 'max-content'
  }};
  flex: ${({ fullWidth }) => (fullWidth ? '1 1 auto' : '0 0 auto')};
  display: flex;
  align-items: center;
  justify-content: ${({ justifyContent }) => justifyContent || 'flex-start'};
  gap: 6px;
  text-transform: capitalize;

  ${({ theme, fullWidth }) =>
    !fullWidth &&
    theme.mediaWidth.upToExtraSmall`
    min-width: max-content;
  `}
`

export const DropdownLabel = styled.span`
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: inherit;
`

export const DropdownIcon = styled(DropdownSVG)<{ $flatten?: boolean; open: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s;
  ${({ $flatten }) => $flatten && 'margin-inline: -6px;'}
`

export const ItemIcon = styled.img`
  width: 18px;
  height: 18px;
`

export const DropdownContentWrapper = styled.div<{ flatten?: boolean }>`
  position: absolute;
  top: ${({ flatten }) => (flatten ? '32px' : '42px')};
  left: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  background: ${({ theme }) => theme.background};
  box-shadow: ${({ theme }) => `0 8px 12px ${theme.shadow}`};
  filter: brightness(1.2);
  padding: 4px 0;
`

export const ScrollIndicator = styled.div<{ $visible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ $visible }) => ($visible ? '20px' : '0')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  overflow: hidden;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  flex-shrink: 0;
  transition: height 150ms ease, opacity 150ms ease;
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

  &:hover {
    color: ${({ theme }) => theme.text};
  }
`

export const DropdownContent = styled.div<{ alignItems?: CSSProperties['alignItems']; standalone?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ alignItems }) => alignItems || 'flex-start'};
  gap: 4px;
  width: max-content;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 8px;
  color: ${({ theme }) => theme.text};
  font-size: 14px;

  ${({ standalone, theme }) =>
    standalone &&
    `
    position: absolute;
    top: 42px;
    left: 0;
    z-index: 100;
    border-radius: 18px;
    background: ${theme.background};
    box-shadow: 0 8px 12px ${theme.shadow};
    filter: brightness(1.2);
    padding: 8px;
  `}
`

export const DropdownContentItem = styled.div`
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  text-transform: capitalize;

  &:hover {
    background: ${({ theme }) => theme.tableHeader};
  }

  &.selected {
    background: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.primary};
  }
`

export const MultiSelectDropdownContentItem = styled(DropdownContentItem)`
  justify-content: space-between;
`
