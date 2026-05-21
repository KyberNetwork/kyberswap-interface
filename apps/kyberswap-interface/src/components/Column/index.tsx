import { CSSProperties, HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type ColumnGap = 'sm' | 'md' | 'lg' | string
type ColumnJustify = 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between'

const resolveGap = (g?: ColumnGap): string | undefined => {
  if (g === 'sm') return '8px'
  if (g === 'md') return '12px'
  if (g === 'lg') return '24px'
  return g
}

type ColumnProps = HTMLAttributes<HTMLDivElement> & {
  gap?: ColumnGap
  justify?: ColumnJustify
}

const Column = forwardRef<HTMLDivElement, ColumnProps>(({ gap, justify, className, style, ...rest }, ref) => {
  const inline: CSSProperties = {
    gap: resolveGap(gap),
    // `justify-items` is a grid property; preserved verbatim for parity with the original styled-component.
    justifyItems: justify,
    ...style,
  }
  return <div ref={ref} className={cn('flex flex-col justify-start', className)} style={inline} {...rest} />
})
Column.displayName = 'Column'
export default Column

export const ColumnCenter = forwardRef<HTMLDivElement, ColumnProps>(({ className, ...rest }, ref) => (
  <Column ref={ref} className={cn('w-full items-center', className)} {...rest} />
))
ColumnCenter.displayName = 'ColumnCenter'

export const AutoColumn = forwardRef<HTMLDivElement, ColumnProps>(
  ({ gap, justify, className, style, ...rest }, ref) => {
    const inline: CSSProperties = {
      rowGap: resolveGap(gap),
      justifyItems: justify,
      ...style,
    }
    return <div ref={ref} className={cn('grid auto-rows-auto', className)} style={inline} {...rest} />
  },
)
AutoColumn.displayName = 'AutoColumn'
