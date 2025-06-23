import { darken } from 'polished'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'

type DropdownAlign = 'left' | 'right'
type DropdownProps = {
  $align: DropdownAlign
}
const Dropdown = styled.div.attrs<DropdownProps>(props => ({
  'data-align': props.$align,
}))<DropdownProps>`
  display: none;

  position: absolute;
  top: 100%;

  &[data-align='left'] {
    left: 0;
  }

  &[data-align='right'] {
    right: 0;
  }

  width: max-content;
  padding: 8px;

  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.01), 0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 24px rgba(0, 0, 0, 0.04),
    0 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 16px;
`

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
`
const cssDropDown = css`
  ${Dropdown} {
    display: flex;
    flex-direction: column;
  }

  ${DropdownIcon} {
    transform: rotate(-180deg);
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }
`
const HoverDropdown = styled.div<{ active: boolean; forceShowDropdown?: boolean; isHovered?: boolean }>`
  position: relative;
  display: inline-block;
  width: fit-content;

  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  font-size: 16px;
  font-weight: 500;
  user-select: none;

  ${({ forceShowDropdown }) => forceShowDropdown && cssDropDown}

  ${({ isHovered }) => isHovered && cssDropDown}
`

type Props = {
  id?: string
  forceOpen?: boolean
  isActive?: boolean
  anchor: React.ReactNode
  dropdownContent: React.ReactNode
  dropdownAlign?: DropdownAlign
  className?: string
}
const NavGroup: React.FC<Props> = ({
  id,
  forceOpen,
  isActive,
  anchor,
  dropdownContent,
  dropdownAlign = 'left',
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <HoverDropdown
      id={id}
      forceShowDropdown={forceOpen}
      isHovered={isHovered}
      active={!!isActive}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex
        alignItems="center"
        sx={{
          gap: '2px',
        }}
      >
        {anchor}
        {dropdownContent && <DropdownIcon />}
      </Flex>
      {dropdownContent && (
        <Dropdown
          onClick={e => {
            e.stopPropagation()
            isMobile && setIsHovered(false)
          }}
          $align={dropdownAlign}
        >
          {dropdownContent}
        </Dropdown>
      )}
    </HoverDropdown>
  )
}

export default NavGroup
