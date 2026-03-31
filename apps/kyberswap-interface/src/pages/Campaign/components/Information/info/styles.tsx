import styled from 'styled-components'

export const TableWrapper = styled.div`
  overflow-x: auto;
`

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`

export const Th = styled.th`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 8px 12px;
  text-align: center;
`

export const Td = styled.td<{ center?: boolean }>`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 8px 12px;
  text-align: ${props => (props.center ? 'center' : 'left')};
`

export const Tr = styled.tr`
  &:hover {
    background-color: ${props => props.theme.buttonBlack};
  }
`
