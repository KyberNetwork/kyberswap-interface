import { HTMLAttributes, forwardRef } from 'react'

import { cn } from 'utils/cn'

type TableGridProps = HTMLAttributes<HTMLDivElement> & {
  columns: string
}

export const TableHeader = forwardRef<HTMLDivElement, TableGridProps>(({ columns, className, style, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid w-full items-center border-b border-border p-3 text-xs font-semibold uppercase text-subText',
      className,
    )}
    style={{ gridTemplateColumns: columns, ...style }}
    {...rest}
  />
))
TableHeader.displayName = 'TableHeader'

export const TableRow = forwardRef<HTMLDivElement, TableGridProps>(({ columns, className, style, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'grid w-full items-center border-b border-border p-3 text-sm text-text outline-none transition-colors last:border-b-0 hover:bg-primary-12 focus-visible:bg-primary-12',
      className,
    )}
    style={{ gridTemplateColumns: columns, ...style }}
    {...rest}
  />
))
TableRow.displayName = 'TableRow'

export const TableCell = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(({ className, ...rest }, ref) => (
  <span ref={ref} className={cn('min-w-0 break-words px-3 py-2', className)} {...rest} />
))
TableCell.displayName = 'TableCell'
