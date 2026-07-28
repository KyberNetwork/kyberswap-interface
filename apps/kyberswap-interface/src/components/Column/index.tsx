import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type ColumnProps = HTMLAttributes<HTMLDivElement>

const Column = forwardRef<HTMLDivElement, ColumnProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('flex flex-col justify-start', className)} {...rest} />
))
Column.displayName = 'Column'
export default Column

export const ColumnCenter = forwardRef<HTMLDivElement, ColumnProps>(({ className, ...rest }, ref) => (
  <Column ref={ref} className={cn('w-full items-center', className)} {...rest} />
))
ColumnCenter.displayName = 'ColumnCenter'

export const AutoColumn = forwardRef<HTMLDivElement, ColumnProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('grid auto-rows-auto', className)} {...rest} />
))
AutoColumn.displayName = 'AutoColumn'
