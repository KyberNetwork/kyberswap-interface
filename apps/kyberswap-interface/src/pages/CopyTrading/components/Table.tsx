import { type HTMLAttributes, type PropsWithChildren } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonEmpty } from 'components/Button'
import RefetchIndicator from 'components/RefetchIndicator'
import { Center, HStack, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

type SortOrder = 'asc' | 'desc'

type HeaderCellProps<TSortField extends string> = PropsWithChildren<{
  activeSortBy?: TSortField
  className?: string
  onSortChange?: (sortBy: TSortField) => void
  sortField?: TSortField
  sortOrder?: SortOrder
}>

type TableCellProps = HTMLAttributes<HTMLSpanElement> & {
  padding?: 'default' | 'none'
}

type TableCardFieldProps = PropsWithChildren<{
  align?: 'left' | 'right'
  className?: string
  label: string
  span?: 'single' | 'full'
  valueClassName?: string
}>

type EmptyStateProps = {
  className?: string
  iconUrl?: string
  message: string
}

type TableBodyProps = PropsWithChildren<{
  className?: string
  empty: boolean
  emptyIconUrl?: string
  emptyMessage: string
  loading?: boolean
}>

type TableRowLinkProps = {
  label: string
  to: string
}

const TableGrid = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid w-full items-center', className)} {...rest} />
)

const EmptyState = ({ iconUrl, message, className }: EmptyStateProps) => (
  <TableGrid className={cn('min-h-[180px] grid-cols-1 p-3', className)}>
    <Center className="col-span-full gap-2 text-center">
      {iconUrl ? <img src={iconUrl} alt="" className="size-8 opacity-80" /> : null}
      <p className="text-sm font-medium text-subText">{message}</p>
    </Center>
  </TableGrid>
)

export const TableHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <TableGrid
    className={cn(
      'cursor-default border-b border-tableHeader bg-background px-3 py-1 text-xs font-medium uppercase text-subText',
      className,
    )}
    {...props}
  />
)

export const HeaderCell = <TSortField extends string>({
  activeSortBy,
  children,
  className,
  onSortChange,
  sortField,
  sortOrder,
}: HeaderCellProps<TSortField>) => {
  const sortable = !!sortField
  const active = sortable && activeSortBy === sortField
  const SortIcon = active && sortOrder === 'asc' ? ChevronUp : ChevronDown
  const content = (
    <HStack
      className={cn(
        'w-full items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-medium uppercase text-subText',
        className,
        active && 'text-primary',
      )}
    >
      {children}
      {sortable && <SortIcon size={12} className="shrink-0" />}
    </HStack>
  )

  if (!sortField) return content

  return (
    <ButtonEmpty type="button" onClick={() => onSortChange?.(sortField)} padding="0">
      {content}
    </ButtonEmpty>
  )
}

export const TableBody = ({ children, className, empty, emptyIconUrl, emptyMessage, loading }: TableBodyProps) => (
  <div className={cn('relative bg-buttonBlack-60', loading && empty && 'min-h-[180px]', className)}>
    <RefetchIndicator visible={!!loading} />
    {children}
    {!loading && empty && <EmptyState iconUrl={emptyIconUrl} message={emptyMessage} />}
  </div>
)

export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <TableGrid className={cn('px-3 py-2 text-sm text-text outline-none hover:bg-primary-10', className)} {...props} />
)

export const TableRowLink = ({ label, to }: TableRowLinkProps) => (
  <Link
    aria-label={label}
    className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
    to={to}
  />
)

export const TableCell = ({ className, padding = 'default', ...rest }: TableCellProps) => (
  <span className={cn('min-w-0 break-words', padding === 'default' && 'px-3 py-2', className)} {...rest} />
)

/**
 * Keeps responsive table-card metrics on the same two-column spacing rhythm.
 */
export const TableCardGrid = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid grid-cols-2 gap-3', className)} {...props} />
)

/**
 * Renders a label/value pair with card-safe wrapping and optional column alignment.
 */
export const TableCardField = ({
  align = 'left',
  children,
  className,
  label,
  span = 'single',
  valueClassName,
}: TableCardFieldProps) => (
  <Stack
    className={cn(
      'min-w-0 gap-0.5',
      span === 'full' && 'col-span-full',
      align === 'right' && 'items-end text-right',
      className,
    )}
  >
    <span className="text-xs font-medium uppercase text-subText">{label}</span>
    <div className={cn('min-w-0 max-w-full text-sm font-medium text-text', valueClassName)}>{children}</div>
  </Stack>
)
