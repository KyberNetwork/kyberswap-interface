import { rgba, transparentize } from 'polished'
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
  height: 36px;
  padding: 0 20px;
  background: unset;

  display: grid;
  align-items: center;
  grid-template-columns: 48px 1fr 96px 24px;
  column-gap: 16px;
  border-top: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    column-gap: 8px;
  `}

  &[role="button"] {
    cursor: pointer;
  }
`

export const TableHeader = styled(Row)`
  border-top: none;
  background: linear-gradient(0deg, #134134 0%, #0f221e 100%);
  background: linear-gradient(
    0deg,
    ${({ theme }) => transparentize(0.5, theme.primary)} 0%,
    ${({ theme }) => transparentize(0.8, theme.primary)} 100%
  );
`
export const TableRow = styled(Row)``

export const HeaderCell = styled.span<{ textAlign?: 'left' | 'center' | 'right' }>`
  font-weight: 500;
  font-size: 16px;
  line-height: 36px;
  color: ${({ theme }) => theme.text};
  text-align: ${({ textAlign }) => textAlign || 'left'};
`
