import { forwardRef } from 'react'
import styled, { CSSProperties, css } from 'styled-components'

const StyledMobileTabButton = styled.div<{ active?: boolean; separator?: boolean }>`
  font-size: 12px;
  line-height: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  flex: 1;
  box-sizing: border-box;
  cursor: pointer;
  user-select: none;
  ${({ theme, separator, active }) =>
    separator &&
    !active &&
    css`
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        height: 16px;
        border: 1px solid ${theme.border};
      }
    `}
  ${({ theme, active }) =>
    active
      ? css`
          color: ${theme.primary};
          background-color: ${theme.primary + '40'};
          box-shadow: inset 0 -2px 0 0 ${theme.primary};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.background};
        `}

  :hover {
    filter: brightness(1.2);
  }
`

type Props = { text?: string; active?: boolean; onClick?: () => void; style?: CSSProperties; separator?: boolean }
const TabButton = forwardRef<HTMLDivElement, Props>(function TabButton(
  { text, active, onClick, style, separator },
  ref,
) {
  return (
    <StyledMobileTabButton active={active} onClick={onClick} style={style} separator={separator} ref={ref}>
      {text}
    </StyledMobileTabButton>
  )
})

export default TabButton
