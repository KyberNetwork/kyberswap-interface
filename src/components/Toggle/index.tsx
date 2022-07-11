import React, { CSSProperties } from 'react'
import styled from 'styled-components'
import { rgba } from 'polished'

export interface ToggleProps {
  id?: string
  className?: string
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
}

const Toggle: React.FC<ToggleProps> = ({ id, isActive, toggle, style, className }) => {
  return (
    <div id={id} onClick={toggle} style={style} data-active={isActive} className={`toggle ${className}`}>
      <div className="dot" />
    </div>
  )
}

export default styled(Toggle)`
  position: relative;
  width: 56px;
  height: 28px;
  background: ${({ theme }) => theme.background};
  border-radius: 999px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  .dot {
    position: absolute;
    top: 50%;
    left: 4px;

    width: 20px;
    height: 20px;

    background: ${({ theme }) => theme.border};
    border-radius: 50%;

    transform: translateY(-50%);
    transition: all 0.2s ease-in-out;
  }

  &[data-active='true'] {
    background: ${({ theme }) => rgba(theme.primary, 0.2)};

    .dot {
      background: ${({ theme }) => theme.primary};
      left: 32px;
    }
  }
`
