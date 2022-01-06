import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

const ToggleButton = styled.span<{ isActive?: boolean }>`
  position: absolute;
  transition: all 0.2s ease;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary : theme.text4)};
  ${({ isActive }) => !isActive && 'transform: translateX(32px);'}
  border-radius: 12px;
  height: 100%;
  width: 34px;
  top: 0;
`

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  font-size: 12px;
  font-weight: ${({ isOnSwitch }) => (isOnSwitch ? '500' : '400')};
  padding: 3px 8px;
  border-radius: 12px;
  z-index: 1;
  transition: all 0.2s ease;
  color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text2)};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  position: relative;
  border-radius: 16px;
  border: none;
  border: 2px solid ${({ theme }) => theme.bg12};
  background: ${({ theme }) => theme.bg12};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} isOnSwitch={true}>
        <Trans>On</Trans>
      </ToggleElement>
      <ToggleElement isActive={!isActive} isOnSwitch={false}>
        <Trans>Off</Trans>
      </ToggleElement>
      <ToggleButton isActive={isActive}> </ToggleButton>
    </StyledToggle>
  )
}
