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

export const DropdownTitleWrapper = styled.div`
  background: ${({ theme }) => theme.background};
  border-radius: 30px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
  justify-content: center;
`

export const DropdownTitle = styled.div<{ width?: number }>`
  width: ${({ width }) => (width ? `${width}px` : '')};
  min-width: ${({ width }) => (!width ? '100px' : 'max-content')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-transform: capitalize;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    min-width: max-content;
  `}
`

export const DropdownIcon = styled(DropdownSVG)<{ open: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.3s;
`

export const ItemIcon = styled.img`
  width: 18px;
  height: 18px;
`

export const DropdownContent = styled.div<{ alignLeft: boolean }>`
  position: absolute;
  top: 42px;
  left: 0;
  background: ${({ theme }) => theme.background};
  border-radius: 24px;
  padding: 8px 12px;
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
  padding: 8px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  text-transform: capitalize;

  &:hover {
    background: ${({ theme }) => theme.tableHeader};
  }
`

export const MultiSelectDropdownContentItem = styled(DropdownContentItem)`
  justify-content: space-between;
`
