import styled from 'styled-components'

export const TabContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.tabBackground};
  border-radius: 20px;
  display: flex;
  padding: 2px;
  cursor: pointer;
`

export const TabItem = styled.div<{ active?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  background: ${({ theme, active }) => (active ? theme.tabActive : 'transparent')};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px;
  border-radius: 20px;
  flex-grow: 1;
  flex-basis: 0;
  transition: color 300ms;
`
