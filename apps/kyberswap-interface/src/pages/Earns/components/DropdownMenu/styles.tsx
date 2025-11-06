import { rgba } from 'polished'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'

export const DropdownWrapper = styled.div<{ mobileFullWidth: boolean; mobileHalfWidth: boolean }>`
  position: relative;
  width: fit-content;

  ${({ theme, mobileFullWidth, mobileHalfWidth }) => theme.mediaWidth.upToSmall`
    ${mobileFullWidth && 'width: 100%;'}
    ${mobileHalfWidth && 'width: calc(50% - 4px);'}
  `}
`

export const DropdownTitleWrapper = styled.div<{ flatten?: boolean; highlight?: boolean }>`
  background: ${({ theme, highlight, flatten }) =>
    highlight ? rgba(flatten ? theme.primary : theme.blue, 0.2) : theme.background};
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
`

export const DropdownTitle = styled.div<{ width?: number; justifyContent?: string }>`
  width: ${({ width }) => (width ? `${width}px` : '')};
  min-width: ${({ width }) => (!width ? '100px' : 'max-content')};
  display: flex;
  align-items: center;
  justify-content: ${({ justifyContent }) => justifyContent || 'center'};
  gap: 6px;
  text-transform: capitalize;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: max-content;
  `}
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

export const DropdownContent = styled.div<{ flatten?: boolean; alignLeft: boolean }>`
  position: absolute;
  top: ${({ flatten }) => (flatten ? '32px' : '42px')};
  left: 0;
  background: ${({ theme }) => theme.background};
  border-radius: 18px;
  padding: 8px 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  width: max-content;
  display: flex;
  flex-direction: column;
  align-items: ${({ alignLeft }) => (alignLeft ? 'flex-start' : 'center')};
  gap: 4px;
  z-index: 100;
  filter: brightness(1.2);
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
