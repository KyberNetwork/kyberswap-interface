import styled from 'styled-components'
import { Flex } from 'rebass'

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

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 18px;
  `}
`

export const TabDivider = styled.div`
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
  color: ${({ theme }) => theme.subText};
  margin: 0 20px;
`

export const TrueSightFilterBarLayout = styled.div<{ isActiveTabTrending: boolean }>`
  display: grid;
  grid-template-columns: ${({ isActiveTabTrending }) =>
    isActiveTabTrending ? `1fr auto auto auto auto` : `1fr auto auto auto`};
  column-gap: 12px;
  align-items: center;
`

export const TrueSightFilterBarLayoutMobile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const TrueSightFilterBarTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`

export const OptionsContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  left: 0;
  border-radius: 4px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 9999;
  width: 100%;
  transform: translateY(100%);

  & > * {
    cursor: pointer;
    padding: 12px;

    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }

  .no-hover-effect {
    cursor: default;
    &:hover {
      background: inherit;
    }
  }

  .no-hover-effect-divider {
    &:hover {
      background: ${({ theme }) => theme.border};
    }
  }
`
