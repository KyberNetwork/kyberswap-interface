import styled from 'styled-components'
import { Flex } from 'rebass'

export const PageWrapper = styled.div`
  padding: 16px 16px 100px;
  width: 100%;

  @media only screen and (min-width: 768px) {
    padding: 24px 16px 100px;
  }

  @media only screen and (min-width: 1000px) {
    padding: 24px 32px 100px;
  }

  @media only screen and (min-width: 1366px) {
    padding: 24px 215px 50px;
  }

  @media only screen and (min-width: 1440px) {
    padding: 24px 252px 50px;
  }
`

export const InstructionAndGlobalDataContainer = styled.div`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: 1fr auto auto;
  margin-bottom: 24px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `};
`

export const GlobalDataItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 50px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 8px;
  `};
`

export const GlobalDataItemBaseLine = styled.div`
  display: flex;
  align-items: baseline;
  margin-top: -2px;
`

export const GlobalDataItemTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.text7};
`

export const GlobalDataItemValue = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
`

export const InstructionItem = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.bg17};
  border-radius: 5px;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-column: 1 / span 2;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-column: revert;
  `};
`

export const InstructionText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
`

export const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`

export const CurrencyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;

  @media only screen and (min-width: 1000px) {
    flex-direction: row;
    margin-bottom: 0;
  }
`

export const SearchWrapper = styled(Flex)`
  align-items: center;
  gap: 12px;
`

export const SelectPairInstructionWrapper = styled.div`
  text-align: center;
  height: 100%;
  padding: 24px;
`
