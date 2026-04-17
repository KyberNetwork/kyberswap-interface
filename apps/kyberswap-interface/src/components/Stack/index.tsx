import type { CSSProperties, ComponentProps } from 'react'
import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const getSpacing = (value?: CSSProperties['gap']) => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

const getLength = (value?: CSSProperties['borderRadius']) => {
  if (typeof value === 'number') return `${value}px`
  return value
}

type BoxProps = ComponentProps<typeof Box>

type StackStyleProps = Pick<
  CSSProperties,
  | 'alignItems'
  | 'background'
  | 'border'
  | 'borderRadius'
  | 'columnGap'
  | 'flexDirection'
  | 'flexWrap'
  | 'gap'
  | 'justifyContent'
  | 'position'
  | 'rowGap'
>

export type StackProps = BoxProps &
  StackStyleProps & {
    direction?: StackStyleProps['flexDirection']
    spacing?: StackStyleProps['gap']
    align?: StackStyleProps['alignItems']
    justify?: StackStyleProps['justifyContent']
    wrap?: StackStyleProps['flexWrap']
  }

export const Stack = styled(Box)<StackProps>`
  display: flex;
  position: ${({ position }) => position};
  flex-direction: ${({ direction }) => direction || 'column'};
  align-items: ${({ alignItems, align }) => alignItems || align || 'stretch'};
  justify-content: ${({ justifyContent, justify }) => justifyContent || justify || 'flex-start'};
  flex-wrap: ${({ wrap }) => wrap || 'nowrap'};
  gap: ${({ gap, spacing }) => getSpacing(gap || spacing)};
  row-gap: ${({ rowGap }) => getSpacing(rowGap)};
  column-gap: ${({ columnGap }) => getSpacing(columnGap)};
  background: ${({ background }) => background};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => getLength(borderRadius)};
`

export const HStack = styled(Stack)`
  flex-direction: row;
`

export const Center = styled(Stack)`
  align-items: center;
  justify-content: center;
`
