import { TableRow as ListingTableRow, getMarketTableGridTemplateColumns } from 'components/Listing/Table'
import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

type HStackProps = React.ComponentProps<typeof HStack>

type MarketTableRowProps = React.ComponentProps<typeof ListingTableRow>

export const MarketTableRow = ({ className, style, ...rest }: MarketTableRowProps) => (
  <ListingTableRow
    className={cn('cursor-pointer hover:bg-primary-10 max-md:!grid-cols-[1fr_1fr_1fr]', className)}
    style={{ gridTemplateColumns: getMarketTableGridTemplateColumns(), ...style }}
    {...rest}
  />
)

export const Tabs = ({ children, className, ...rest }: HStackProps) => (
  <HStack className={cn('items-center gap-3 p-3 text-subText', className)} {...rest}>
    {children}
  </HStack>
)

export const Tab = ({
  children,
  className,
  active,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { active: boolean }) => (
  <div
    className={cn('cursor-pointer text-sm font-medium', active ? 'text-primary' : 'text-subText', className)}
    {...rest}
  >
    {children}
  </div>
)

export const ContentChangable = ({
  children,
  className,
  animate,
  up,
  ...rest
}: HStackProps & { animate: boolean; up: boolean }) => (
  <HStack
    className={cn(
      'items-center justify-end',
      animate && (up ? '[animation:ks-pulse-green_0.6s]' : '[animation:ks-pulse-red_0.6s]'),
      className,
    )}
    {...rest}
  >
    {children}
  </HStack>
)

export const TabItem = ({ children, className, active, ...rest }: HStackProps & { active?: boolean }) => (
  <HStack
    className={cn(
      'items-center rounded-full px-2 py-1',
      active ? 'bg-tabActive text-text' : 'bg-transparent text-subText',
      className,
    )}
    {...rest}
  >
    {children}
  </HStack>
)
