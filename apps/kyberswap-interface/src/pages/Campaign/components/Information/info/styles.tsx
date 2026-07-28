import { cn } from 'utils/cn'

export const TableWrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('overflow-x-auto', className)} {...rest}>
    {children}
  </div>
)

export const StyledTable = ({ children, className, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className={cn('w-full border-collapse text-sm', className)} {...rest}>
    {children}
  </table>
)

export const Th = ({ children, className, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('border border-solid border-border px-3 py-2 text-center', className)} {...rest}>
    {children}
  </th>
)

export const Td = ({
  children,
  className,
  center,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { center?: boolean }) => (
  <td
    className={cn('border border-solid border-border px-3 py-2', center ? 'text-center' : 'text-left', className)}
    {...rest}
  >
    {children}
  </td>
)

export const Tr = ({ children, className, ...rest }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('hover:bg-buttonBlack', className)} {...rest}>
    {children}
  </tr>
)
