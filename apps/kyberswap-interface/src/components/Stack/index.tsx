import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

type StackSpacing = 'sm' | 'md' | 'lg' | number | string

type StackAlignItems = 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'stretch' | 'baseline'
type StackJustify =
  | 'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'

const getSpacing = (value?: StackSpacing) => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return (value === 'sm' && '8px') || (value === 'md' && '12px') || (value === 'lg' && '24px') || value
}

export type StackProps = {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  gap?: StackSpacing
  spacing?: StackSpacing
  rowGap?: StackSpacing
  columnGap?: StackSpacing
  align?: StackAlignItems
  alignItems?: StackAlignItems
  justify?: StackJustify
  justifyContent?: StackJustify
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
}

export const Stack = styled(Box)<StackProps>`
  display: flex;
  flex-direction: ${({ direction }) => direction || 'column'};
  align-items: ${({ alignItems, align }) => alignItems || align || 'stretch'};
  justify-content: ${({ justifyContent, justify }) => justifyContent || justify || 'flex-start'};
  flex-wrap: ${({ wrap }) => wrap || 'nowrap'};
  gap: ${({ gap, spacing }) => getSpacing(gap || spacing)};
  row-gap: ${({ rowGap }) => getSpacing(rowGap)};
  column-gap: ${({ columnGap }) => getSpacing(columnGap)};
`

export const HStack = styled(Stack)`
  flex-direction: row;
`
