import styled, { CSSProperties, css } from 'styled-components'

const StyledMobileTabButton = styled.div<{ active?: boolean }>`
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

export const TabButton = ({
  text,
  active,
  onClick,
  style,
}: {
  text?: string
  active?: boolean
  onClick?: () => void
  style?: CSSProperties
}) => {
  return (
    <StyledMobileTabButton active={active} onClick={onClick} style={style}>
      {text}
    </StyledMobileTabButton>
  )
}
