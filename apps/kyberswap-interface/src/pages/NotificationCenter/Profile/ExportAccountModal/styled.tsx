import { cn } from 'utils/cn'

export const Label = ({ children, className, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-normal leading-5', className)} {...rest}>
    {children}
  </label>
)
