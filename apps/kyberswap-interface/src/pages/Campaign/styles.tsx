import { cn } from 'utils/cn'

export const Wrapper = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mx-auto max-w-screen-md p-4', className)} {...rest}>
    {children}
  </div>
)

export const StatCard = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-[20px] bg-background p-4', className)} {...rest}>
    {children}
  </div>
)

export const Tabs = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex gap-6 text-xl font-medium max-[500px]:justify-between max-[500px]:text-base', className)}
    {...rest}
  >
    {children}
  </div>
)

export const Tab = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active: boolean }) => (
  <div
    {...rest}
    className={cn('cursor-pointer hover:text-primary', active ? 'text-primary' : 'text-subText', className)}
  >
    {children}
  </div>
)
