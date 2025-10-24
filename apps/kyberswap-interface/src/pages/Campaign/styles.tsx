import styled from 'styled-components'

export const Wrapper = styled.div`
  max-width: 992px;
  margin-x: auto;
  padding: 1rem;
`

export const StatCard = styled.div`
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  padding: 1rem 1rem;
`

export const Tabs = styled.div`
  display: flex;
  gap: 1.5rem;
  font-size: 20px;
  font-weight: 500;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 16px;
    justify-content: space-between;
  `}
`

export const Tab = styled.div<{ active: boolean }>`
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
