import styled, { css } from 'styled-components'

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 4px;
`

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  column-gap: 16px;
`

export const Value = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
`

export const ValueAPR = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;

  color: ${({ theme }) => theme.apr};
`

export const Label = styled.span<{ $hasTooltip?: boolean }>`
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  width: fit-content;
  white-space: nowrap;

  ${({ $hasTooltip, theme }) =>
    $hasTooltip
      ? css`
          border-bottom: 1px dashed transparent;
          border-bottom-color: ${theme.subText};
        `
      : ''};
`
