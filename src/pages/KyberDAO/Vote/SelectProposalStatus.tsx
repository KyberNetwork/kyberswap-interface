import { Trans } from '@lingui/macro'
import React, { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { useOnClickOutside } from 'hooks/useOnClickOutside'

const Select = styled.div`
  cursor: pointer;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  position: relative;
  padding: 10px 12px;
  width: 140px;
  z-index: 2;
  font-weight: 500;

  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.border};
  `}
`
const DropdownList = styled.div<{ show: boolean }>`
  border-radius: 8px;
  transition: 0.2s all ease;
  position: absolute;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  width: 140px;
  z-index: 1;
  overflow: hidden;
  ${({ theme, show }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
    ${show
      ? css`
          opacity: 1;
          max-height: 500px;
          top: calc(100% + 4px);
        `
      : css`
          opacity: 0;
          top: 0;
          max-height: 0;
        `};
  `}
`
const DropdownItem = styled.div<{ active?: boolean }>`
  padding: 8px;
  ${({ theme, active }) => active && `color: ${theme.primary}`}
`
export default function SelectProposalStatus() {
  const [show, setShow] = useState(false)
  const ref = useRef()
  useOnClickOutside(ref, () => setShow(false))
  return (
    <Select ref={ref as any} onClick={() => setShow(s => !s)}>
      <Text>All</Text>
      <ChevronDown size={16} />
      <DropdownList show={show}>
        <DropdownItem active>
          <Trans>All</Trans>
        </DropdownItem>
        <DropdownItem>
          <Trans>Pending</Trans>
        </DropdownItem>
        <DropdownItem>
          <Trans>Approved</Trans>
        </DropdownItem>
        <DropdownItem>
          <Trans>Executed</Trans>
        </DropdownItem>
        <DropdownItem>
          <Trans>Failed</Trans>
        </DropdownItem>
        <DropdownItem>
          <Trans>Cancelled</Trans>
        </DropdownItem>
      </DropdownList>
    </Select>
  )
}
