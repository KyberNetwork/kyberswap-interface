import { rgba } from 'polished'
import styled from 'styled-components'

export const PaginationContainer = styled.ul`
  display: flex;
  justify-content: center;
  list-style-type: none;
  background: ${({ theme }) => rgba(theme.subText, 0.04)};
  margin: 0;
  padding: 12px;
  gap: 4px;
  border-radius: 0 0 20px 20px;
`

export const PaginationItem = styled.li<{ $disabled?: boolean; $selected?: boolean }>`
  text-align: center;
  margin: auto 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 36px;
  font-size: 12px;
  color: ${({ theme, $selected }) => ($selected ? theme.primary : theme.subText)};

  ${({ $disabled }) =>
    $disabled &&
    `
     opacity: 0.5;
     pointer-events: none
  `}

  ${({ $selected }) =>
    $selected &&
    `
     pointer-events: none
  `}
`

export const PaginationButton = styled.div<{ active?: boolean; haveBg?: boolean }>`
  height: 36px;
  min-width: 36px;
  width: fit-content;
  display: flex !important;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;

  color: ${({ theme, active }) => (active ? theme.primary : rgba(theme.white, 0.6))};
  background: ${({ theme, active, haveBg }) =>
    !haveBg
      ? active
        ? rgba(theme.black, 0.48)
        : rgba(theme.black, 0.2)
      : active
      ? theme.buttonBlack
      : rgba(theme.buttonBlack, 0.4)};

  &:hover {
    background: ${({ theme, haveBg }) => (haveBg ? theme.buttonBlack : rgba(theme.black, 0.4))};
  }
`
