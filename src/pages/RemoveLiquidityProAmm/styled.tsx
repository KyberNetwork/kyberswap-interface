import styled from 'styled-components'

import { AutoColumn } from 'components/Column'

export const Container = styled.div`
  text-align: center;
  width: calc(100% - 24px);
  margin: 0 auto 12px;
  max-width: 1200px;
  border-radius: 0.5rem;
`

export const GridColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media only screen and (min-width: 768px) {
    grid-template-columns: 1.5fr 2fr;
  }
`

export const FirstColumn = styled(AutoColumn)`
  grid-auto-rows: min-content;
  padding-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  gap: 20px;

  @media only screen and (min-width: 768px) {
    padding-right: 24px;
    padding-bottom: 0;
    border-right: 1px solid ${({ theme }) => theme.border};
    border-bottom: none;
  }
`

export const SecondColumn = styled(AutoColumn)`
  margin-left: 1.5rem;
  border-radius: 1.25rem;
  grid-auto-rows: min-content;
`

export const Content = styled.div`
  background: ${({ theme }) => theme.background};
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
`
