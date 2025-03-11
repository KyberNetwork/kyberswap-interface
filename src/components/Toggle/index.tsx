import { rgba } from 'polished'
import React, { CSSProperties, ReactNode } from 'react'
import styled from 'styled-components'

import { highlight } from 'components/swapv2/styleds'

export interface ToggleProps {
  id?: string
  className?: string
  isActive: boolean
  toggle: () => void
  style?: CSSProperties
  icon?: ReactNode
  highlight?: boolean
}

const Dot = styled.div`
  position: absolute;
  top: 50%;
  left: 4px;

  width: 20px;
  height: 20px;

  background: ${({ theme }) => theme.border};
  border-radius: 50%;

  transform: translateY(-50%);
  transition: all 0.2s ease-in-out;

  display: flex;
  align-items: center;
  justify-content: center;
`

const Toggle: React.FC<ToggleProps> = ({ id, isActive, toggle, style, className, icon, highlight }) => {
  return (
    <div id={id} onClick={toggle} style={style} data-active={isActive} className={className} data-highlight={highlight}>
      <Dot>{isActive && icon}</Dot>
    </div>
  )
}

export default styled(Toggle)<{ backgroundColor?: string }>`
  position: relative;
  width: 56px;
  height: 28px;
  background: ${({ theme, backgroundColor }) => backgroundColor || theme.background};
  border-radius: 999px;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &[data-active='true'] {
    background: ${({ theme }) => rgba(theme.primary, 0.2)};

    ${Dot} {
      background: ${({ theme }) => theme.primary};
      left: 32px;
    }
  }

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`
