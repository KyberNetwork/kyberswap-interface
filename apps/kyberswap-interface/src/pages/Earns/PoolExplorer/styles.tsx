import { AnchorHTMLAttributes, CSSProperties, HTMLAttributes, createElement, forwardRef } from 'react'

import { TableWrapper } from 'components/Listing/Table'
import { cn } from 'utils/cn'

export const HeadSection = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('flex w-full items-center justify-between', className)} {...rest} />
))
HeadSection.displayName = 'HeadSection'

export const PoolTableWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <TableWrapper className={cn('max-md:bg-transparent', className)} {...rest} />
)

export const MigrateTableWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('relative !m-0 w-full overflow-hidden rounded-2xl bg-background/80', className)}
      {...rest}
    />
  ),
)
MigrateTableWrapper.displayName = 'MigrateTableWrapper'

export const SortableHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-fit cursor-pointer items-center gap-1 text-sm font-medium uppercase hover:text-text hover:[&_svg_path]:stroke-text',
        className,
      )}
      {...rest}
    />
  ),
)
SortableHeader.displayName = 'SortableHeader'

export const HeaderText = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...rest }, ref) => (
    <span ref={ref} className={cn('text-sm font-medium uppercase', className)} {...rest} />
  ),
)
HeaderText.displayName = 'HeaderText'

export const HeaderInfoWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-1 text-sm font-medium uppercase', className)} {...rest} />
  ),
)
HeaderInfoWrapper.displayName = 'HeaderInfoWrapper'

export const MigrateTableHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('grid items-center border-b border-tableHeader p-3 text-subText', className)}
      style={{ gridTemplateColumns: '2.5fr 0.8fr 1fr 1fr 1fr', ...style }}
      {...rest}
    />
  ),
)
MigrateTableHeader.displayName = 'MigrateTableHeader'

export const MigrateTableBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('max-h-[432px] overflow-y-auto max-sm:max-h-[495px]', className)} {...rest} />
  ),
)
MigrateTableBody.displayName = 'MigrateTableBody'

export const MigrateTableRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('grid items-center p-3 text-subText hover:cursor-pointer hover:bg-primary-10', className)}
      style={{ gridTemplateColumns: '2.5fr 0.8fr 1fr 1fr 1fr', ...style }}
      {...rest}
    />
  ),
)
MigrateTableRow.displayName = 'MigrateTableRow'

export const Badge = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex w-fit items-center gap-1 rounded-[30px] bg-white-08 py-1 pl-1 pr-1.5 text-xs text-subText',
      className,
    )}
    {...rest}
  />
))
Badge.displayName = 'Badge'

export const FeeTier = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex w-fit items-center gap-1 rounded-[30px] bg-white-08 px-2 py-1 text-xs text-subText max-[500px]:text-sm',
      className,
    )}
    {...rest}
  />
))
FeeTier.displayName = 'FeeTier'

export const SymbolText = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cn('max-w-[140px] truncate', className)} {...rest} />
))
SymbolText.displayName = 'SymbolText'

type AprProps = HTMLAttributes<HTMLDivElement> & { value: number }

export const Apr = forwardRef<HTMLDivElement, AprProps>(({ className, value, ...rest }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-start',
      value > 0 ? 'text-primary' : value < 0 ? 'text-red' : 'text-text',
      className,
    )}
    {...rest}
  />
))
Apr.displayName = 'Apr'

type MobileTableRowProps = HTMLAttributes<HTMLElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target' | 'rel'> & {
    /** Render as a different element — pass `a` together with `href` to make the whole row a real link. */
    as?: keyof React.JSX.IntrinsicElements
  }

export const MobileTableRow = forwardRef<HTMLElement, MobileTableRowProps>(({ as = 'div', className, ...rest }, ref) =>
  createElement(as, {
    ref,
    // An `a` row stays block-level and inherits the surrounding text color instead of taking the
    // global link color/hover.
    className: cn(
      'cursor-pointer rounded-xl bg-background p-2 hover:bg-buttonGray',
      as === 'a' && 'block text-inherit hover:text-inherit',
      className,
    ),
    ...rest,
  }),
)
MobileTableRow.displayName = 'MobileTableRow'

type MobileTableCellProps = HTMLAttributes<HTMLDivElement> & {
  alignItems?: CSSProperties['alignItems']
  justifyContent?: CSSProperties['justifyContent']
}

export const MobileTableCell = forwardRef<HTMLDivElement, MobileTableCellProps>(
  ({ className, alignItems, justifyContent, style, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('box-border flex w-full min-w-0 p-2', className)}
      style={{
        ...(alignItems ? { alignItems } : {}),
        ...(justifyContent ? { justifyContent } : {}),
        ...style,
      }}
      {...rest}
    />
  ),
)
MobileTableCell.displayName = 'MobileTableCell'

export const MobileTableBottomRow = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => <div ref={ref} className={cn('flex flex-col', className)} {...rest} />,
)
MobileTableBottomRow.displayName = 'MobileTableBottomRow'
