import { rgba } from 'polished'
import styled from 'styled-components'

export const TableWrapper = styled.div`
  width: 100%;
  padding: 20px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 16px 0;
  `}

  display: flex;
  flex-direction: column;
  background: ${({ theme }) => rgba(theme.buttonGray, 0.8)};
  border-radius: 20px;
`

export const Table = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
`
export const Row = styled.div<{ $background?: string }>`
  width: 100%;
  height: 46px;
  padding: 0 20px;
  background: unset;

  display: grid;
  align-items: center;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  column-gap: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 2fr 1fr 1fr 1fr;
    column-gap: 8px;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr 1fr;
  `}

  &[role="button"] {
    cursor: pointer;
  }
`

export const TableHeader = styled(Row)`
  border-top: none;
  background-color: ${({ theme }) => theme.background};
  border-radius: 8px 8px 0px 0px;
  color: ${({ theme }) => theme.subText};
`
export const TableRow = styled(Row)``

export const Cell = styled.span<{ textAlign?: 'left' | 'center' | 'right' }>`
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-align: ${({ textAlign }) => textAlign || 'left'};
`
export const HeaderCell = styled(Cell)``

export const RowCell = styled(Cell)`
  color: ${({ theme }) => theme.text};
`
