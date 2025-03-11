import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const Row = styled(Box)<{
  width?: string
  align?: string
  justify?: string
  padding?: string
  border?: string
  borderRadius?: string
  gap?: string
}>`
  width: ${({ width }) => width ?? '100%'};
  display: flex;
  padding: 0;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'flex-start'};
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
  gap: ${({ gap }) => gap};
`

export const RowBetween = styled(Row)`
  justify-content: space-between;
`

export const RowFlat = styled.div`
  display: flex;
  align-items: flex-end;
`

export const AutoRow = styled(Row)<{ gap?: string; justify?: string }>`
  flex-wrap: wrap;
  margin: ${({ gap }) => gap && `-${gap}`};
  justify-content: ${({ justify }) => justify && justify};

  & > * {
    margin: ${({ gap }) => gap} !important;
  }
`

export const RowFixed = styled(Row)<{ gap?: string; justify?: string }>`
  width: fit-content;
  margin: ${({ gap }) => gap && `-${gap}`};
`

export const RowFit = styled(Row)`
  width: fit-content;
`

export const RowWrap = styled(Row)<{ gap?: string; itemsInRow?: number }>`
  --gap: ${({ gap }) => gap || '24px'};
  --items-in-row: ${({ itemsInRow }) => itemsInRow || 3};
  flex-wrap: wrap;
  gap: var(--gap);
  & > * {
    width: calc(100% / var(--items-in-row) - (var(--items-in-row) - 1) * var(--gap) / var(--items-in-row));
  }
`

export default Row
