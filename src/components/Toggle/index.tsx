import React, { CSSProperties } from 'react'
import styled from 'styled-components'
import { rgba } from 'polished'

const StyledToggle = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 56px;
  height: 28px;
  background: ${({ theme, isActive }) => (isActive ? rgba(theme.primary, 0.2) : theme.background)};
  border-radius: 999px;
  cursor: pointer;
`

const ActiveDot = styled.div<{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme, isActive }) => (!isActive ? theme.border : theme.primary)};
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease-in-out;
  ${({ isActive }) => (isActive ? `left: 32px;` : `left: 4px;`)}
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
}

function Toggle({ id, isActive, toggle, style }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle} style={style}>
      <ActiveDot isActive={isActive} />
    </StyledToggle>
  )
}

export default Toggle
