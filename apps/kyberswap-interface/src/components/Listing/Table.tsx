import { CSSProperties, HTMLAttributes, forwardRef } from 'react'
import { Link, LinkProps } from 'react-router-dom'

import { cn } from 'utils/cn'

export const getPoolTableGridTemplateColumns = (showRewards: boolean, showPoolPrice: boolean) => {
  if (showRewards && showPoolPrice) return '1.7fr 0.8fr 0.9fr 0.9fr 1fr 1fr 156px 40px'
  if (showRewards) return '1.7fr 0.8fr 0.9fr 0.9fr 1fr 1fr 40px'
  if (showPoolPrice) return '1.7fr 0.8fr 0.9fr 0.9fr 1fr 176px 40px'
  return '1.7fr 0.8fr 0.9fr 0.9fr 1fr 40px'
}

export const getPositionTableGridTemplateColumns = () => {
  return 'minmax(260px, 2.6fr) minmax(80px, 0.8fr) minmax(90px, 0.8fr) minmax(100px, 1fr) minmax(120px, 1fr) minmax(150px, 0.4fr) minmax(160px, 1.8fr) 40px'
}

export const getSmartExitTableGridTemplateColumns = () => {
  return '40px minmax(180px, 1fr) minmax(240px, 1.5fr) minmax(110px, 0.5fr) minmax(120px, 0.6fr) minmax(80px, 0.4fr) minmax(100px, 0.5fr) 40px'
}

export const getMarketTableGridTemplateColumns = () => {
  return 'minmax(180px, 1fr) minmax(100px, 0.5fr) minmax(100px, 0.5fr) minmax(100px, 0.5fr) minmax(100px, 0.5fr) minmax(110px, 0.6fr) minmax(110px, 0.6fr) 100px'
}

type TableGridProps = HTMLAttributes<HTMLDivElement> & {
  columns: CSSProperties['gridTemplateColumns']
}

export const TableGrid = ({ className, columns, style, ...rest }: TableGridProps) => (
  <div className={cn('grid items-center', className)} style={{ ...style, gridTemplateColumns: columns }} {...rest} />
)

export const TableWrapper = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('relative overflow-hidden rounded-2xl bg-background/80', className)} {...rest} />
)

export const TableHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid items-center border-b border-tableHeader p-3 text-subText', className)} {...rest} />
)

export const TableCell = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('box-border flex h-full min-w-0 flex-col items-start justify-start gap-2 px-3 py-2', className)}
    {...rest}
  />
)

export const TableRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid items-center p-3 text-subText', className)} {...rest} />
)

export const TableRowLink = forwardRef<HTMLAnchorElement, LinkProps>(({ className, ...rest }, ref) => (
  <Link ref={ref} className={cn('grid items-center p-3 text-subText no-underline', className)} {...rest} />
))
TableRowLink.displayName = 'TableRowLink'
