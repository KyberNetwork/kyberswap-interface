import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import React, { useRef, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'

const Select = styled.div`
  cursor: pointer;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  position: relative;
  padding: 8px 12px;
  width: 140px;
  height: 36px;
  z-index: 2;
  font-weight: 500;

  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.border};
    :hover {
      background-color: ${lighten(0.1, theme.background)};
    }
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
  border-radius: 4px;
  ${({ theme, active }) => css`
    :hover {
      background-color: ${theme.buttonGray};
    }
    ${active && `color: ${theme.primary}`}
  `}
`

const statusList = ['All', 'Pending', 'Approved', 'Executed', 'Failed', 'Canceled']
export default function SelectProposalStatus({
  status,
  setStatus,
}: {
  status?: string
  setStatus?: (s: string) => void
}) {
  const theme = useTheme()
  const [show, setShow] = useState(false)
  const ref = useRef()
  useOnClickOutside(ref, () => setShow(false))
  return (
    <Select ref={ref as any} onClick={() => setShow(s => !s)}>
      <Text color={!!status && status !== 'All' ? theme.text : undefined}>{status || 'All'}</Text>
      <ChevronDown size={16} />
      <DropdownList show={show}>
        {statusList.map(s => {
          if (s === 'All') {
            return (
              <DropdownItem key={s} active={!status} onClick={() => setStatus?.('')}>
                <Trans>{s}</Trans>
              </DropdownItem>
            )
          }
          return (
            <DropdownItem key={s} active={s === status} onClick={() => setStatus?.(s)}>
              <Trans>{s}</Trans>
            </DropdownItem>
          )
        })}
      </DropdownList>
    </Select>
  )
}
