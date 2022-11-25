import { darken, lighten } from 'polished'
import { Button, ButtonProps } from 'rebass/styled-components'
import styled, { css } from 'styled-components'

export const TabButton = styled(Button)<ButtonProps>`
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.2s ease;
  :hover {
    color: ${({ color }) => color && darken(0.1, color as string)};
  }
  :active {
    color: ${({ color }) => color && lighten(0.02, color as string)};
  }
`

export const TabDivider = styled.div<{ width: number; height: number; color?: string; margin?: string }>`
  display: inline-block;
  background-color: ${({ theme, color }) => (color ? color : theme.subText)};
  margin: ${({ margin }) => (margin ? margin : '0 10px')};

  ${({ width, height }) => css`
    width: ${width}px;
    height: ${height}px;
  `}
`
