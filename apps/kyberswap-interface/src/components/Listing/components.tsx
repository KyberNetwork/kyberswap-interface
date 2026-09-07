import { HStack } from 'components/Stack'
import { cn } from 'utils/cn'

type HStackProps = React.ComponentProps<typeof HStack>

type ListingFilterTagProps = Omit<HStackProps, 'aria-pressed' | 'as' | 'role' | 'type'> & {
  active: boolean
}

export const ListingFilterTag = ({ active, className, ...rest }: ListingFilterTagProps) => (
  <HStack
    {...rest}
    as="button"
    type="button"
    aria-pressed={active}
    data-active={active}
    className={cn(
      'h-[42px] shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent px-4 py-1 text-sm font-medium leading-7 text-subText transition-colors duration-200 max-md:h-[38px]',
      active && 'border-primary bg-primary-20 text-text',
      !active && 'bg-background',
      'data-[active=true]:hover:border-primary data-[active=true]:hover:bg-primary-30',
      'data-[active=false]:hover:bg-primary-10',
      className,
    )}
  />
)

export const ListingFilterTagContainer = ({ className, ...rest }: HStackProps) => (
  <HStack className={cn('flex-wrap gap-4 max-sm:gap-3', className)} {...rest} />
)
