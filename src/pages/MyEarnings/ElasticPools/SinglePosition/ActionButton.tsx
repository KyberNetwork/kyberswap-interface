import { rgba } from 'polished'
import styled, { css } from 'styled-components'

const baseButtonCSS = css`
  padding: 8px 12px;
  margin: unset;
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  border-radius: 999px;
  outline: none;
  appearance: none;
  border: 1px solid transparent;
  text-decoration: none;

  display: flex;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  &:disabled {
    cursor: auto;
  }

  user-select: none;
  * {
    user-select: none;
  }
`

type ButtonVariant = 'green' | 'red' | 'gray'

export const ActionButton = styled.button.attrs<{ $variant?: ButtonVariant }>(props => ({
  'data-variant': props.$variant || 'green',
}))<{ $variant?: ButtonVariant }>`
  ${baseButtonCSS}

  &[data-variant='green'] {
    background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.primary};

    &:hover {
      background-color: ${({ theme }) => rgba(theme.primary, 0.3)};
    }

    &:active {
      background-color: ${({ theme }) => rgba(theme.primary, 0.25)};
    }
  }

  &[data-variant='red'] {
    background-color: ${({ theme }) => rgba(theme.red, 0.2)};
    color: ${({ theme }) => theme.red};

    &:hover {
      background-color: ${({ theme }) => rgba(theme.red, 0.3)};
    }

    &:active {
      background-color: ${({ theme }) => rgba(theme.red, 0.25)};
    }
  }

  &[data-variant='gray'] {
    background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
    color: ${({ theme }) => theme.subText};

    &:hover {
      background-color: ${({ theme }) => rgba(theme.subText, 0.3)};
    }

    &:active {
      background-color: ${({ theme }) => rgba(theme.subText, 0.25)};
    }
  }

  &:disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.buttonGray};
    color: ${({ theme }) => theme.border};

    &:hover {
      background-color: ${({ theme }) => theme.buttonGray};
    }

    &:active {
      background-color: ${({ theme }) => theme.buttonGray};
    }
  }
`
