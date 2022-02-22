import styled from 'styled-components'

export const TrueSightPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 32px 16px 100px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 32px 32px 100px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 32px 215px 50px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 32px 252px 50px;
  }
`

export const TabContainer = styled.div`
  display: flex;
`

export const TabItem = styled.div<{ active: boolean }>`
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme, active }) => (active ? theme.primary : theme.subText)};
  cursor: pointer;
`

export const TabDivider = styled.div`
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  color: ${({ theme }) => theme.subText};
  margin: 0 20px;
`
