import styled from 'styled-components'
import React, { ReactNode } from 'react'
import { Flex } from 'rebass'

const Dropdown = styled.div`
  display: none;
  position: absolute;
  background: ${({ theme }) => theme.tableHeader};
  filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.36));
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 8px;
  padding: 12px;
  width: max-content;
  z-index: 13;
  top: 28px;

  left: 50%;
  transform: translate(-50%, 0);
`
const DropdownIcon = styled.div`
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid ${({ theme }) => theme.text};
  margin-left: 4px;

  transition: transform 300ms;
`

const HoverDropdownWrapper = styled.div<{ disabledHover: boolean }>`
  position: relative;
  display: inline-block;
  cursor: pointer;

  width: fit-content;
  padding: 8px 12px;

  :hover {
    ${Dropdown} {
      display: flex;
      flex-direction: column;
    }

    ${DropdownIcon} {
      transform: rotate(${({ disabledHover }) => (disabledHover ? '0' : '-180deg')});
    }
  }
`

const HoverDropdown = ({ content, dropdownContent }: { content: string | ReactNode; dropdownContent: ReactNode }) => {
  return (
    <HoverDropdownWrapper disabledHover={!dropdownContent}>
      <Flex alignItems="center">
        {content}
        <DropdownIcon />
      </Flex>

      {dropdownContent && <Dropdown>{dropdownContent}</Dropdown>}
    </HoverDropdownWrapper>
  )
}

export default HoverDropdown
