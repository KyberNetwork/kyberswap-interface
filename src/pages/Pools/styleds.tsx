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

export const ToolbarWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`

export const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
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
